import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

export type PermissionStatus = "undetermined" | "granted" | "denied";

export function useNotificationPermissions() {
  const [status, setStatus] = useState<PermissionStatus>("undetermined");

  useEffect(() => {
    if (Platform.OS === "web") return;

    (async () => {
      // Set up Android notification channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Smart Scheduler",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#4F6BF4",
        });
      }

      const { status: existing } = await Notifications.getPermissionsAsync();
      if (existing === "granted") {
        setStatus("granted");
        return;
      }

      // Request permissions on first launch
      const { status: requested } =
        await Notifications.requestPermissionsAsync();
      setStatus(requested === "granted" ? "granted" : "denied");
    })();
  }, []);

  return status;
}
