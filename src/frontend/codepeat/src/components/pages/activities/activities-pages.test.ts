import {render, screen, fireEvent} from "@testing-library/svelte";
import {beforeEach, describe, expect, it, vi} from "vitest";

vi.mock("svelte-spa-router", () => ({push: vi.fn()}));
vi.mock("../../../services/submissions/submission.service.js", () => ({
    fetchActivities: vi.fn(),
    deleteSubmission: vi.fn().mockResolvedValue(undefined),
    fetchSubmission: vi.fn(),
    gradeSubmission: vi.fn().mockResolvedValue(undefined),
}));

import * as submissionService from "../../../services/submissions/submission.service.js";
import {currentUser} from "../../../services/user/user.store.js";
import type {Activity, SubmissionDetail} from "../../../services/submissions/submission.types.js";
import ActivitiesPage from "./ActivitiesPage.svelte";
import SubmissionDetailPage from "./SubmissionDetailPage.svelte";

const service = vi.mocked(submissionService);

function activity(overrides: Partial<Activity> = {}): Activity {
    return {id: "s1", challengeId: "c1", challengeTitle: "Two Sum", difficulty: "easy",
            status: "pending", submittedAt: "2026-07-01T10:00:00Z", studentName: "Sam", ...overrides};
}

function studentUser() {
    currentUser.set({id: "1", handle: "sam", displayName: "Sam", email: "s@e.de",
        progress: {level: 1, xp: 0, xpIntoLevel: 0, xpForNextLevel: 100}, avatarUrl: null, canCreateChallenges: false});
}

beforeEach(() => {
    vi.clearAllMocks();
    currentUser.set(null);
});

describe("ActivitiesPage", () => {
    it("shows the student's own submissions", async () => {
        studentUser();
        service.fetchActivities.mockResolvedValue([activity({challengeTitle: "Two Sum"})]);
        render(ActivitiesPage);
        expect(await screen.findByText("Two Sum")).toBeInTheDocument();
        expect(service.fetchActivities).toHaveBeenCalledWith("mine");
    });

    it("offers the grading tab to lecturers", async () => {
        currentUser.set({id: "9", handle: "prof", displayName: "Prof", email: "p@e.de",
            progress: {level: 1, xp: 0, xpIntoLevel: 0, xpForNextLevel: 100}, avatarUrl: null, canCreateChallenges: true});
        service.fetchActivities.mockResolvedValue([]);
        render(ActivitiesPage);
        expect(await screen.findByRole("button", {name: "Zu bewerten"})).toBeInTheDocument();
    });
});

describe("SubmissionDetailPage", () => {
    function submissionDetail(overrides: Partial<SubmissionDetail> = {}): SubmissionDetail {
        return {...activity(), studentId: "1", zipUrl: "http://x/s.zip", feedback: null,
                xpOutcome: "pending", requiresGrading: true, reflectionAnswers: [], ...overrides};
    }

    it("shows the submission's status for its owner", async () => {
        studentUser();
        service.fetchSubmission.mockResolvedValue(submissionDetail());
        render(SubmissionDetailPage, {props: {params: {id: "s1"}}});
        expect(await screen.findByText("Two Sum")).toBeInTheDocument();
        expect(service.fetchSubmission).toHaveBeenCalledWith("s1");
    });

    it("lets a lecturer grade a pending submission", async () => {
        currentUser.set({id: "9", handle: "prof", displayName: "Prof", email: "p@e.de",
            progress: {level: 1, xp: 0, xpIntoLevel: 0, xpForNextLevel: 100}, avatarUrl: null, canCreateChallenges: true});
        service.fetchSubmission.mockResolvedValue(submissionDetail({studentId: "1", status: "pending", zipUrl: null}));
        render(SubmissionDetailPage, {props: {params: {id: "s1"}}});
        await screen.findByText("Two Sum");
        await fireEvent.click(screen.getByRole("button", {name: "Bewerten"}));
        await fireEvent.click(screen.getByRole("button", {name: "Akzeptieren"}));
        expect(service.gradeSubmission).toHaveBeenCalledWith("s1", "accept", "");
    });
});
