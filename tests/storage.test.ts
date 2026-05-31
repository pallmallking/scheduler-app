import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.BUILT_IN_FORGE_API_URL;
  delete process.env.BUILT_IN_FORGE_API_KEY;
});

describe("server/storage", () => {
  it("normalizes keys for storageGet", async () => {
    vi.resetModules();
    const { storageGet } = await import("../server/storage");

    await expect(storageGet("/a/b.txt")).resolves.toEqual({
      key: "a/b.txt",
      url: "/manus-storage/a/b.txt",
    });
  });

  it("throws if forge config is missing", async () => {
    vi.resetModules();
    const { storagePut } = await import("../server/storage");

    await expect(storagePut("file.txt", "hello")).rejects.toThrow("Storage config missing");
  });

  it("uploads via presign url and returns manus-storage path", async () => {
    process.env.BUILT_IN_FORGE_API_URL = "https://forge.example/";
    process.env.BUILT_IN_FORGE_API_KEY = "forge-key";

    vi.resetModules();
    const { storagePut } = await import("../server/storage");

    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "11111111-1111-1111-1111-111111111111",
    );

    const fetchMock = vi.fn(async (input: any, init?: any) => {
      const url = typeof input === "string" ? input : String(input);

      if (url.startsWith("https://forge.example/")) {
        expect(init?.headers?.Authorization).toBe("Bearer forge-key");
        expect(url).toContain("v1/storage/presign/put");
        expect(url).toContain("path=uploads%2Fdemo_11111111.txt");
        return new Response(JSON.stringify({ url: "https://s3.example/object" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      expect(url).toBe("https://s3.example/object");
      expect(init?.method).toBe("PUT");
      expect(init?.headers?.["Content-Type"]).toBe("text/plain");
      return new Response("", { status: 200 });
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await storagePut("/uploads/demo.txt", "hi", "text/plain");
    expect(result).toEqual({
      key: "uploads/demo_11111111.txt",
      url: "/manus-storage/uploads/demo_11111111.txt",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fetches a signed url for download", async () => {
    process.env.BUILT_IN_FORGE_API_URL = "https://forge.example";
    process.env.BUILT_IN_FORGE_API_KEY = "forge-key";

    const fetchMock = vi.fn(async (input: any) => {
      const url = typeof input === "string" ? input : String(input);
      expect(url).toContain("v1/storage/presign/get");
      expect(url).toContain("path=a%2Fb.txt");
      return new Response(JSON.stringify({ url: "https://signed.example/a/b.txt" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    vi.resetModules();
    const { storageGetSignedUrl } = await import("../server/storage");

    await expect(storageGetSignedUrl("/a/b.txt")).resolves.toBe("https://signed.example/a/b.txt");
  });
});

