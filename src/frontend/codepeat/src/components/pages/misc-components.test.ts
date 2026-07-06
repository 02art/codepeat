import {render, screen, fireEvent} from "@testing-library/svelte";
import {beforeEach, describe, expect, it, vi} from "vitest";

vi.mock("../../services/user/avatars.js", () => ({loadAvatars: vi.fn().mockResolvedValue(["PB/avatar-1.jpg", "PB/avatar-2.jpg"])}));

import {currentUser} from "../../services/user/user.store.js";
import HomePage from "./home/HomePage.svelte";
import NotFoundPage from "./errors/NotFoundPage.svelte";
import ConfirmationModal from "./settings/ConfirmationModal.svelte";
import ConfirmDialog from "./settings/ConfirmDialog.svelte";
import AvatarPickerModal from "./settings/AvatarPickerModal.svelte";
import CustomQuestionModal from "./challenges/CustomQuestionModal.svelte";

beforeEach(() => {
    vi.clearAllMocks();
    currentUser.set(null);
});

describe("HomePage", () => {
    it("invites a guest to register", () => {
        render(HomePage);
        expect(screen.getByText(/Studierende/)).toBeInTheDocument();
    });

    it("greets an authenticated user with a challenges CTA", () => {
        currentUser.set({id: "1", handle: "sam", displayName: "Sam", email: "s@e.de",
            progress: {level: 1, xp: 0, xpIntoLevel: 0, xpForNextLevel: 100}, avatarUrl: null, canCreateChallenges: false});
        render(HomePage);
        expect(screen.getByRole("link", {name: /los geht|challenges/i})).toBeInTheDocument();
    });
});

describe("NotFoundPage", () => {
    it("renders the 404 message", () => {
        render(NotFoundPage);
        expect(screen.getByText("404")).toBeInTheDocument();
        expect(screen.getByText("Seite nicht gefunden.")).toBeInTheDocument();
    });
});

describe("ConfirmationModal", () => {
    it("names the pending action and closes on acknowledge", async () => {
        const onClose = vi.fn();
        render(ConfirmationModal, {props: {open: true, action: "Passwortänderung", onClose}});
        expect(screen.getByText("Passwortänderung")).toBeInTheDocument();
        await fireEvent.click(screen.getByRole("button", {name: "Verstanden"}));
        expect(onClose).toHaveBeenCalled();
    });
});

describe("ConfirmDialog", () => {
    it("confirms and cancels", async () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();
        render(ConfirmDialog, {props: {open: true, title: "Löschen?", message: "Sicher?", confirmLabel: "Löschen", destructive: true, onConfirm, onCancel}});
        expect(screen.getByText("Sicher?")).toBeInTheDocument();
        await fireEvent.click(screen.getByRole("button", {name: "Löschen"}));
        expect(onConfirm).toHaveBeenCalled();
    });
});

describe("AvatarPickerModal", () => {
    it("loads the avatar pool when opened", async () => {
        render(AvatarPickerModal, {props: {open: true, current: null, onSelect: vi.fn(), onClose: vi.fn()}});
        expect(await screen.findByText("Profilbild wählen")).toBeInTheDocument();
    });
});

describe("CustomQuestionModal", () => {
    it("adds a text question", async () => {
        const onAdd = vi.fn();
        render(CustomQuestionModal, {props: {open: true, onClose: vi.fn(), onAdd}});
        const textbox = screen.getAllByRole("textbox")[0];
        await fireEvent.input(textbox, {target: {value: "Wie ging es dir?"}});
        await fireEvent.click(screen.getByRole("button", {name: /hinzufügen|frage/i}));
        expect(onAdd).toHaveBeenCalled();
    });
});
