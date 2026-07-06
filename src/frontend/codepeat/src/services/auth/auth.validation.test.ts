import {describe, expect, it} from "vitest";

import {emailError, passwordError, PASSWORD_RULES, PASSWORD_MIN_LENGTH} from "./auth.validation.js";

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
