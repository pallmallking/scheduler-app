import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { DimensionValue } from "react-native";

import { useColors } from "@/hooks/use-colors";
import {
  CalendarEvent,
  EVENT_COLORS,
  formatTime,
  useEvents,
} from "@/lib/events-context";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 64;
const TIME_LABEL_WIDTH = 52;
const TOTAL_HEIGHT = HOUR_HEIGHT * 24;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SNAP_MINUTES = 15; // snap to 15-min intervals

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getWeekDates(anchorDate: Date): Date[] {
  const day = anchorDate.getDay();
  const sunday = new Date(anchorDate);
  sunday.setDate(anchorDate.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToY(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT;
}

function snapToInterval(minutes: number, interval: number): number {
  return Math.round(minutes / interval) * interval;
}

function minutesToTimeStr(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(totalMinutes, 23 * 60 + 59));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface PositionedEvent {
  event: CalendarEvent;
  top: number;
  height: number;
  column: number;
  totalColumns: number;
}

function layoutDayEvents(events: CalendarEvent[]): PositionedEvent[] {
  if (events.length === 0) return [];
  const sorted = [...events].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );
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
      const durationMin = Math.max(endMin - startMin, 30);
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

// ─── Drag state ───────────────────────────────────────────────────────────────

interface DragState {
  eventId: string;
  originalDate: string;
  originalStartTime: string;
  originalEndTime: string;
  durationMinutes: number;
  /** Y offset of the finger within the event block when drag started */
  offsetY: number;
}

// ─── WeekStrip ────────────────────────────────────────────────────────────────

interface WeekStripProps {
  weekDates: Date[];
  selectedDate: string;
  eventDates: Set<string>;
  dropTargetDate: string | null;
  onSelectDate: (date: string) => void;
}

function WeekStrip({
  weekDates,
  selectedDate,
  eventDates,
  dropTargetDate,
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
      <View style={{ width: TIME_LABEL_WIDTH }} />
      {weekDates.map((date, i) => {
        const ds = toDateStr(date);
        const isToday = ds === todayStr;
        const isSelected = ds === selectedDate;
        const hasEvents = eventDates.has(ds);
        const isDropTarget = ds === dropTargetDate;

        return (
          <TouchableOpacity
            key={i}
            style={[
              styles.weekDayCell,
              isDropTarget && {
                backgroundColor: colors.primary + "18",
                borderRadius: 8,
              },
            ]}
            onPress={() => onSelectDate(ds)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.weekDayLabel,
                { color: isToday || isDropTarget ? colors.primary : colors.muted },
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
                  { backgroundColor: isSelected ? "#FFFFFF" : colors.primary },
                ]}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── DraggableEventBlock ──────────────────────────────────────────────────────

interface DraggableEventBlockProps {
  event: CalendarEvent;
  top: number;
  height: number;
  colLeft: DimensionValue;
  colWidth: DimensionValue;
  isDragging: boolean;
  onPress: () => void;
  onDragStart: (eventId: string, offsetY: number) => void;
  onDragMove: (absoluteX: number, absoluteY: number) => void;
  onDragEnd: () => void;
}

function DraggableEventBlock({
  event,
  top,
  height,
  colLeft,
  colWidth,
  isDragging,
  onPress,
  onDragStart,
  onDragMove,
  onDragEnd,
}: DraggableEventBlockProps) {
  const colors = useColors();
  const accentColor = EVENT_COLORS[event.color];
  const blockHeight = Math.max(height, 28);

  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Long-press gesture to start drag
  const longPressGesture = Gesture.LongPress()
    .minDuration(350)
    .onStart((e) => {
      "worklet";
      opacity.value = withTiming(0.35, { duration: 150 });
      scale.value = withSpring(0.97);
      runOnJS(onDragStart)(event.id, e.y);
    });

  // Pan gesture for movement (only active while dragging)
  const panGesture = Gesture.Pan()
    .activateAfterLongPress(350)
    .onUpdate((e) => {
      "worklet";
      runOnJS(onDragMove)(e.absoluteX, e.absoluteY);
    })
    .onEnd(() => {
      "worklet";
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1);
      runOnJS(onDragEnd)();
    })
    .onFinalize(() => {
      "worklet";
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1);
    });

  const composed = Gesture.Simultaneous(longPressGesture, panGesture);

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          styles.eventBlock,
          {
            top,
            height: blockHeight,
            left: colLeft,
            width: colWidth,
            backgroundColor: accentColor + "22",
            borderLeftColor: accentColor,
          },
          animStyle,
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onPress}
          activeOpacity={0.75}
        >
          <Text
            style={[styles.eventBlockTitle, { color: accentColor }]}
            numberOfLines={1}
          >
            {event.title}
          </Text>
          {blockHeight >= 40 && (
            <Text
              style={[styles.eventBlockTime, { color: accentColor + "CC" }]}
              numberOfLines={1}
            >
              {formatTime(event.startTime)}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

// ─── GhostBlock ───────────────────────────────────────────────────────────────

interface GhostBlockProps {
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  title: string;
  snappedTime: string;
}

function GhostBlock({
  visible,
  x,
  y,
  width,
  height,
  color,
  title,
  snappedTime,
}: GhostBlockProps) {
  const colors = useColors();
  if (!visible) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.ghost,
        {
          left: x,
          top: y,
          width,
          height: Math.max(height, 28),
          backgroundColor: color + "44",
          borderLeftColor: color,
          borderColor: color,
          shadowColor: color,
        },
      ]}
    >
      <Text style={[styles.ghostTitle, { color }]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[styles.ghostTime, { color: colors.muted }]}>
        {snappedTime}
      </Text>
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
  const { events, updateEvent } = useEvents();
  const scrollRef = useRef<ScrollView>(null);

  // ── Layout measurements ────────────────────────────────────────────────────
  // We measure the grid container's absolute position on screen so we can
  // translate absolute touch coordinates into grid-relative coordinates.
  const gridContainerRef = useRef<View>(null);
  const gridLayout = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // ── Drag state ─────────────────────────────────────────────────────────────
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const [dropTargetDate, setDropTargetDate] = useState<string | null>(null);
  const [snappedStartTime, setSnappedStartTime] = useState("00:00");
  const scrollOffsetY = useRef(0);

  // ── Derived values ─────────────────────────────────────────────────────────
  const anchorDate = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate]);

  const weekDates = useMemo(() => getWeekDates(anchorDate), [anchorDate]);

  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.toLocaleDateString("default", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}`;
  }, [weekDates]);

  const eventDates = useMemo(
    () => new Set(events.map((e) => e.date)),
    [events]
  );

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

  // Auto-scroll to current time on mount
  useEffect(() => {
    const now = new Date();
    const scrollY = Math.max(minutesToY(now.getHours() * 60 + now.getMinutes()) - 80, 0);
    setTimeout(() => scrollRef.current?.scrollTo({ y: scrollY, animated: false }), 100);
  }, []);

  const now = new Date();
  const currentTimeY = minutesToY(now.getHours() * 60 + now.getMinutes());
  const todayStr = toDateStr(now);
  const isCurrentWeek = weekDates.some((d) => toDateStr(d) === todayStr);

  // ── Column width calculation ───────────────────────────────────────────────
  // We need the pixel width of a single day column for ghost sizing.
  const [dayColumnWidth, setDayColumnWidth] = useState(0);

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const handleDragStart = useCallback(
    (eventId: string, offsetY: number) => {
      const event = events.find((e) => e.id === eventId);
      if (!event) return;
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      const durationMinutes =
        timeToMinutes(event.endTime) - timeToMinutes(event.startTime);
      setDragState({
        eventId,
        originalDate: event.date,
        originalStartTime: event.startTime,
        originalEndTime: event.endTime,
        durationMinutes: Math.max(durationMinutes, 30),
        offsetY,
      });
      setSnappedStartTime(event.startTime);
    },
    [events]
  );

  const handleDragMove = useCallback(
    (absoluteX: number, absoluteY: number) => {
      if (!dragState) return;

      const layout = gridLayout.current;
      // Convert absolute screen coords → grid-relative coords
      const relX = absoluteX - layout.x;
      const relY = absoluteY - layout.y + scrollOffsetY.current - dragState.offsetY;

      // Determine which day column the finger is over
      const gridWidth = layout.width - TIME_LABEL_WIDTH;
      const colWidth = gridWidth / 7;
      const colIndex = Math.max(
        0,
        Math.min(6, Math.floor((relX - TIME_LABEL_WIDTH) / colWidth))
      );
      const targetDate = toDateStr(weekDates[colIndex]);

      // Snap Y to 15-min intervals
      const rawMinutes = Math.max(0, (relY / HOUR_HEIGHT) * 60);
      const snappedMinutes = snapToInterval(rawMinutes, SNAP_MINUTES);
      const clampedMinutes = Math.max(
        0,
        Math.min(snappedMinutes, 24 * 60 - dragState.durationMinutes)
      );

      const newStartTime = minutesToTimeStr(clampedMinutes);
      const ghostX = layout.x + TIME_LABEL_WIDTH + colIndex * colWidth;
      const ghostY = layout.y - scrollOffsetY.current + minutesToY(clampedMinutes);

      setGhostPos({ x: ghostX, y: ghostY });
      setDropTargetDate(targetDate);
      setSnappedStartTime(newStartTime);
    },
    [dragState, weekDates]
  );

  const handleDragEnd = useCallback(async () => {
    if (!dragState || !dropTargetDate) {
      setDragState(null);
      setDropTargetDate(null);
      return;
    }

    const newStartMinutes = timeToMinutes(snappedStartTime);
    const newEndMinutes = newStartMinutes + dragState.durationMinutes;
    const newEndTime = minutesToTimeStr(newEndMinutes);

    const changed =
      dropTargetDate !== dragState.originalDate ||
      snappedStartTime !== dragState.originalStartTime;

    if (changed) {
      const event = events.find((e) => e.id === dragState.eventId);
      if (event) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        await updateEvent({
          ...event,
          date: dropTargetDate,
          startTime: snappedStartTime,
          endTime: newEndTime,
        });
      }
    }

    setDragState(null);
    setDropTargetDate(null);
  }, [dragState, dropTargetDate, snappedStartTime, events, updateEvent]);

  const handleEmptyPress = useCallback(
    (dateStr: string, hour: number) => {
      if (dragState) return; // ignore taps during drag
      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endHour = Math.min(hour + 1, 23);
      router.push({
        pathname: "/event/new",
        params: { date: dateStr, startTime, endTime: `${String(endHour).padStart(2, "0")}:00` },
      });
    },
    [router, dragState]
  );

  // Ghost event data
  const draggingEvent = dragState
    ? events.find((e) => e.id === dragState.eventId)
    : null;
  const ghostHeight = dragState
    ? minutesToY(dragState.durationMinutes)
    : 0;

  return (
    <View style={styles.container}>
      {/* Week navigation header */}
      <View
        style={[
          styles.navHeader,
          { borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <TouchableOpacity onPress={onPrevWeek} style={styles.navBtn} activeOpacity={0.7}>
          <Text style={[styles.navArrow, { color: colors.primary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.weekLabel, { color: colors.foreground }]}>
          {weekLabel}
        </Text>
        <TouchableOpacity onPress={onNextWeek} style={styles.navBtn} activeOpacity={0.7}>
          <Text style={[styles.navArrow, { color: colors.primary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day strip header */}
      <WeekStrip
        weekDates={weekDates}
        selectedDate={selectedDate}
        eventDates={eventDates}
        dropTargetDate={dropTargetDate}
        onSelectDate={onSelectDate}
      />

      {/* Drag hint */}
      {!dragState && (
        <View style={styles.hintBar}>
          <Text style={[styles.hintText, { color: colors.muted }]}>
            Long-press an event to drag and reschedule
          </Text>
        </View>
      )}
      {dragState && (
        <View style={[styles.hintBar, { backgroundColor: colors.primary + "12" }]}>
          <Text style={[styles.hintText, { color: colors.primary }]}>
            Drop to reschedule · {snappedStartTime}
          </Text>
        </View>
      )}

      {/* Time grid */}
      <View
        ref={gridContainerRef}
        style={styles.gridWrapper}
        onLayout={() => {
          gridContainerRef.current?.measureInWindow((x, y, width, height) => {
            gridLayout.current = { x, y, width, height };
            const colW = (width - TIME_LABEL_WIDTH) / 7;
            setDayColumnWidth(colW);
          });
        }}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.gridScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ height: TOTAL_HEIGHT }}
          scrollEnabled={!dragState}
          onScroll={(e) => {
            scrollOffsetY.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          <View style={styles.gridContainer}>
            {/* Time labels */}
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
              const isDropTarget = ds === dropTargetDate;

              return (
                <View
                  key={dayIndex}
                  style={[
                    styles.dayColumn,
                    isDropTarget && dragState
                      ? { backgroundColor: colors.primary + "0C" }
                      : undefined,
                  ]}
                >
                  {/* Hour cells */}
                  {HOURS.map((h) => (
                    <View
                      key={h}
                      style={[
                        styles.hourCell,
                        { height: HOUR_HEIGHT, borderTopColor: colors.border },
                      ]}
                      onTouchEnd={() => handleEmptyPress(ds, h)}
                    />
                  ))}

                  {/* Today tint */}
                  {isToday && (
                    <View
                      style={[styles.todayTint, { backgroundColor: colors.primary + "08" }]}
                      pointerEvents="none"
                    />
                  )}

                  {/* Drop target highlight line */}
                  {isDropTarget && dragState && (
                    <View
                      style={[
                        styles.dropTargetLine,
                        {
                          top: minutesToY(timeToMinutes(snappedStartTime)),
                          backgroundColor: colors.primary,
                        },
                      ]}
                      pointerEvents="none"
                    />
                  )}

                  {/* Event blocks */}
                  {positioned.map(({ event, top, height, column, totalColumns }) => {
                    const colWidth: DimensionValue = `${100 / totalColumns}%`;
                    const colLeft: DimensionValue = `${(column / totalColumns) * 100}%`;
                    const isBeingDragged = dragState?.eventId === event.id;

                    return (
                      <DraggableEventBlock
                        key={event.id}
                        event={event}
                        top={top}
                        height={height}
                        colLeft={colLeft}
                        colWidth={colWidth}
                        isDragging={isBeingDragged}
                        onPress={() => {
                          if (!dragState) router.push(`/event/${event.id}`);
                        }}
                        onDragStart={handleDragStart}
                        onDragMove={handleDragMove}
                        onDragEnd={handleDragEnd}
                      />
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
                        style={[styles.currentTimeDot, { backgroundColor: colors.error }]}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Floating ghost block (rendered outside ScrollView so it's not clipped) */}
        {draggingEvent && dragState && (
          <GhostBlock
            visible
            x={ghostPos.x - gridLayout.current.x}
            y={ghostPos.y - gridLayout.current.y}
            width={dayColumnWidth - 4}
            height={ghostHeight}
            color={EVENT_COLORS[draggingEvent.color]}
            title={draggingEvent.title}
            snappedTime={`${formatTime(snappedStartTime)}`}
          />
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  navBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  navArrow: { fontSize: 28, lineHeight: 32, fontWeight: "300" },
  weekLabel: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  weekStrip: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
  },
  weekDayCell: { flex: 1, alignItems: "center", gap: 2, paddingVertical: 2 },
  weekDayLabel: { fontSize: 11, fontWeight: "600", lineHeight: 14, letterSpacing: 0.2 },
  weekDayCircle: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  weekDayNumber: { fontSize: 13, fontWeight: "500", lineHeight: 16 },
  weekDot: { width: 4, height: 4, borderRadius: 2 },
  hintBar: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: "center",
  },
  hintText: {
    fontSize: 11,
    lineHeight: 16,
  },
  gridWrapper: { flex: 1, overflow: "hidden" },
  gridScroll: { flex: 1 },
  gridContainer: { flexDirection: "row", height: TOTAL_HEIGHT },
  timeColumn: { paddingTop: 0 },
  hourLabelRow: {
    justifyContent: "flex-start",
    paddingTop: 4,
    paddingRight: 6,
    alignItems: "flex-end",
  },
  hourLabel: { fontSize: 10, fontWeight: "500", lineHeight: 12 },
  dayColumn: { flex: 1, position: "relative" },
  hourCell: { borderTopWidth: 0.5 },
  todayTint: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  dropTargetLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
  eventBlock: {
    position: "absolute",
    right: 2,
    borderRadius: 4,
    borderLeftWidth: 3,
    overflow: "hidden",
  },
  eventBlockTitle: { fontSize: 11, fontWeight: "700", lineHeight: 14, paddingHorizontal: 4, paddingTop: 2 },
  eventBlockTime: { fontSize: 10, lineHeight: 13, paddingHorizontal: 4 },
  currentTimeLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  currentTimeDot: { width: 8, height: 8, borderRadius: 4, marginLeft: -4, marginTop: -3 },
  ghost: {
    position: "absolute",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderWidth: 1.5,
    paddingHorizontal: 6,
    paddingVertical: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 999,
  },
  ghostTitle: { fontSize: 12, fontWeight: "700", lineHeight: 16 },
  ghostTime: { fontSize: 11, lineHeight: 15, marginTop: 1 },
});
