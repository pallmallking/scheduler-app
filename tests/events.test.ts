import { describe, it, expect } from "vitest";

// ── Utility functions extracted for testing ──────────────────────────────────

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type ReminderOffset = "none" | "5min" | "15min" | "30min" | "1hour" | "1day";

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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("formatTime", () => {
  it("formats midnight correctly", () => {
    expect(formatTime("00:00")).toBe("12:00 AM");
  });

  it("formats noon correctly", () => {
    expect(formatTime("12:00")).toBe("12:00 PM");
  });

  it("formats 9:30 AM correctly", () => {
    expect(formatTime("09:30")).toBe("9:30 AM");
  });

  it("formats 13:45 as 1:45 PM", () => {
    expect(formatTime("13:45")).toBe("1:45 PM");
  });

  it("formats 23:59 as 11:59 PM", () => {
    expect(formatTime("23:59")).toBe("11:59 PM");
  });
});

describe("generateId", () => {
  it("generates unique IDs", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it("generates a non-empty string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });
});

describe("reminderOffsetMs", () => {
  it("returns 0 for none", () => {
    expect(reminderOffsetMs("none")).toBe(0);
  });

  it("returns 5 minutes in ms", () => {
    expect(reminderOffsetMs("5min")).toBe(5 * 60 * 1000);
  });

  it("returns 15 minutes in ms", () => {
    expect(reminderOffsetMs("15min")).toBe(15 * 60 * 1000);
  });

  it("returns 30 minutes in ms", () => {
    expect(reminderOffsetMs("30min")).toBe(30 * 60 * 1000);
  });

  it("returns 1 hour in ms", () => {
    expect(reminderOffsetMs("1hour")).toBe(60 * 60 * 1000);
  });

  it("returns 1 day in ms", () => {
    expect(reminderOffsetMs("1day")).toBe(24 * 60 * 60 * 1000);
  });
});

describe("event sorting", () => {
  type SimpleEvent = { id: string; date: string; startTime: string };

  function sortEvents(events: SimpleEvent[]): SimpleEvent[] {
    return [...events].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      return dateCompare !== 0
        ? dateCompare
        : a.startTime.localeCompare(b.startTime);
    });
  }

  it("sorts events by date ascending", () => {
    const events: SimpleEvent[] = [
      { id: "3", date: "2026-06-01", startTime: "09:00" },
      { id: "1", date: "2026-05-20", startTime: "10:00" },
      { id: "2", date: "2026-05-25", startTime: "14:00" },
    ];
    const sorted = sortEvents(events);
    expect(sorted.map((e) => e.id)).toEqual(["1", "2", "3"]);
  });

  it("sorts events on the same date by start time", () => {
    const events: SimpleEvent[] = [
      { id: "b", date: "2026-05-21", startTime: "14:00" },
      { id: "a", date: "2026-05-21", startTime: "09:00" },
      { id: "c", date: "2026-05-21", startTime: "11:30" },
    ];
    const sorted = sortEvents(events);
    expect(sorted.map((e) => e.id)).toEqual(["a", "c", "b"]);
  });
});

describe("upcoming events filter", () => {
  type SimpleEvent = { id: string; date: string };

  function getUpcoming(events: SimpleEvent[], todayStr: string): SimpleEvent[] {
    const [ty, tm, td] = todayStr.split("-").map(Number);
    const today = new Date(ty, tm - 1, td);
    today.setHours(0, 0, 0, 0);
    return events.filter((e) => {
      const [y, m, d] = e.date.split("-").map(Number);
      return new Date(y, m - 1, d) >= today;
    });
  }

  it("includes today's events", () => {
    const events: SimpleEvent[] = [
      { id: "today", date: "2026-05-21" },
      { id: "past", date: "2026-05-20" },
      { id: "future", date: "2026-05-22" },
    ];
    const upcoming = getUpcoming(events, "2026-05-21");
    expect(upcoming.map((e) => e.id)).toContain("today");
    expect(upcoming.map((e) => e.id)).not.toContain("past");
    expect(upcoming.map((e) => e.id)).toContain("future");
  });
});
