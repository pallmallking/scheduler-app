import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

import { EventForm } from "@/components/event-form";
import { useColors } from "@/hooks/use-colors";
import { useEvents } from "@/lib/events-context";

export default function NewEventScreen() {
  const router = useRouter();
  const colors = useColors();
  const { addEvent } = useEvents();
  const { date, startTime, endTime } = useLocalSearchParams<{ date?: string; startTime?: string; endTime?: string }>();

  async function handleSave(data: Parameters<typeof addEvent>[0]) {
    await addEvent(data);
    router.back();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EventForm
        initialDate={date}
        initialStartTime={startTime}
        initialEndTime={endTime}
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
