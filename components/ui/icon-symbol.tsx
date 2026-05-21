// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols → Material Icons mappings
 */
const MAPPING = {
  // Navigation & tabs
  "house.fill":                          "home",
  "calendar":                            "calendar-today",
  "calendar.badge.plus":                 "event",
  "list.bullet":                         "format-list-bulleted",
  "gearshape.fill":                      "settings",
  // Event actions
  "plus":                                "add",
  "plus.circle.fill":                    "add-circle",
  "pencil":                              "edit",
  "trash":                               "delete",
  "trash.fill":                          "delete",
  "bell":                                "notifications-none",
  "bell.fill":                           "notifications",
  "bell.slash":                          "notifications-off",
  "checkmark":                           "check",
  "checkmark.circle.fill":              "check-circle",
  "xmark":                               "close",
  "xmark.circle.fill":                  "cancel",
  // Navigation
  "chevron.left":                        "chevron-left",
  "chevron.right":                       "chevron-right",
  "chevron.left.forwardslash.chevron.right": "code",
  "paperplane.fill":                     "send",
  // Misc
  "clock":                               "access-time",
  "clock.fill":                          "access-time-filled",
  "note.text":                           "notes",
  "info.circle":                         "info",
  "moon.stars.fill":                     "dark-mode",
  "sun.max.fill":                        "light-mode",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
