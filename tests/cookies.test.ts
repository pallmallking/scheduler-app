import { describe, expect, it } from "vitest";
import { getSessionCookieOptions } from "../server/_core/cookies";

type MockReq = {
  hostname: string;
  protocol: string;
  headers: Record<string, string | string[] | undefined>;
};

function req(overrides: Partial<MockReq>): MockReq {
  return {
    hostname: "localhost",
    protocol: "http",
    headers: {},
    ...overrides,
  };
}

describe("getSessionCookieOptions", () => {
  it("returns consistent base options", () => {
    const options = getSessionCookieOptions(req({ protocol: "https" }) as any);
    expect(options).toMatchObject({
      httpOnly: true,
      path: "/",
      sameSite: "none",
    });
  });

  it("does not set domain for localhost", () => {
    const options = getSessionCookieOptions(req({ hostname: "localhost" }) as any);
    expect(options.domain).toBeUndefined();
  });

  it("does not set domain for ip addresses", () => {
    const v4 = getSessionCookieOptions(req({ hostname: "127.0.0.1" }) as any);
    expect(v4.domain).toBeUndefined();

    const v6 = getSessionCookieOptions(req({ hostname: "::1" }) as any);
    expect(v6.domain).toBeUndefined();
  });

  it("does not set domain for bare domains", () => {
    const options = getSessionCookieOptions(req({ hostname: "manuspre.computer" }) as any);
    expect(options.domain).toBeUndefined();
  });

  it("extracts parent domain for subdomains", () => {
    const options = getSessionCookieOptions(
      req({ hostname: "3000-abc.manuspre.computer" }) as any,
    );
    expect(options.domain).toBe(".manuspre.computer");
  });

  it("marks cookies secure when protocol is https", () => {
    const options = getSessionCookieOptions(req({ protocol: "https" }) as any);
    expect(options.secure).toBe(true);
  });

  it("marks cookies secure when x-forwarded-proto includes https", () => {
    const options = getSessionCookieOptions(
      req({ protocol: "http", headers: { "x-forwarded-proto": "http, https" } }) as any,
    );
    expect(options.secure).toBe(true);
  });

  it("marks cookies insecure when not https", () => {
    const options = getSessionCookieOptions(
      req({ protocol: "http", headers: { "x-forwarded-proto": "http" } }) as any,
    );
    expect(options.secure).toBe(false);
  });
});

