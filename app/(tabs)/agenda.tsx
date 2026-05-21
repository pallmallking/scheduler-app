import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

import { EventCard } from "@/components/event-card";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { CalendarEvent, useEvents } from "@/lib/events-context";

type GroupedItem =
  | { type: "header"; date: string; label: string }
  | { type: "event"; event: CalendarEvent };

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === tomorrow.getTime()) return "Tomorrow";
  return date.toLocaleDateString("default", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function AgendaScreen() {
  const colors = useColors();
  const router = useRouter();
  const { getUpcomingEvents } = useEvents();
  const [refreshing, setRefreshing] = React.useState(false);

  const upcomingEvents = getUpcomingEvents();

  const groupedItems = useMemo<GroupedItem[]>(() => {
    const items: GroupedItem[] = [];
    let lastDate = "";
    for (const event of upcomingEvents) {
      if (event.date !== lastDate) {
        items.push({
          type: "header",
          date: event.date,
          label: formatDateLabel(event.date),
        });
        lastDate = event.date;
      }
      items.push({ type: "event", event });
    }
    return items;
  }, [upcomingEvents]);

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }

  function handleAddEvent() {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/event/new");
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Agenda
        </Text>
      </View>

      <FlatList
        data={groupedItems}
        keyExtractor={(item, index) =>
          item.type === "header" ? `header-${item.date}` : `event-${item.event.id}-${index}`
        }
        contentContainerStyle={[
          styles.listContent,
          groupedItems.length === 0 && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => {
          if (item.type === "header") {
            return (
              <View style={styles.dateHeader}>
                <Text
                  style={[styles.dateHeaderText, { color: colors.primary }]}
                >
                  {item.label}
                </Text>
                <View
                  style={[styles.dateLine, { backgroundColor: colors.border }]}
                />
              </View>
            );
          }
          return (
            <EventCard
              event={item.event}
              onPress={() => router.push(`/event/${item.event.id}`)}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗓️</Text>
            <Text style={[styles.emptyText, { color: colors.foreground }]}>
              No upcoming events
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>
              Tap + to schedule something
            </Text>
          </View>
        }
      />

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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flex: 1,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 4,
    gap: 10,
  },
  dateHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    lineHeight: 18,
  },
  dateLine: {
    flex: 1,
    height: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 56,
    lineHeight: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  emptySubtext: {
    fontSize: 14,
    lineHeight: 20,
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
