import "@testing-library/jest-dom/vitest";
import {vi} from "vitest";

// Some modules fetch at import time (backend.ts resolves the server URL, user.store reads the
// session). Provide a benign default so importing them in tests never throws; individual tests
// override fetch or mock the backend module as needed.
if (!globalThis.fetch) {
    globalThis.fetch = vi.fn(async () => ({
        ok: true, status: 200, json: async () => ({}), text: async () => "",
    })) as unknown as typeof fetch;
}

// Svelte's transitions call the Web Animations API, which jsdom does not implement.
if (!Element.prototype.animate) {
    Element.prototype.animate = () => ({finished: Promise.resolve(), cancel() {}, finish() {}}) as unknown as Animation;
}

// Components that observe layout use these observers; jsdom has no implementation.
class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}
globalThis.ResizeObserver ??= NoopObserver as unknown as typeof ResizeObserver;
globalThis.IntersectionObserver ??= NoopObserver as unknown as typeof IntersectionObserver;

// jsdom does not implement scrollIntoView (used e.g. by LegalPage's anchor scrolling).
Element.prototype.scrollIntoView ??= () => {};

// jsdom does not implement the native <dialog> methods used by the Modal component.
if (typeof HTMLDialogElement !== "undefined") {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
        this.open = false;
        this.dispatchEvent(new Event("close"));
    };
}
