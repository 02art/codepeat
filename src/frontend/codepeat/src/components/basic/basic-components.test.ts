import {render, screen, fireEvent} from "@testing-library/svelte";
import {describe, expect, it} from "vitest";

import Icon from "./Icon.svelte";
import LevelBadge from "./LevelBadge.svelte";
import VerifiedBadge from "./VerifiedBadge.svelte";
import SiteFooter from "./SiteFooter.svelte";
import PasswordRequirements from "./PasswordRequirements.svelte";
import AuthField from "./AuthField.svelte";
import GithubLogo from "./GithubLogo.svelte";

describe("Icon", () => {
    it("renders a known icon with an accessible label", () => {
        render(Icon, {props: {name: "search", label: "Suchen"}});
        expect(screen.getByLabelText("Suchen")).toBeInTheDocument();
    });

    it("renders the filled variant of the star", () => {
        const {container} = render(Icon, {props: {name: "star", filled: true}});
        expect(container.querySelector("svg")).toBeInTheDocument();
    });
});

describe("LevelBadge", () => {
    it("labels the level number", () => {
        render(LevelBadge, {props: {level: 5}});
        expect(screen.getByLabelText("Level 5")).toBeInTheDocument();
    });
});

describe("VerifiedBadge", () => {
    it("renders with a default label", () => {
        render(VerifiedBadge);
        expect(screen.getByLabelText("Verifiziert")).toBeInTheDocument();
    });
});

describe("GithubLogo", () => {
    it("renders with the passed label", () => {
        render(GithubLogo, {props: {label: "GitHub"}});
        expect(screen.getByLabelText("GitHub")).toBeInTheDocument();
    });
});

describe("SiteFooter", () => {
    it("shows the legal links and current year", () => {
        render(SiteFooter);
        expect(screen.getByRole("link", {name: "Impressum"})).toBeInTheDocument();
        expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
    });
});

describe("PasswordRequirements", () => {
    it("stays hidden until the user types", () => {
        const {container} = render(PasswordRequirements, {props: {password: ""}});
        expect(container.querySelector("ul")).toBeNull();
    });

    it("shows the rules once typing starts", () => {
        render(PasswordRequirements, {props: {password: "a"}});
        expect(screen.getByLabelText("Passwort-Anforderungen")).toBeInTheDocument();
    });
});

describe("AuthField", () => {
    it("renders a labelled input from its placeholder", () => {
        render(AuthField, {props: {icon: "mail", placeholder: "E-Mail", type: "email", value: ""}});
        expect(screen.getByPlaceholderText("E-Mail")).toBeInTheDocument();
    });

    it("toggles password visibility", async () => {
        render(AuthField, {props: {icon: "lock", placeholder: "Passwort", type: "password", value: "secret"}});
        const input = screen.getByPlaceholderText("Passwort") as HTMLInputElement;
        expect(input.type).toBe("password");
        await fireEvent.click(screen.getByRole("button"));
        expect(input.type).toBe("text");
    });
});
