import {render, screen, fireEvent} from "@testing-library/svelte";
import {beforeEach, describe, expect, it, vi} from "vitest";

const {push} = vi.hoisted(() => ({push: vi.fn()}));
vi.mock("svelte-spa-router", () => ({push}));
vi.mock("../../../services/auth/auth.service.js", () => ({loginWithProvider: vi.fn()}));
vi.mock("../../../services/user/user.store.js", () => ({
    login: vi.fn().mockResolvedValue(undefined),
    loginWithCode: vi.fn().mockResolvedValue(undefined),
    requestLoginCode: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
}));

import {loginWithProvider} from "../../../services/auth/auth.service.js";
import * as userStore from "../../../services/user/user.store.js";
import LoginPage from "./LoginPage.svelte";
import RegisterPage from "./RegisterPage.svelte";

const store = vi.mocked(userStore);
const provider = vi.mocked(loginWithProvider);

beforeEach(() => vi.clearAllMocks());

describe("LoginPage", () => {
    it("logs in with email and password", async () => {
        render(LoginPage);
        await fireEvent.input(screen.getByPlaceholderText(/mail/i), {target: {value: "sam@example.com"}});
        await fireEvent.input(screen.getByPlaceholderText("Passwort"), {target: {value: "secret"}});
        await fireEvent.click(screen.getByRole("button", {name: "Anmelden"}));
        expect(store.login).toHaveBeenCalledWith({email: "sam@example.com", password: "secret"});
        expect(push).toHaveBeenCalledWith("/challenges");
    });

    it("blocks a login with an invalid email", async () => {
        render(LoginPage);
        await fireEvent.input(screen.getByPlaceholderText(/mail/i), {target: {value: "bad"}});
        await fireEvent.input(screen.getByPlaceholderText("Passwort"), {target: {value: "secret"}});
        await fireEvent.click(screen.getByRole("button", {name: "Anmelden"}));
        expect(store.login).not.toHaveBeenCalled();
    });

    it("starts a GitHub login", async () => {
        render(LoginPage);
        await fireEvent.click(screen.getByRole("button", {name: /GitHub/i}));
        expect(provider).toHaveBeenCalledWith("github");
    });

    it("switches to the one-time code flow and requests a code", async () => {
        render(LoginPage);
        await fireEvent.click(screen.getByRole("button", {name: "Per E-Mail-Code anmelden"}));
        await fireEvent.input(screen.getByPlaceholderText(/mail/i), {target: {value: "sam@example.com"}});
        await fireEvent.click(screen.getByRole("button", {name: "Code senden"}));
        expect(store.requestLoginCode).toHaveBeenCalledWith("sam@example.com");
        expect(await screen.findByPlaceholderText("Anmelde-Code")).toBeInTheDocument();
    });
});

describe("RegisterPage", () => {
    it("registers and routes to the success page", async () => {
        render(RegisterPage);
        await fireEvent.input(screen.getByPlaceholderText(/mail/i), {target: {value: "new@example.com"}});
        await fireEvent.input(screen.getByPlaceholderText("Nutzername"), {target: {value: "newbie"}});
        const [pw, confirm] = screen.getAllByPlaceholderText(/passwort/i);
        await fireEvent.input(pw, {target: {value: "Abcdef1!"}});
        await fireEvent.input(confirm, {target: {value: "Abcdef1!"}});
        await fireEvent.click(screen.getByRole("button", {name: "Registrieren"}));
        expect(store.register).toHaveBeenCalledWith({email: "new@example.com", username: "newbie", password: "Abcdef1!"});
        expect(push).toHaveBeenCalledWith(expect.stringContaining("/register/success"));
    });

    it("rejects a too-short username with a friendly message", async () => {
        render(RegisterPage);
        await fireEvent.input(screen.getByPlaceholderText(/mail/i), {target: {value: "new@example.com"}});
        await fireEvent.input(screen.getByPlaceholderText("Nutzername"), {target: {value: "abcd"}});
        const [pw, confirm] = screen.getAllByPlaceholderText(/passwort/i);
        await fireEvent.input(pw, {target: {value: "Abcdef1!"}});
        await fireEvent.input(confirm, {target: {value: "Abcdef1!"}});
        await fireEvent.click(screen.getByRole("button", {name: "Registrieren"}));
        expect(store.register).not.toHaveBeenCalled();
        expect(screen.getByText(/Nutzername muss mindestens/i)).toBeInTheDocument();
    });

    it("rejects mismatched passwords", async () => {
        render(RegisterPage);
        await fireEvent.input(screen.getByPlaceholderText(/mail/i), {target: {value: "new@example.com"}});
        await fireEvent.input(screen.getByPlaceholderText("Nutzername"), {target: {value: "newbie"}});
        const [pw, confirm] = screen.getAllByPlaceholderText(/passwort/i);
        await fireEvent.input(pw, {target: {value: "Abcdef1!"}});
        await fireEvent.input(confirm, {target: {value: "Other1!xx"}});
        await fireEvent.click(screen.getByRole("button", {name: "Registrieren"}));
        expect(store.register).not.toHaveBeenCalled();
    });
});
