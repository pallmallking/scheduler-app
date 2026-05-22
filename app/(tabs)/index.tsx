import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

import { CalendarGrid } from "@/components/calendar-grid";
import { EventCard } from "@/components/event-card";
import { WeekView } from "@/components/week-view";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useEvents } from "@/lib/events-context";

type ViewMode = "month" | "week";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addWeeks(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta * 7);
  return toDateStr(date);
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const colors = useColors();
  const router = useRouter();
  const { events, getEventsForDate } = useEvents();

  const today = new Date();
  const todayStr = toDateStr(today);

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const eventDates = useMemo(
    () => new Set(events.map((e) => e.date)),
    [events]
  );

  const selectedEvents = useMemo(
    () => getEventsForDate(selectedDate),
    [getEventsForDate, selectedDate]
  );

  // ── Month view handlers ──────────────────────────────────────────────────

  function handlePrevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function handleNextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    const [y, m] = date.split("-").map(Number);
    setYear(y);
    setMonth(m - 1);
  }

  // ── Week view handlers ───────────────────────────────────────────────────

  function handlePrevWeek() {
    const newDate = addWeeks(selectedDate, -1);
    handleSelectDate(newDate);
  }

  function handleNextWeek() {
    const newDate = addWeeks(selectedDate, 1);
    handleSelectDate(newDate);
  }

  // ── View toggle ──────────────────────────────────────────────────────────

  function handleToggleView(mode: ViewMode) {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setViewMode(mode);
  }

  // ── FAB ──────────────────────────────────────────────────────────────────

  function handleAddEvent() {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({ pathname: "/event/new", params: { date: selectedDate } });
  }

  const formattedDate = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("default", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [selectedDate]);

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* View mode toggle pill */}
      <View
        style={[
          styles.toggleBar,
          { borderBottomColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.togglePill,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.toggleOption,
              viewMode === "month" && {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={() => handleToggleView("month")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                {
                  color:
                    viewMode === "month" ? "#FFFFFF" : colors.muted,
                },
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleOption,
              viewMode === "week" && {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={() => handleToggleView("week")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                {
                  color:
                    viewMode === "week" ? "#FFFFFF" : colors.muted,
                },
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── MONTH VIEW ── */}
      {viewMode === "month" && (
        <>
          <CalendarGrid
            year={year}
            month={month}
            selectedDate={selectedDate}
            eventDates={eventDates}
            onSelectDate={handleSelectDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Selected Day Header */}
          <View style={styles.dayHeader}>
            <Text style={[styles.dayTitle, { color: colors.foreground }]}>
              {formattedDate}
            </Text>
            <Text style={[styles.eventCount, { color: colors.muted }]}>
              {selectedEvents.length === 0
                ? "No events"
                : `${selectedEvents.length} event${selectedEvents.length > 1 ? "s" : ""}`}
            </Text>
          </View>

          {/* Events List */}
          <FlatList
            data={selectedEvents}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <EventCard
                event={item}
                onPress={() => router.push(`/event/${item.id}`)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  No events on this day
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.muted }]}>
                  Tap + to add one
                </Text>
              </View>
            }
          />
        </>
      )}

      {/* ── WEEK VIEW ── */}
      {viewMode === "week" && (
        <WeekView
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={handleAddEvent}
        activeOpacity={0.85}
      >
        <IconSymbol name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  toggleBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    alignItems: "center",
  },
  togglePill: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    padding: 2,
  },
  toggleOption: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    flex: 1,
  },
  eventCount: {
    fontSize: 13,
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 32,
    gap: 6,
  },
  emptyIcon: {
    fontSize: 40,
    lineHeight: 48,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  emptySubtext: {
    fontSize: 13,
    lineHeight: 18,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
