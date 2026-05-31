import { beforeEach, describe, expect, it, vi } from "vitest";

const drizzleMock = vi.fn();
vi.mock("drizzle-orm/mysql2", () => ({
  drizzle: (...args: any[]) => drizzleMock(...args),
}));

function makeDbStub() {
  const onDuplicateKeyUpdate = vi.fn(async () => {});
  const values = vi.fn((_values: unknown) => ({
    onDuplicateKeyUpdate,
  }));
  const insert = vi.fn((_table: unknown) => ({
    values,
  }));
  return { db: { insert }, insert, values, onDuplicateKeyUpdate };
}

beforeEach(() => {
  drizzleMock.mockReset();
  delete process.env.DATABASE_URL;
  delete process.env.OWNER_OPEN_ID;
});

describe("server/db", () => {
  it("throws when openId is missing", async () => {
    vi.resetModules();
    const { upsertUser } = await import("../server/db");

    await expect(upsertUser({ openId: "" } as any)).rejects.toThrow(
      "User openId is required for upsert",
    );
  });

  it("warns and returns when database is not available", async () => {
    vi.resetModules();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { upsertUser, getUserByOpenId } = await import("../server/db");

    await expect(upsertUser({ openId: "user-1" } as any)).resolves.toBeUndefined();
    await expect(getUserByOpenId("user-1")).resolves.toBeUndefined();

    expect(warnSpy.mock.calls.flat().join(" ")).toContain("database not available");
  });

  it("upserts owner as admin and passes expected updateSet", async () => {
    const { db, values, onDuplicateKeyUpdate } = makeDbStub();

    drizzleMock.mockReturnValue(db);
    process.env.DATABASE_URL = "mysql://test";
    process.env.OWNER_OPEN_ID = "owner-openid";

    vi.resetModules();
    const { upsertUser } = await import("../server/db");

    const lastSignedIn = new Date("2026-05-31T00:00:00.000Z");
    await upsertUser({
      openId: "owner-openid",
      name: null,
      lastSignedIn,
    } as any);

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        openId: "owner-openid",
        role: "admin",
        name: null,
        lastSignedIn,
      }),
    );
    expect(onDuplicateKeyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({
          role: "admin",
          name: null,
          lastSignedIn,
        }),
      }),
    );
  });
});

