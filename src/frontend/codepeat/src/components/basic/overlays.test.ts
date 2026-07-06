import {render, screen, fireEvent} from "@testing-library/svelte";
import {describe, expect, it, vi} from "vitest";

import DropdownFixture from "./Dropdown.fixture.svelte";
import ModalFixture from "./Modal.fixture.svelte";

describe("Dropdown", () => {
    it("is collapsed until the trigger is clicked", async () => {
        render(DropdownFixture);
        const trigger = screen.getByRole("button", {name: "Menü öffnen"});
        expect(trigger).toHaveAttribute("aria-expanded", "false");

        await fireEvent.click(trigger);
        expect(trigger).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByText("Eintrag")).toBeInTheDocument();
    });

    it("invokes the item action", async () => {
        const onItem = vi.fn();
        render(DropdownFixture, {props: {onItem}});
        await fireEvent.click(screen.getByRole("button", {name: "Menü öffnen"}));
        await fireEvent.click(screen.getByText("Eintrag"));
        expect(onItem).toHaveBeenCalled();
    });
});

describe("Modal", () => {
    it("renders the title and body when open", () => {
        render(ModalFixture, {props: {open: true}});
        expect(screen.getByText("Titel")).toBeInTheDocument();
        expect(screen.getByText("Modal-Inhalt")).toBeInTheDocument();
    });

    it("calls onClose when the close button is pressed", async () => {
        const onClose = vi.fn();
        render(ModalFixture, {props: {open: true, onClose}});
        await fireEvent.click(screen.getAllByRole("button", {name: "Schließen"})[0]);
        expect(onClose).toHaveBeenCalled();
    });
});
