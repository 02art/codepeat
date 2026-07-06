import {describe, expect, it} from "vitest";

import {emailError, passwordError, usernameError, PASSWORD_RULES, PASSWORD_MIN_LENGTH, USERNAME_MIN_LENGTH} from "./auth.validation.js";

describe("emailError", () => {
    it("accepts a valid address", () => {
        expect(emailError("user@example.com")).toBeNull();
        expect(emailError("  user@example.com  ")).toBeNull();
    });

    it("rejects an invalid address", () => {
        expect(emailError("not-an-email")).not.toBeNull();
        expect(emailError("a@b")).not.toBeNull();
        expect(emailError("")).not.toBeNull();
    });
});

describe("usernameError", () => {
    it("accepts a username of at least the minimum length", () => {
        expect(usernameError("a".repeat(USERNAME_MIN_LENGTH))).toBeNull();
        expect(usernameError("valid_name")).toBeNull();
    });

    it("rejects a too-short username with a friendly message", () => {
        const message = usernameError("abcd");
        expect(message).not.toBeNull();
        expect(message).toContain("Nutzername");
        expect(message).not.toContain("Wert");
    });

    it("ignores surrounding whitespace", () => {
        expect(usernameError("  ab  ")).not.toBeNull();
    });
});

describe("password rules", () => {
    it("exposes the four requirement rules", () => {
        expect(PASSWORD_RULES).toHaveLength(4);
    });

    it("evaluates each rule independently", () => {
        const [minLen, casing, digit, special] = PASSWORD_RULES;
        expect(minLen.met("a".repeat(PASSWORD_MIN_LENGTH))).toBe(true);
        expect(minLen.met("short")).toBe(false);
        expect(casing.met("aA")).toBe(true);
        expect(casing.met("aa")).toBe(false);
        expect(digit.met("a1")).toBe(true);
        expect(digit.met("ab")).toBe(false);
        expect(special.met("a!")).toBe(true);
        expect(special.met("ab")).toBe(false);
    });
});

describe("passwordError", () => {
    it("returns null when every rule is satisfied", () => {
        expect(passwordError("Abcdef1!")).toBeNull();
    });

    it("returns a message when any rule fails", () => {
        expect(passwordError("abcdefgh")).not.toBeNull();
        expect(passwordError("Short1!")).not.toBeNull();
    });
});
