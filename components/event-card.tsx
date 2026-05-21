import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { CalendarEvent, EVENT_COLORS, formatTime } from "@/lib/events-context";

interface EventCardProps {
  event: CalendarEvent;
  onPress?: () => void;
  compact?: boolean;
}

export function EventCard({ event, onPress, compact = false }: EventCardProps) {
  const colors = useColors();
  const accentColor = EVENT_COLORS[event.color];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderLeftColor: accentColor,
        },
      ]}
    >
      <View style={[styles.colorBar, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        <Text
          style={[styles.title, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {event.title}
        </Text>
        {!compact && (
          <Text style={[styles.time, { color: colors.muted }]}>
            {formatTime(event.startTime)} – {formatTime(event.endTime)}
          </Text>
        )}
        {compact && (
          <Text style={[styles.time, { color: colors.muted }]}>
            {formatTime(event.startTime)}
          </Text>
        )}
        {event.reminder !== "none" && !compact && (
          <View style={styles.reminderRow}>
            <Text style={[styles.reminderBadge, { color: colors.warning }]}>
              ⏰ Reminder set
            </Text>
          </View>
        )}
      </View>
      {event.reminder !== "none" && compact && (
        <Text style={[styles.reminderDot, { color: colors.warning }]}>⏰</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
    overflow: "hidden",
  },
  colorBar: {
    width: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  time: {
    fontSize: 13,
    lineHeight: 18,
  },
  reminderRow: {
    marginTop: 2,
  },
  reminderBadge: {
    fontSize: 12,
    lineHeight: 16,
  },
  reminderDot: {
    fontSize: 14,
    alignSelf: "center",
    paddingRight: 12,
  },
});
