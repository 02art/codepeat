import {describe, expect, it} from "vitest";

import {toActivity, toSubmissionDetail} from "./submission.mapper.js";

// The mapper reads the ?_expand=challenge,user shape, which the generated client types loosely.
function apiSubmission(overrides: Record<string, unknown> = {}) {
    return {
        id: "s1",
        challenge: {id: "c1", name: "Two Sum", difficulty: "medium", requires_grading: true},
        user: {id: 7, username: "sam", full_name: "Sam Smith"},
        status: "pending",
        submittedAt: new Date("2026-07-01T10:00:00Z"),
        ...overrides,
    } as never;
}

describe("toActivity", () => {
    it("maps the expanded challenge and user", () => {
        const activity = toActivity(apiSubmission());
        expect(activity).toMatchObject({
            id: "s1",
            challengeId: "c1",
            challengeTitle: "Two Sum",
            difficulty: "medium",
            status: "pending",
            studentName: "Sam Smith",
        });
        expect(activity.submittedAt).toContain("2026-07-01");
    });

    it("falls back when challenge and user are bare ids", () => {
        const activity = toActivity(apiSubmission({challenge: "c9", user: 3, submittedAt: "2026-07-02"}));
        expect(activity.challengeId).toBe("c9");
        expect(activity.challengeTitle).toBe("Challenge");
        expect(activity.difficulty).toBe("easy");
        expect(activity.studentName).toBe("Unbekannt");
    });

    it("uses the username when there is no full name", () => {
        const activity = toActivity(apiSubmission({user: {id: 7, username: "sam", full_name: "   "}}));
        expect(activity.studentName).toBe("sam");
    });
});

describe("toSubmissionDetail", () => {
    it("adds detail fields on top of the activity", () => {
        const detail = toSubmissionDetail(apiSubmission({
            zipFile: "http://x/s.zip",
            feedback: "Well done",
            xpOutcome: "pending",
            reflectionAnswers: [{question: "q", answer: "a"}],
        }));
        expect(detail).toMatchObject({
            studentId: "7",
            zipUrl: "http://x/s.zip",
            feedback: "Well done",
            xpOutcome: "pending",
            requiresGrading: true,
        });
        expect(detail.reflectionAnswers).toHaveLength(1);
    });

    it("defaults missing detail fields", () => {
        const detail = toSubmissionDetail(apiSubmission({challenge: "c9", user: 3}));
        expect(detail.zipUrl).toBeNull();
        expect(detail.feedback).toBeNull();
        expect(detail.xpOutcome).toBe("none");
        expect(detail.requiresGrading).toBe(true);
        expect(detail.reflectionAnswers).toEqual([]);
    });
});
