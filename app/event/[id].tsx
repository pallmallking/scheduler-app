import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  EVENT_COLORS,
  REMINDER_LABELS,
  formatTime,
  useEvents,
} from "@/lib/events-context";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { events, deleteEvent } = useEvents();

  const event = events.find((e) => e.id === id);

  if (!event) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text style={{ color: colors.muted, fontSize: 16 }}>
          Event not found
        </Text>
      </ScreenContainer>
    );
  }

  const accentColor = EVENT_COLORS[event.color];

  function handleEdit() {
    router.push(`/event/edit/${event!.id}`);
  }

  function handleDelete() {
    Alert.alert(
      "Delete Event",
      `Are you sure you want to delete "${event!.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
            await deleteEvent(event!.id);
            router.back();
          },
        },
      ]
    );
  }

  const [y, m, d] = event.date.split("-").map(Number);
  const displayDate = new Date(y, m - 1, d).toLocaleDateString("default", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleEdit}
            style={styles.actionBtn}
            activeOpacity={0.7}
          >
            <IconSymbol name="pencil" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.actionBtn}
            activeOpacity={0.7}
          >
            <IconSymbol name="trash.fill" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Color accent bar + title */}
        <View
          style={[styles.titleCard, { backgroundColor: accentColor + "18" }]}
        >
          <View
            style={[styles.colorAccent, { backgroundColor: accentColor }]}
          />
          <View style={styles.titleContent}>
            <Text style={[styles.eventTitle, { color: colors.foreground }]}>
              {event.title}
            </Text>
            <Text style={[styles.eventDate, { color: colors.muted }]}>
              {displayDate}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View
          style={[
            styles.detailCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Time */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <IconSymbol name="clock" size={18} color={colors.muted} />
            </View>
            <View style={styles.detailTextGroup}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>
                Time
              </Text>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>
                {formatTime(event.startTime)} – {formatTime(event.endTime)}
              </Text>
            </View>
          </View>

          <View style={[styles.detailSep, { backgroundColor: colors.border }]} />

          {/* Reminder */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <IconSymbol
                name={event.reminder !== "none" ? "bell.fill" : "bell.slash"}
                size={18}
                color={
                  event.reminder !== "none" ? colors.warning : colors.muted
                }
              />
            </View>
            <View style={styles.detailTextGroup}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>
                Reminder
              </Text>
              <Text
                style={[
                  styles.detailValue,
                  {
                    color:
                      event.reminder !== "none"
                        ? colors.warning
                        : colors.muted,
                  },
                ]}
              >
                {REMINDER_LABELS[event.reminder]}
              </Text>
            </View>
          </View>

          {/* Notes (if any) */}
          {event.notes ? (
            <>
              <View
                style={[
                  styles.detailSep,
                  { backgroundColor: colors.border },
                ]}
              />
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <IconSymbol name="note.text" size={18} color={colors.muted} />
                </View>
                <View style={styles.detailTextGroup}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>
                    Notes
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: colors.foreground },
                    ]}
                  >
                    {event.notes}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.deleteBtn, { borderColor: colors.error }]}
          onPress={handleDelete}
          activeOpacity={0.75}
        >
          <IconSymbol name="trash.fill" size={16} color={colors.error} />
          <Text style={[styles.deleteBtnText, { color: colors.error }]}>
            Delete Event
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    fontSize: 16,
    lineHeight: 22,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  titleCard: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    padding: 16,
    gap: 12,
    alignItems: "flex-start",
  },
  colorAccent: {
    width: 4,
    borderRadius: 2,
    alignSelf: "stretch",
  },
  titleContent: {
    flex: 1,
    gap: 4,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  eventDate: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  detailIcon: {
    width: 24,
    alignItems: "center",
    paddingTop: 2,
  },
  detailTextGroup: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 15,
    lineHeight: 22,
  },
  detailSep: {
    height: 1,
    marginHorizontal: 16,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 14,
    marginTop: 8,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
});
