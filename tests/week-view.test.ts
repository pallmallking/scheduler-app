import { describe, it, expect } from "vitest";

// ── Helpers mirrored from week-view.tsx ──────────────────────────────────────

function getWeekDates(anchorDate: Date): Date[] {
  const day = anchorDate.getDay();
  const sunday = new Date(anchorDate);
  sunday.setDate(anchorDate.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToY(minutes: number, hourHeight = 64): number {
  return (minutes / 60) * hourHeight;
}

function addWeeks(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta * 7);
  return toDateStr(date);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("getWeekDates", () => {
  it("returns 7 dates starting on Sunday", () => {
    const anchor = new Date(2026, 4, 22); // Friday May 22
    const week = getWeekDates(anchor);
    expect(week).toHaveLength(7);
    expect(week[0].getDay()).toBe(0); // Sunday
    expect(week[6].getDay()).toBe(6); // Saturday
  });

  it("includes the anchor date in the week", () => {
    const anchor = new Date(2026, 4, 22);
    const week = getWeekDates(anchor);
    const strs = week.map(toDateStr);
    expect(strs).toContain("2026-05-22");
  });

  it("starts on Sunday when anchor is Sunday", () => {
    const anchor = new Date(2026, 4, 17); // Sunday May 17
    const week = getWeekDates(anchor);
    expect(toDateStr(week[0])).toBe("2026-05-17");
  });

  it("starts on Sunday when anchor is Saturday", () => {
    const anchor = new Date(2026, 4, 23); // Saturday May 23
    const week = getWeekDates(anchor);
    // Week starts on Sunday May 17 (6 days before Saturday)
    expect(toDateStr(week[0])).toBe("2026-05-17");
    expect(toDateStr(week[6])).toBe("2026-05-23"); // ends on Saturday
  });
});

describe("timeToMinutes", () => {
  it("converts midnight to 0", () => {
    expect(timeToMinutes("00:00")).toBe(0);
  });

  it("converts noon to 720", () => {
    expect(timeToMinutes("12:00")).toBe(720);
  });

  it("converts 9:30 to 570", () => {
    expect(timeToMinutes("09:30")).toBe(570);
  });

  it("converts 23:59 to 1439", () => {
    expect(timeToMinutes("23:59")).toBe(1439);
  });
});

describe("minutesToY", () => {
  it("returns 0 for midnight (0 minutes)", () => {
    expect(minutesToY(0)).toBe(0);
  });

  it("returns hourHeight for 60 minutes", () => {
    expect(minutesToY(60, 64)).toBe(64);
  });

  it("returns half hourHeight for 30 minutes", () => {
    expect(minutesToY(30, 64)).toBe(32);
  });

  it("returns 24 * hourHeight for end of day", () => {
    expect(minutesToY(24 * 60, 64)).toBe(24 * 64);
  });
});

describe("addWeeks", () => {
  it("adds one week correctly", () => {
    expect(addWeeks("2026-05-22", 1)).toBe("2026-05-29");
  });

  it("subtracts one week correctly", () => {
    expect(addWeeks("2026-05-22", -1)).toBe("2026-05-15");
  });

  it("handles month boundary correctly", () => {
    expect(addWeeks("2026-05-29", 1)).toBe("2026-06-05");
  });

  it("handles year boundary correctly", () => {
    expect(addWeeks("2026-12-28", 1)).toBe("2027-01-04");
  });
});

describe("toDateStr", () => {
  it("formats date with zero-padded month and day", () => {
    const d = new Date(2026, 0, 5); // Jan 5
    expect(toDateStr(d)).toBe("2026-01-05");
  });

  it("formats December correctly", () => {
    const d = new Date(2026, 11, 31); // Dec 31
    expect(toDateStr(d)).toBe("2026-12-31");
  });
});
