import { describe, it, expect } from "vitest";

// ── Helpers mirrored from week-view.tsx ──────────────────────────────────────

const SNAP_MINUTES = 15;
const HOUR_HEIGHT = 64;

function snapToInterval(minutes: number, interval: number): number {
  return Math.round(minutes / interval) * interval;
}

function minutesToTimeStr(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(totalMinutes, 23 * 60 + 59));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToY(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("snapToInterval", () => {
  it("snaps 0 to 0", () => {
    expect(snapToInterval(0, SNAP_MINUTES)).toBe(0);
  });

  it("snaps 7 minutes to 0", () => {
    expect(snapToInterval(7, SNAP_MINUTES)).toBe(0);
  });

  it("snaps 8 minutes to 15", () => {
    expect(snapToInterval(8, SNAP_MINUTES)).toBe(15);
  });

  it("snaps 22 minutes to 15", () => {
    expect(snapToInterval(22, SNAP_MINUTES)).toBe(15);
  });

  it("snaps 23 minutes to 30", () => {
    expect(snapToInterval(23, SNAP_MINUTES)).toBe(30);
  });

  it("snaps exact 15-min boundaries correctly", () => {
    expect(snapToInterval(15, SNAP_MINUTES)).toBe(15);
    expect(snapToInterval(30, SNAP_MINUTES)).toBe(30);
    expect(snapToInterval(45, SNAP_MINUTES)).toBe(45);
    expect(snapToInterval(60, SNAP_MINUTES)).toBe(60);
  });
});

describe("minutesToTimeStr", () => {
  it("converts 0 to 00:00", () => {
    expect(minutesToTimeStr(0)).toBe("00:00");
  });

  it("converts 60 to 01:00", () => {
    expect(minutesToTimeStr(60)).toBe("01:00");
  });

  it("converts 90 to 01:30", () => {
    expect(minutesToTimeStr(90)).toBe("01:30");
  });

  it("converts 720 to 12:00", () => {
    expect(minutesToTimeStr(720)).toBe("12:00");
  });

  it("converts 1439 to 23:59", () => {
    expect(minutesToTimeStr(1439)).toBe("23:59");
  });

  it("clamps negative values to 00:00", () => {
    expect(minutesToTimeStr(-10)).toBe("00:00");
  });

  it("clamps values over 24h to 23:59", () => {
    expect(minutesToTimeStr(1500)).toBe("23:59");
  });
});

describe("drag rescheduling logic", () => {
  it("preserves event duration when rescheduled", () => {
    const originalStart = "09:00";
    const originalEnd = "10:30";
    const durationMinutes =
      timeToMinutes(originalEnd) - timeToMinutes(originalStart);
    expect(durationMinutes).toBe(90);

    // Simulate drag to 14:15
    const newStartMinutes = timeToMinutes("14:15");
    const newEndMinutes = newStartMinutes + durationMinutes;
    const newEndTime = minutesToTimeStr(newEndMinutes);
    expect(newEndTime).toBe("15:45");
  });

  it("clamps end time when dragged near end of day", () => {
    const durationMinutes = 60;
    const newStartMinutes = timeToMinutes("23:30");
    const clampedStart = Math.max(
      0,
      Math.min(newStartMinutes, 24 * 60 - durationMinutes)
    );
    const newEndMinutes = clampedStart + durationMinutes;
    const newEndTime = minutesToTimeStr(newEndMinutes);
    // 23:00 + 60min = 24:00 → clamped to 23:59
    expect(newEndTime).toBe("23:59");
  });

  it("Y position maps correctly to time for drag feedback", () => {
    // 9:00 AM = 540 minutes → Y = 540/60 * 64 = 576px
    const y = minutesToY(timeToMinutes("09:00"));
    expect(y).toBe(576);

    // Reverse: Y=576 → minutes = 576/64*60 = 540 → 09:00
    const rawMinutes = (y / HOUR_HEIGHT) * 60;
    const snapped = snapToInterval(rawMinutes, SNAP_MINUTES);
    expect(minutesToTimeStr(snapped)).toBe("09:00");
  });

  it("snaps drag position to nearest 15-min slot", () => {
    // Y=600 → rawMinutes = 600/64*60 = 562.5 → rounds to 570 (9:30)
    const rawMinutes = (600 / HOUR_HEIGHT) * 60; // 562.5
    const snapped = snapToInterval(rawMinutes, SNAP_MINUTES);
    expect(minutesToTimeStr(snapped)).toBe("09:30");
  });

  it("snaps drag position to 09:15 for Y around 9:15", () => {
    // 9:15 = 555 minutes → Y = 555/60*64 = 592
    const rawMinutes = (592 / HOUR_HEIGHT) * 60; // ~555
    const snapped = snapToInterval(rawMinutes, SNAP_MINUTES);
    expect(minutesToTimeStr(snapped)).toBe("09:15");
  });
});
