import {render, screen} from "@testing-library/svelte";
import {describe, expect, it} from "vitest";

import PlaceholderPage from "./PlaceholderPage.svelte";

describe("PlaceholderPage", () => {
    it("shows the passed title", () => {
        render(PlaceholderPage, {props: {title: "Kurse"}});
        expect(screen.getByRole("heading", {name: "Kurse"})).toBeInTheDocument();
    });

    it("falls back to a default title", () => {
        render(PlaceholderPage);
        expect(screen.getByRole("heading", {name: "Bald verfügbar"})).toBeInTheDocument();
    });
});
