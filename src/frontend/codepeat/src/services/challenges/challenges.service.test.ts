import {beforeEach, describe, expect, it, vi} from "vitest";

import backend from "../../backend.js";
import {
    createChallenge,
    createInviteLink,
    deleteChallenge,
    fetchChallenge,
    fetchChallengeDraft,
    fetchChallenges,
    setFavorite,
    unlockChallenge,
    updateChallenge,
} from "./challenges.service.js";
import type {ChallengeDraft} from "./challenges.types.js";

vi.mock("../../backend.js", () => ({
    default: {
        codepeat: {
            challenges: {
                codepeatChallengesList: vi.fn(),
                codepeatChallengesRetrieve: vi.fn(),
                codepeatChallengesFavoriteCreate: vi.fn(),
                codepeatChallengesFavoriteDestroy: vi.fn(),
                codepeatChallengesCreate: vi.fn(),
                codepeatChallengesPartialUpdate: vi.fn(),
                codepeatChallengesDestroy: vi.fn(),
                codepeatChallengesInviteLinkCreate: vi.fn(),
                codepeatChallengesUnlockCreate: vi.fn(),
            },
        },
    },
}));

const api = backend.codepeat.challenges as unknown as Record<string, ReturnType<typeof vi.fn>>;

function dto(id: string) {
    return {id, name: `Challenge ${id}`, description: "d", difficulty: "easy", createdBy: null,
            createdAt: new Date("2026-01-01"), categories: [], views: 0, isSolved: false, isFavorited: false};
}

const draft: ChallengeDraft = {
    title: "  New  ", description: "desc", constraints: "c", exampleLanguage: "Java",
    exampleInput: "in", exampleOutput: "out", difficulty: "hard", visibility: "private", requiresGrading: false,
};

beforeEach(() => vi.clearAllMocks());

describe("fetchChallenges", () => {
    it("follows pagination and maps every page", async () => {
        api.codepeatChallengesList
            .mockResolvedValueOnce({results: [dto("1"), dto("2")], next: "page2"})
            .mockResolvedValueOnce({results: [dto("3")], next: null});
        const challenges = await fetchChallenges();
        expect(challenges.map((c) => c.id)).toEqual(["1", "2", "3"]);
        expect(api.codepeatChallengesList).toHaveBeenCalledTimes(2);
    });
});

describe("fetchChallenge", () => {
    it("retrieves with the creator expanded", async () => {
        api.codepeatChallengesRetrieve.mockResolvedValue(dto("9"));
        const detail = await fetchChallenge("9");
        expect(detail.id).toBe("9");
        expect(api.codepeatChallengesRetrieve).toHaveBeenCalledWith({id: "9", expand: "created_by"});
    });
});

describe("setFavorite", () => {
    it("POSTs when favoriting", async () => {
        await setFavorite("1", true);
        expect(api.codepeatChallengesFavoriteCreate).toHaveBeenCalledWith({id: "1"});
        expect(api.codepeatChallengesFavoriteDestroy).not.toHaveBeenCalled();
    });

    it("DELETEs when un-favoriting", async () => {
        await setFavorite("1", false);
        expect(api.codepeatChallengesFavoriteDestroy).toHaveBeenCalledWith({id: "1"});
    });
});

describe("create / update / delete", () => {
    it("creates from a draft, trimming the title, and returns the new id", async () => {
        api.codepeatChallengesCreate.mockResolvedValue({id: "new-id"});
        const id = await createChallenge(draft);
        expect(id).toBe("new-id");
        const body = api.codepeatChallengesCreate.mock.calls[0][0].challenge;
        expect(body.name).toBe("New");
        expect(body.requiresGrading).toBe(false);
        expect(body.visibility).toBe("private");
    });

    it("updates an existing challenge", async () => {
        await updateChallenge("7", draft);
        expect(api.codepeatChallengesPartialUpdate).toHaveBeenCalledWith(
            expect.objectContaining({id: "7"}),
        );
    });

    it("deletes a challenge", async () => {
        await deleteChallenge("7");
        expect(api.codepeatChallengesDestroy).toHaveBeenCalledWith({id: "7"});
    });
});

describe("fetchChallengeDraft", () => {
    it("maps the raw editable fields with fallbacks", async () => {
        api.codepeatChallengesRetrieve.mockResolvedValue({
            name: "Edit me", description: "body", constraints: "", exampleLanguage: "  ",
            exampleInput: "", exampleOutput: "", difficulty: "medium", visibility: "public", requiresGrading: true,
        });
        const result = await fetchChallengeDraft("7");
        expect(result).toMatchObject({title: "Edit me", exampleLanguage: "Java", visibility: "public", requiresGrading: true});
    });
});

describe("invite links", () => {
    it("creates an invite link", async () => {
        api.codepeatChallengesInviteLinkCreate.mockResolvedValue({url: "http://x", expiresIn: 1800});
        expect(await createInviteLink("7")).toEqual({url: "http://x", expiresIn: 1800});
    });

    it("unlocks with a token and returns the challenge id", async () => {
        api.codepeatChallengesUnlockCreate.mockResolvedValue({challenge: "7"});
        expect(await unlockChallenge("tok")).toBe("7");
        expect(api.codepeatChallengesUnlockCreate).toHaveBeenCalledWith({challengeUnlock: {token: "tok"}});
    });
});
