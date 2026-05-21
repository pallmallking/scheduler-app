import React from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeContext } from "@/lib/theme-provider";

export default function SettingsScreen() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const { setColorScheme } = useThemeContext();

  const isDark = colorScheme === "dark";

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Settings
          </Text>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            APPEARANCE
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.rowSubtitle, { color: colors.muted }]}>
                  Switch between light and dark theme
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={(val) =>
                  setColorScheme(val ? "dark" : "light")
                }
                trackColor={{
                  false: colors.border,
                  true: colors.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            NOTIFICATIONS
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.infoRow}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>
                Event Reminders
              </Text>
              <Text style={[styles.rowSubtitle, { color: colors.muted }]}>
                Set reminders when creating or editing events. Local
                notifications will be delivered at the scheduled time.
              </Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            ABOUT
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.infoRow}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>
                Smart Scheduler
              </Text>
              <Text style={[styles.rowSubtitle, { color: colors.muted }]}>
                Version 1.0.0
              </Text>
            </View>
            <View
              style={[styles.separator, { backgroundColor: colors.border }]}
            />
            <View style={styles.infoRow}>
              <Text style={[styles.rowSubtitle, { color: colors.muted }]}>
                A simple, elegant scheduling tool for managing your events,
                reminders, and calendar.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    lineHeight: 16,
    marginBottom: 8,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowLeft: {
    flex: 1,
    gap: 2,
  },
  infoRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  rowSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
});
