import {render, screen, fireEvent} from "@testing-library/svelte";
import {beforeEach, describe, expect, it, vi} from "vitest";

vi.mock("../../../services/auth/auth.service.js", () => ({
    verifyEmail: vi.fn(),
    confirmAccountDeletion: vi.fn(),
    confirmPasswordChange: vi.fn(),
    resetPassword: vi.fn(),
}));
vi.mock("../../../services/user/user.store.js", () => ({
    requestPasswordReset: vi.fn(),
    refreshSession: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
}));

import * as authService from "../../../services/auth/auth.service.js";
import * as userStore from "../../../services/user/user.store.js";
import VerifyEmailPage from "./VerifyEmailPage.svelte";
import DeleteAccountPage from "./DeleteAccountPage.svelte";
import ChangePasswordPage from "./ChangePasswordPage.svelte";
import ForgotPasswordPage from "./ForgotPasswordPage.svelte";
import ResetPasswordPage from "./ResetPasswordPage.svelte";
import RegisterSuccessPage from "./RegisterSuccessPage.svelte";

const auth = vi.mocked(authService);
const store = vi.mocked(userStore);

beforeEach(() => vi.clearAllMocks());

describe("VerifyEmailPage", () => {
    it("reports success once the key is confirmed", async () => {
        auth.verifyEmail.mockResolvedValue(undefined);
        render(VerifyEmailPage, {props: {params: {key: "abc"}}});
        expect(await screen.findByText("E-Mail bestätigt!")).toBeInTheDocument();
        expect(auth.verifyEmail).toHaveBeenCalledWith("abc");
    });

    it("reports an error for a missing key", async () => {
        render(VerifyEmailPage, {props: {params: {}}});
        expect(await screen.findByText("Bestätigung fehlgeschlagen")).toBeInTheDocument();
    });

    it("reports an error when confirmation fails", async () => {
        auth.verifyEmail.mockRejectedValue(new Error("kaputt"));
        render(VerifyEmailPage, {props: {params: {key: "bad"}}});
        expect(await screen.findByText("Bestätigung fehlgeschlagen")).toBeInTheDocument();
    });
});

describe("DeleteAccountPage", () => {
    it("confirms deletion and logs out", async () => {
        auth.confirmAccountDeletion.mockResolvedValue(undefined);
        render(DeleteAccountPage, {props: {params: {token: "tok"}}});
        expect(await screen.findByText("Account gelöscht")).toBeInTheDocument();
        expect(store.logout).toHaveBeenCalled();
    });

    it("shows an error on an invalid token", async () => {
        auth.confirmAccountDeletion.mockRejectedValue(new Error("ungültig"));
        render(DeleteAccountPage, {props: {params: {token: "x"}}});
        expect(await screen.findByText("Löschung fehlgeschlagen")).toBeInTheDocument();
    });
});

describe("ChangePasswordPage", () => {
    it("applies the staged change", async () => {
        auth.confirmPasswordChange.mockResolvedValue(undefined);
        render(ChangePasswordPage, {props: {params: {token: "tok"}}});
        expect(await screen.findByText("Passwort geändert")).toBeInTheDocument();
    });

    it("shows an error when confirmation fails", async () => {
        auth.confirmPasswordChange.mockRejectedValue(new Error("abgelaufen"));
        render(ChangePasswordPage, {props: {params: {token: "x"}}});
        expect(await screen.findByText("Änderung fehlgeschlagen")).toBeInTheDocument();
    });
});

describe("ForgotPasswordPage", () => {
    it("shows the confirmation after a valid submit", async () => {
        store.requestPasswordReset.mockResolvedValue(undefined);
        render(ForgotPasswordPage);
        await fireEvent.input(screen.getByPlaceholderText(/mail/i), {target: {value: "sam@example.com"}});
        await fireEvent.click(screen.getByRole("button", {name: /link senden|senden|zurücksetzen/i}));
        expect(await screen.findByText("Prüfe deine E-Mails")).toBeInTheDocument();
        expect(store.requestPasswordReset).toHaveBeenCalledWith("sam@example.com");
    });

    it("rejects an invalid email without calling the service", async () => {
        render(ForgotPasswordPage);
        await fireEvent.input(screen.getByPlaceholderText(/mail/i), {target: {value: "nope"}});
        await fireEvent.click(screen.getByRole("button", {name: /link senden|senden|zurücksetzen/i}));
        expect(store.requestPasswordReset).not.toHaveBeenCalled();
    });
});

describe("ResetPasswordPage", () => {
    it("resets the password when the fields match", async () => {
        auth.resetPassword.mockResolvedValue(undefined);
        render(ResetPasswordPage, {props: {params: {key: "reset-key"}}});
        const [pw, confirm] = screen.getAllByPlaceholderText(/passwort/i);
        await fireEvent.input(pw, {target: {value: "Abcdef1!"}});
        await fireEvent.input(confirm, {target: {value: "Abcdef1!"}});
        await fireEvent.click(screen.getByRole("button", {name: "Passwort speichern"}));
        expect(await screen.findByText("Passwort geändert")).toBeInTheDocument();
        expect(auth.resetPassword).toHaveBeenCalledWith("reset-key", "Abcdef1!");
    });

    it("rejects mismatched passwords", async () => {
        render(ResetPasswordPage, {props: {params: {key: "reset-key"}}});
        const [pw, confirm] = screen.getAllByPlaceholderText(/passwort/i);
        await fireEvent.input(pw, {target: {value: "Abcdef1!"}});
        await fireEvent.input(confirm, {target: {value: "Different1!"}});
        await fireEvent.click(screen.getByRole("button", {name: "Passwort speichern"}));
        expect(auth.resetPassword).not.toHaveBeenCalled();
    });
});

describe("RegisterSuccessPage", () => {
    it("renders the confirmation copy", () => {
        render(RegisterSuccessPage);
        expect(screen.getByText("Fast geschafft!")).toBeInTheDocument();
    });
});
