import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useColors } from "@/hooks/use-colors";
import {
  CalendarEvent,
  EVENT_COLORS,
  EventColor,
  REMINDER_LABELS,
  ReminderOffset,
} from "@/lib/events-context";

const COLOR_OPTIONS: EventColor[] = [
  "indigo",
  "teal",
  "rose",
  "amber",
  "emerald",
  "violet",
];

const REMINDER_OPTIONS: ReminderOffset[] = [
  "none",
  "5min",
  "15min",
  "30min",
  "1hour",
  "1day",
];

interface EventFormProps {
  initialDate?: string;
  initialEvent?: CalendarEvent;
  onSave: (data: Omit<CalendarEvent, "id" | "notificationId">) => void;
  onCancel: () => void;
}

function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseTimeStr(timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatTimeStr(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("default", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDisplayTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function EventForm({
  initialDate,
  initialEvent,
  onSave,
  onCancel,
}: EventFormProps) {
  const colors = useColors();

  const today = new Date();
  const defaultDate =
    initialDate ||
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const defaultStartTime = (() => {
    const h = today.getHours();
    const m = Math.ceil(today.getMinutes() / 15) * 15;
    return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  })();

  const defaultEndTime = (() => {
    const [h, m] = defaultStartTime.split(":").map(Number);
    const endH = h + 1;
    return `${String(endH % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  })();

  const [title, setTitle] = useState(initialEvent?.title ?? "");
  const [date, setDate] = useState(initialEvent?.date ?? defaultDate);
  const [startTime, setStartTime] = useState(
    initialEvent?.startTime ?? defaultStartTime
  );
  const [endTime, setEndTime] = useState(
    initialEvent?.endTime ?? defaultEndTime
  );
  const [color, setColor] = useState<EventColor>(
    initialEvent?.color ?? "indigo"
  );
  const [reminder, setReminder] = useState<ReminderOffset>(
    initialEvent?.reminder ?? "none"
  );
  const [notes, setNotes] = useState(initialEvent?.notes ?? "");

  // Date/time picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  function handleSave() {
    if (!title.trim()) {
      Alert.alert("Title required", "Please enter a title for the event.");
      return;
    }
    onSave({ title: title.trim(), date, startTime, endTime, color, reminder, notes });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Modal Header */}
      <View
        style={[
          styles.modalHeader,
          { borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <TouchableOpacity onPress={onCancel} style={styles.headerBtn} activeOpacity={0.7}>
          <Text style={[styles.cancelText, { color: colors.muted }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.modalTitle, { color: colors.foreground }]}>
          {initialEvent ? "Edit Event" : "New Event"}
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerBtn} activeOpacity={0.7}>
          <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.muted }]}>TITLE</Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.titleInput, { color: colors.foreground }]}
              placeholder="Event title"
              placeholderTextColor={colors.muted}
              value={title}
              onChangeText={setTitle}
              returnKeyType="done"
              autoFocus={!initialEvent}
            />
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.muted }]}>DATE & TIME</Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {/* Date */}
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                setShowDatePicker(!showDatePicker);
                setShowStartPicker(false);
                setShowEndPicker(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Date</Text>
              <Text style={[styles.rowValue, { color: colors.primary }]}>
                {formatDisplayDate(date)}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={parseDateStr(date)}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={(_, selectedDate) => {
                  if (Platform.OS !== "ios") setShowDatePicker(false);
                  if (selectedDate) setDate(formatDateStr(selectedDate));
                }}
              />
            )}

            <View style={[styles.sep, { backgroundColor: colors.border }]} />

            {/* Start Time */}
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                setShowStartPicker(!showStartPicker);
                setShowDatePicker(false);
                setShowEndPicker(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                Start
              </Text>
              <Text style={[styles.rowValue, { color: colors.primary }]}>
                {formatDisplayTime(startTime)}
              </Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={parseTimeStr(startTime)}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, selectedDate) => {
                  if (Platform.OS !== "ios") setShowStartPicker(false);
                  if (selectedDate) setStartTime(formatTimeStr(selectedDate));
                }}
              />
            )}

            <View style={[styles.sep, { backgroundColor: colors.border }]} />

            {/* End Time */}
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                setShowEndPicker(!showEndPicker);
                setShowDatePicker(false);
                setShowStartPicker(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                End
              </Text>
              <Text style={[styles.rowValue, { color: colors.primary }]}>
                {formatDisplayTime(endTime)}
              </Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={parseTimeStr(endTime)}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, selectedDate) => {
                  if (Platform.OS !== "ios") setShowEndPicker(false);
                  if (selectedDate) setEndTime(formatTimeStr(selectedDate));
                }}
              />
            )}
          </View>
        </View>

        {/* Color */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.muted }]}>COLOR</Text>
          <View
            style={[
              styles.card,
              styles.colorRow,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {COLOR_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: EVENT_COLORS[c] },
                  color === c && styles.colorSwatchSelected,
                ]}
                onPress={() => setColor(c)}
                activeOpacity={0.8}
              >
                {color === c && (
                  <Text style={styles.colorCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reminder */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.muted }]}>REMINDER</Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                Reminder
              </Text>
              <Switch
                value={reminder !== "none"}
                onValueChange={(val) =>
                  setReminder(val ? "15min" : "none")
                }
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            {reminder !== "none" && (
              <>
                <View style={[styles.sep, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => setShowReminderPicker(!showReminderPicker)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    Notify me
                  </Text>
                  <Text style={[styles.rowValue, { color: colors.primary }]}>
                    {REMINDER_LABELS[reminder]}
                  </Text>
                </TouchableOpacity>
                {showReminderPicker && (
                  <View style={styles.reminderOptions}>
                    {REMINDER_OPTIONS.filter((r) => r !== "none").map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.reminderOption,
                          reminder === r && {
                            backgroundColor: colors.primary + "22",
                          },
                        ]}
                        onPress={() => {
                          setReminder(r);
                          setShowReminderPicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.reminderOptionText,
                            {
                              color:
                                reminder === r
                                  ? colors.primary
                                  : colors.foreground,
                              fontWeight: reminder === r ? "700" : "400",
                            },
                          ]}
                        >
                          {REMINDER_LABELS[r]}
                        </Text>
                        {reminder === r && (
                          <Text style={{ color: colors.primary }}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.muted }]}>NOTES</Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[
                styles.notesInput,
                { color: colors.foreground },
              ]}
              placeholder="Add notes..."
              placeholderTextColor={colors.muted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  headerBtn: {
    minWidth: 60,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  cancelText: {
    fontSize: 16,
    lineHeight: 22,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "right",
  },
  formContent: {
    paddingBottom: 60,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    lineHeight: 16,
    marginBottom: 8,
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  titleInput: {
    fontSize: 16,
    lineHeight: 22,
  },
  notesInput: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  rowValue: {
    fontSize: 15,
    lineHeight: 20,
  },
  sep: {
    height: 1,
    marginHorizontal: 14,
  },
  colorRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    alignItems: "center",
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchSelected: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  colorCheck: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },
  reminderOptions: {
    paddingBottom: 8,
  },
  reminderOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  reminderOptionText: {
    fontSize: 15,
    lineHeight: 20,
  },
});
