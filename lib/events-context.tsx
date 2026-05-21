import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventColor =
  | "indigo"
  | "teal"
  | "rose"
  | "amber"
  | "emerald"
  | "violet";

export const EVENT_COLORS: Record<EventColor, string> = {
  indigo:  "#4F6BF4",
  teal:    "#14B8A6",
  rose:    "#F43F5E",
  amber:   "#F59E0B",
  emerald: "#10B981",
  violet:  "#8B5CF6",
};

export type ReminderOffset =
  | "none"
  | "5min"
  | "15min"
  | "30min"
  | "1hour"
  | "1day";

export const REMINDER_LABELS: Record<ReminderOffset, string> = {
  none:  "None",
  "5min":  "5 minutes before",
  "15min": "15 minutes before",
  "30min": "30 minutes before",
  "1hour": "1 hour before",
  "1day":  "1 day before",
};

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;        // ISO date string "YYYY-MM-DD"
  startTime: string;   // "HH:MM" 24h
  endTime: string;     // "HH:MM" 24h
  color: EventColor;
  reminder: ReminderOffset;
  notes: string;
  notificationId?: string;
}

// ─── State & Reducer ──────────────────────────────────────────────────────────

interface EventsState {
  events: CalendarEvent[];
  loaded: boolean;
}

type EventsAction =
  | { type: "LOAD"; events: CalendarEvent[] }
  | { type: "ADD"; event: CalendarEvent }
  | { type: "UPDATE"; event: CalendarEvent }
  | { type: "DELETE"; id: string };

function eventsReducer(state: EventsState, action: EventsAction): EventsState {
  switch (action.type) {
    case "LOAD":
      return { events: action.events, loaded: true };
    case "ADD":
      return { ...state, events: [...state.events, action.event] };
    case "UPDATE":
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.event.id ? action.event : e
        ),
      };
    case "DELETE":
      return {
        ...state,
        events: state.events.filter((e) => e.id !== action.id),
      };
  }
}

// ─── Notification Helpers ─────────────────────────────────────────────────────

function reminderOffsetMs(offset: ReminderOffset): number {
  switch (offset) {
    case "5min":  return 5 * 60 * 1000;
    case "15min": return 15 * 60 * 1000;
    case "30min": return 30 * 60 * 1000;
    case "1hour": return 60 * 60 * 1000;
    case "1day":  return 24 * 60 * 60 * 1000;
    default:      return 0;
  }
}

async function scheduleEventNotification(
  event: CalendarEvent
): Promise<string | undefined> {
  if (Platform.OS === "web") return undefined;
  if (event.reminder === "none") return undefined;

  try {
    const [year, month, day] = event.date.split("-").map(Number);
    const [hour, minute] = event.startTime.split(":").map(Number);
    const eventDate = new Date(year, month - 1, day, hour, minute);
    const triggerDate = new Date(
      eventDate.getTime() - reminderOffsetMs(event.reminder)
    );

    if (triggerDate <= new Date()) return undefined;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Upcoming: ${event.title}`,
        body: `Starts at ${formatTime(event.startTime)} — ${REMINDER_LABELS[event.reminder]}`,
        data: { eventId: event.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
    return notificationId;
  } catch {
    return undefined;
  }
}

async function cancelEventNotification(notificationId?: string) {
  if (!notificationId || Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // ignore
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const STORAGE_KEY = "@smart_scheduler_events";

// ─── Context ──────────────────────────────────────────────────────────────────

interface EventsContextValue {
  events: CalendarEvent[];
  loaded: boolean;
  addEvent: (event: Omit<CalendarEvent, "id" | "notificationId">) => Promise<void>;
  updateEvent: (event: CalendarEvent) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEventsForDate: (date: string) => CalendarEvent[];
  getUpcomingEvents: () => CalendarEvent[];
}

const EventsContext = createContext<EventsContextValue | null>(null);

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(eventsReducer, {
    events: [],
    loaded: false,
  });

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const events: CalendarEvent[] = raw ? JSON.parse(raw) : [];
        dispatch({ type: "LOAD", events });
      } catch {
        dispatch({ type: "LOAD", events: [] });
      }
    })();
  }, []);

  // Persist whenever events change (after load)
  useEffect(() => {
    if (!state.loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.events)).catch(
      () => {}
    );
  }, [state.events, state.loaded]);

  const addEvent = useCallback(
    async (eventData: Omit<CalendarEvent, "id" | "notificationId">) => {
      const id = generateId();
      const partial: CalendarEvent = { ...eventData, id };
      const notificationId = await scheduleEventNotification(partial);
      const event: CalendarEvent = { ...partial, notificationId };
      dispatch({ type: "ADD", event });
    },
    []
  );

  const updateEvent = useCallback(async (event: CalendarEvent) => {
    // Cancel old notification
    await cancelEventNotification(event.notificationId);
    // Schedule new one
    const notificationId = await scheduleEventNotification(event);
    const updated: CalendarEvent = { ...event, notificationId };
    dispatch({ type: "UPDATE", event: updated });
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    const event = state.events.find((e) => e.id === id);
    if (event) await cancelEventNotification(event.notificationId);
    dispatch({ type: "DELETE", id });
  }, [state.events]);

  const getEventsForDate = useCallback(
    (date: string) =>
      state.events
        .filter((e) => e.date === date)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [state.events]
  );

  const getUpcomingEvents = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [...state.events]
      .filter((e) => {
        const [y, m, d] = e.date.split("-").map(Number);
        return new Date(y, m - 1, d) >= today;
      })
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        return dateCompare !== 0
          ? dateCompare
          : a.startTime.localeCompare(b.startTime);
      });
  }, [state.events]);

  return (
    <EventsContext.Provider
      value={{
        events: state.events,
        loaded: state.loaded,
        addEvent,
        updateEvent,
        deleteEvent,
        getEventsForDate,
        getUpcomingEvents,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error("useEvents must be used within EventsProvider");
  return ctx;
}
