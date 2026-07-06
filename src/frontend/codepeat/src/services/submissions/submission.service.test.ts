import {beforeEach, describe, expect, it, vi} from "vitest";

import backend from "../../backend.js";
import {
    createSubmission,
    deleteSubmission,
    fetchActivities,
    fetchSubmission,
    gradeSubmission,
} from "./submission.service.js";

vi.mock("../../backend.js", () => ({
    default: {
        codepeat: {
            submissions: {
                codepeatSubmissionsList: vi.fn(),
                codepeatSubmissionsRetrieve: vi.fn(),
                codepeatSubmissionsCreate: vi.fn(),
                codepeatSubmissionsGradeCreate: vi.fn(),
                codepeatSubmissionsDestroy: vi.fn(),
            },
        },
    },
}));

const api = backend.codepeat.submissions as unknown as Record<string, ReturnType<typeof vi.fn>>;

function submissionDto(id: string) {
    return {id, challenge: {id: "c1", name: "Two Sum"}, user: {id: 1, username: "sam"},
            status: "pending", submittedAt: new Date("2026-07-01")};
}

beforeEach(() => vi.clearAllMocks());

describe("fetchActivities", () => {
    it("lists a scope, mapping results", async () => {
        api.codepeatSubmissionsList.mockResolvedValue({results: [submissionDto("s1")]});
        const activities = await fetchActivities("mine");
        expect(activities[0].id).toBe("s1");
        expect(api.codepeatSubmissionsList).toHaveBeenCalledWith(expect.objectContaining({scope: "mine", search: undefined}));
    });

    it("passes a trimmed search term", async () => {
        api.codepeatSubmissionsList.mockResolvedValue({results: []});
        await fetchActivities("to_grade", "  sam  ");
        expect(api.codepeatSubmissionsList).toHaveBeenCalledWith(expect.objectContaining({search: "sam"}));
    });
});

describe("fetchSubmission", () => {
    it("retrieves and maps to a detail", async () => {
        api.codepeatSubmissionsRetrieve.mockResolvedValue(submissionDto("s2"));
        expect((await fetchSubmission("s2")).id).toBe("s2");
    });
});

describe("createSubmission", () => {
    it("uploads the ZIP and returns id + xp outcome", async () => {
        api.codepeatSubmissionsCreate.mockResolvedValue({id: "s3", xpOutcome: "pending"});
        const file = new File(["x"], "solution.zip");
        expect(await createSubmission("c1", file)).toEqual({id: "s3", xpOutcome: "pending"});
        expect(api.codepeatSubmissionsCreate).toHaveBeenCalledWith({challenge: "c1", zipFile: file});
    });

    it("defaults the xp outcome to none", async () => {
        api.codepeatSubmissionsCreate.mockResolvedValue({id: "s4"});
        expect((await createSubmission("c1", new File([""], "s.zip"))).xpOutcome).toBe("none");
    });
});

describe("gradeSubmission", () => {
    it("accepts with a trimmed comment", async () => {
        await gradeSubmission("s1", "accept", "  good  ");
        expect(api.codepeatSubmissionsGradeCreate).toHaveBeenCalledWith({id: "s1", decision: "accept", comment: "good"});
    });

    it("omits an empty comment", async () => {
        await gradeSubmission("s1", "reject", "   ");
        expect(api.codepeatSubmissionsGradeCreate).toHaveBeenCalledWith({id: "s1", decision: "reject", comment: undefined});
    });
});

describe("deleteSubmission", () => {
    it("destroys the submission", async () => {
        await deleteSubmission("s1");
        expect(api.codepeatSubmissionsDestroy).toHaveBeenCalledWith({id: "s1"});
    });
});
