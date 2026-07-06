import {afterEach, describe, expect, it, vi} from "vitest";

import {loadAvatars} from "./avatars.js";

function mockFetch(impl: () => Promise<unknown>) {
    vi.stubGlobal("fetch", vi.fn(impl as never));
}

afterEach(() => vi.unstubAllGlobals());

describe("loadAvatars", () => {
    it("maps manifest entries to PB paths", async () => {
        mockFetch(async () => ({ok: true, json: async () => ["avatar-1.jpg", "avatar-2.png"]}));
        expect(await loadAvatars()).toEqual(["PB/avatar-1.jpg", "PB/avatar-2.png"]);
    });

    it("returns an empty pool when the manifest is missing", async () => {
        mockFetch(async () => ({ok: false, json: async () => null}));
        expect(await loadAvatars()).toEqual([]);
    });

    it("returns an empty pool when the manifest is not an array", async () => {
        mockFetch(async () => ({ok: true, json: async () => ({})}));
        expect(await loadAvatars()).toEqual([]);
    });

    it("ignores non-string entries", async () => {
        mockFetch(async () => ({ok: true, json: async () => ["ok.jpg", 42, null]}));
        expect(await loadAvatars()).toEqual(["PB/ok.jpg"]);
    });

    it("returns an empty pool on network error", async () => {
        mockFetch(async () => { throw new Error("offline"); });
        expect(await loadAvatars()).toEqual([]);
    });
});
