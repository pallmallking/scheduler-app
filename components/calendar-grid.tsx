import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/use-colors";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed
  selectedDate: string; // "YYYY-MM-DD"
  eventDates: Set<string>; // set of "YYYY-MM-DD" strings
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function CalendarGrid({
  year,
  month,
  selectedDate,
  eventDates,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: CalendarGridProps) {
  const colors = useColors();

  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  }, []);

  const monthLabel = useMemo(
    () =>
      new Date(year, month, 1).toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
    [year, month]
  );

  // Build grid: array of 6 weeks × 7 days
  const grid = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // Pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }, [year, month]);

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Month header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onPrevMonth}
          style={styles.navBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.navArrow, { color: colors.primary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: colors.foreground }]}>
          {monthLabel}
        </Text>
        <TouchableOpacity
          onPress={onNextMonth}
          style={styles.navBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.navArrow, { color: colors.primary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week labels */}
      <View style={styles.weekRow}>
        {DAYS_OF_WEEK.map((d) => (
          <Text
            key={d}
            style={[styles.dayLabel, { color: colors.muted }]}
          >
            {d}
          </Text>
        ))}
      </View>

      {/* Weeks */}
      {grid.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (day === null) {
              return <View key={di} style={styles.dayCell} />;
            }
            const ds = dateStr(day);
            const isToday = ds === todayStr;
            const isSelected = ds === selectedDate;
            const hasEvents = eventDates.has(ds);

            return (
              <TouchableOpacity
                key={di}
                style={styles.dayCell}
                onPress={() => onSelectDate(ds)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isSelected && {
                      backgroundColor: colors.primary,
                    },
                    isToday &&
                      !isSelected && {
                        borderWidth: 1.5,
                        borderColor: colors.primary,
                      },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: colors.foreground },
                      isSelected && { color: "#FFFFFF" },
                      isToday && !isSelected && { color: colors.primary },
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                {hasEvents && (
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isSelected
                          ? "#FFFFFF"
                          : colors.primary,
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
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
  monthLabel: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  weekRow: {
    flexDirection: "row",
  },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 28,
    letterSpacing: 0.3,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 2,
    minHeight: 44,
    justifyContent: "flex-start",
    paddingTop: 4,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
});
