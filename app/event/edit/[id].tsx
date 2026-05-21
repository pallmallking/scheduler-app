import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { EventForm } from "@/components/event-form";
import { useColors } from "@/hooks/use-colors";
import { CalendarEvent, useEvents } from "@/lib/events-context";

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { events, updateEvent } = useEvents();

  const event = events.find((e) => e.id === id);

  if (!event) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Text style={{ color: colors.muted, fontSize: 16, textAlign: "center" }}>
          Event not found
        </Text>
      </View>
    );
  }

  async function handleSave(
    data: Omit<CalendarEvent, "id" | "notificationId">
  ) {
    await updateEvent({ ...data, id: event!.id, notificationId: event!.notificationId });
    // Go back two levels (edit → detail → back)
    router.back();
    router.back();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EventForm
        initialEvent={event}
        onSave={handleSave}
        onCancel={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
