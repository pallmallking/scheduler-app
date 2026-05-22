import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/use-colors";
import {
  CalendarEvent,
  EVENT_COLORS,
  formatTime,
  useEvents,
} from "@/lib/events-context";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 64; // px per hour
const TIME_LABEL_WIDTH = 52; // px for the left time column
const TOTAL_HEIGHT = HOUR_HEIGHT * 24;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekDates(anchorDate: Date): Date[] {
  const day = anchorDate.getDay(); // 0=Sun
  const sunday = new Date(anchorDate);
  sunday.setDate(anchorDate.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToY(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT;
}

interface PositionedEvent {
  event: CalendarEvent;
  top: number;
  height: number;
  column: number;
  totalColumns: number;
}

/** Lay out events for a single day, handling overlaps with column splitting */
function layoutDayEvents(events: CalendarEvent[]): PositionedEvent[] {
  if (events.length === 0) return [];

  // Sort by start time
  const sorted = [...events].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  // Group overlapping events into clusters
  const clusters: CalendarEvent[][] = [];
  let currentCluster: CalendarEvent[] = [];
  let clusterEnd = 0;

  for (const ev of sorted) {
    const start = timeToMinutes(ev.startTime);
    const end = timeToMinutes(ev.endTime);
    if (currentCluster.length === 0 || start < clusterEnd) {
      currentCluster.push(ev);
      clusterEnd = Math.max(clusterEnd, end);
    } else {
      clusters.push(currentCluster);
      currentCluster = [ev];
      clusterEnd = end;
    }
  }
  if (currentCluster.length > 0) clusters.push(currentCluster);

  const result: PositionedEvent[] = [];

  for (const cluster of clusters) {
    const n = cluster.length;
    cluster.forEach((ev, i) => {
      const startMin = timeToMinutes(ev.startTime);
      const endMin = timeToMinutes(ev.endTime);
      const durationMin = Math.max(endMin - startMin, 30); // min 30min height
      result.push({
        event: ev,
        top: minutesToY(startMin),
        height: minutesToY(durationMin),
        column: i,
        totalColumns: n,
      });
    });
  }

  return result;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface WeekStripProps {
  weekDates: Date[];
  selectedDate: string;
  eventDates: Set<string>;
  onSelectDate: (date: string) => void;
}

function WeekStrip({
  weekDates,
  selectedDate,
  eventDates,
  onSelectDate,
}: WeekStripProps) {
  const colors = useColors();
  const todayStr = toDateStr(new Date());
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <View
      style={[
        styles.weekStrip,
        { borderBottomColor: colors.border, backgroundColor: colors.background },
      ]}
    >
      {/* Spacer for time label column */}
      <View style={{ width: TIME_LABEL_WIDTH }} />
      {weekDates.map((date, i) => {
        const ds = toDateStr(date);
        const isToday = ds === todayStr;
        const isSelected = ds === selectedDate;
        const hasEvents = eventDates.has(ds);

        return (
          <TouchableOpacity
            key={i}
            style={styles.weekDayCell}
            onPress={() => onSelectDate(ds)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.weekDayLabel,
                { color: isToday ? colors.primary : colors.muted },
              ]}
            >
              {DAY_LABELS[i]}
            </Text>
            <View
              style={[
                styles.weekDayCircle,
                isSelected && { backgroundColor: colors.primary },
                isToday && !isSelected && {
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.weekDayNumber,
                  { color: colors.foreground },
                  isSelected && { color: "#FFFFFF" },
                  isToday && !isSelected && { color: colors.primary },
                ]}
              >
                {date.getDate()}
              </Text>
            </View>
            {hasEvents && (
              <View
                style={[
                  styles.weekDot,
                  {
                    backgroundColor: isSelected ? "#FFFFFF" : colors.primary,
                  },
                ]}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main WeekView ────────────────────────────────────────────────────────────

interface WeekViewProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export function WeekView({
  selectedDate,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
}: WeekViewProps) {
  const colors = useColors();
  const router = useRouter();
  const { events } = useEvents();
  const scrollRef = useRef<ScrollView>(null);

  const anchorDate = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate]);

  const weekDates = useMemo(() => getWeekDates(anchorDate), [anchorDate]);

  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    const startLabel = start.toLocaleDateString("default", {
      month: "short",
      day: "numeric",
    });
    const endLabel = end.toLocaleDateString("default", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${startLabel} – ${endLabel}`;
  }, [weekDates]);

  const eventDates = useMemo(
    () => new Set(events.map((e) => e.date)),
    [events]
  );

  // Group events by date for the visible week
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const date of weekDates) {
      const ds = toDateStr(date);
      map[ds] = events
        .filter((e) => e.date === ds)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [events, weekDates]);

  // Auto-scroll to current time (or 8am) on mount
  useEffect(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const scrollY = Math.max(minutesToY(currentMinutes) - 80, 0);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: scrollY, animated: false });
    }, 100);
  }, []);

  const handleEmptyPress = useCallback(
    (dateStr: string, hour: number) => {
      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endHour = Math.min(hour + 1, 23);
      router.push({
        pathname: "/event/new",
        params: { date: dateStr, startTime, endTime: `${String(endHour).padStart(2, "0")}:00` },
      });
    },
    [router]
  );

  // Current time indicator
  const now = new Date();
  const currentTimeY = minutesToY(now.getHours() * 60 + now.getMinutes());
  const todayStr = toDateStr(now);
  const isCurrentWeek = weekDates.some((d) => toDateStr(d) === todayStr);

  return (
    <View style={styles.container}>
      {/* Week navigation header */}
      <View
        style={[
          styles.navHeader,
          { borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <TouchableOpacity
          onPress={onPrevWeek}
          style={styles.navBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.navArrow, { color: colors.primary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.weekLabel, { color: colors.foreground }]}>
          {weekLabel}
        </Text>
        <TouchableOpacity
          onPress={onNextWeek}
          style={styles.navBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.navArrow, { color: colors.primary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day strip header */}
      <WeekStrip
        weekDates={weekDates}
        selectedDate={selectedDate}
        eventDates={eventDates}
        onSelectDate={onSelectDate}
      />

      {/* Time grid */}
      <ScrollView
        ref={scrollRef}
        style={styles.gridScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ height: TOTAL_HEIGHT }}
      >
        <View style={styles.gridContainer}>
          {/* Time labels column */}
          <View style={[styles.timeColumn, { width: TIME_LABEL_WIDTH }]}>
            {HOURS.map((h) => (
              <View key={h} style={[styles.hourLabelRow, { height: HOUR_HEIGHT }]}>
                {h > 0 && (
                  <Text style={[styles.hourLabel, { color: colors.muted }]}>
                    {h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* Day columns */}
          {weekDates.map((date, dayIndex) => {
            const ds = toDateStr(date);
            const dayEvents = eventsByDate[ds] ?? [];
            const positioned = layoutDayEvents(dayEvents);
            const isToday = ds === todayStr;

            return (
              <View key={dayIndex} style={styles.dayColumn}>
                {/* Hour grid lines + tap areas */}
                {HOURS.map((h) => (
                  <Pressable
                    key={h}
                    style={({ pressed }) => [
                      styles.hourCell,
                      { height: HOUR_HEIGHT, borderTopColor: colors.border },
                      pressed && { backgroundColor: colors.primary + "12" },
                    ]}
                    onPress={() => handleEmptyPress(ds, h)}
                  />
                ))}

                {/* Today column tint */}
                {isToday && (
                  <View
                    style={[
                      styles.todayTint,
                      { backgroundColor: colors.primary + "08" },
                    ]}
                    pointerEvents="none"
                  />
                )}

                {/* Event blocks */}
                {positioned.map(({ event, top, height, column, totalColumns }) => {
                  const accentColor = EVENT_COLORS[event.color];
                  const colWidth = `${100 / totalColumns}%` as const;
                  const colLeft = `${(column / totalColumns) * 100}%` as const;

                  return (
                    <TouchableOpacity
                      key={event.id}
                      style={[
                        styles.eventBlock,
                        {
                          top,
                          height: Math.max(height, 28),
                          left: colLeft,
                          width: colWidth,
                          backgroundColor: accentColor + "22",
                          borderLeftColor: accentColor,
                        },
                      ]}
                      onPress={() => router.push(`/event/${event.id}`)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[styles.eventBlockTitle, { color: accentColor }]}
                        numberOfLines={1}
                      >
                        {event.title}
                      </Text>
                      {height >= 40 && (
                        <Text
                          style={[styles.eventBlockTime, { color: accentColor + "CC" }]}
                          numberOfLines={1}
                        >
                          {formatTime(event.startTime)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Current time indicator */}
                {isToday && isCurrentWeek && (
                  <View
                    style={[
                      styles.currentTimeLine,
                      { top: currentTimeY, backgroundColor: colors.error },
                    ]}
                    pointerEvents="none"
                  >
                    <View
                      style={[
                        styles.currentTimeDot,
                        { backgroundColor: colors.error },
                      ]}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  navArrow: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "300",
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  weekStrip: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
  },
  weekDayCell: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  weekDayLabel: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  weekDayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  weekDayNumber: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 16,
  },
  weekDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  gridScroll: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: "row",
    height: TOTAL_HEIGHT,
  },
  timeColumn: {
    paddingTop: 0,
  },
  hourLabelRow: {
    justifyContent: "flex-start",
    paddingTop: 4,
    paddingRight: 6,
    alignItems: "flex-end",
  },
  hourLabel: {
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 12,
  },
  dayColumn: {
    flex: 1,
    position: "relative",
  },
  hourCell: {
    borderTopWidth: 0.5,
  },
  todayTint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  eventBlock: {
    position: "absolute",
    left: 0,
    right: 2,
    borderRadius: 4,
    borderLeftWidth: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    overflow: "hidden",
  },
  eventBlockTitle: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  eventBlockTime: {
    fontSize: 10,
    lineHeight: 13,
  },
  currentTimeLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  currentTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -3,
  },
});
