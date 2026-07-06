/** Challenge data access, backed by the CodePeat REST API via the generated client. */

import backend from "../../backend.js";
import type {Challenge as ApiChallenge, PatchedChallenge} from "../../api-client/index.js";
import {toChallenge, toChallengeDetail} from "./challenges.mapper.js";
import type {Challenge, ChallengeDetail, ChallengeDraft} from "./challenges.types.js";

/** Page size for fetching the catalogue; the overview filters, sorts and paginates client-side. */
const PAGE_SIZE = 100;

/** Fetch all challenges across every page (the overview needs the full set for local filtering). */
export async function fetchChallenges(): Promise<Challenge[]> {
    const challenges: Challenge[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const {results, next} = await backend.codepeat.challenges.codepeatChallengesList({
            page,
            pageSize: PAGE_SIZE,
            sort: "-created_at",
        });
        challenges.push(...results.map(toChallenge));
        hasMore = next != null;
        page += 1;
    }

    return challenges;
}

/** Fetch a single challenge with its full detail and the creator resolved for display. */
export async function fetchChallenge(id: string): Promise<ChallengeDetail> {
    const challenge = await backend.codepeat.challenges.codepeatChallengesRetrieve({
        id,
        expand: "created_by",
    });
    return toChallengeDetail(challenge);
}

/** Persist the current user's favorite state for a challenge (toggle add/remove). */
export async function setFavorite(id: string, favorited: boolean): Promise<void> {
    if (favorited) {
        await backend.codepeat.challenges.codepeatChallengesFavoriteCreate({id});
    } else {
        await backend.codepeat.challenges.codepeatChallengesFavoriteDestroy({id});
    }
}

/** Map an editor draft to the API body. Casts away the generated client's readonly-Omit typing. */
function draftToBody(draft: ChallengeDraft): ApiChallenge {
    return {
        name: draft.title.trim(),
        description: draft.description,
        textFormat: "MD",
        difficulty: draft.difficulty,
        visibility: draft.visibility,
        type: "solo",
        constraints: draft.constraints,
        exampleLanguage: draft.exampleLanguage,
        exampleInput: draft.exampleInput,
        exampleOutput: draft.exampleOutput,
        requiresGrading: draft.requiresGrading,
        course: null,
    } as unknown as ApiChallenge;
}

/** Load a challenge's raw, editable fields (the editor needs the unsplit text, unlike the detail view). */
export async function fetchChallengeDraft(id: string): Promise<ChallengeDraft> {
    const dto = await backend.codepeat.challenges.codepeatChallengesRetrieve({id});
    return {
        title: dto.name,
        description: dto.description ?? "",
        constraints: dto.constraints ?? "",
        exampleLanguage: dto.exampleLanguage?.trim() || "Java",
        exampleInput: dto.exampleInput ?? "",
        exampleOutput: dto.exampleOutput ?? "",
        difficulty: dto.difficulty ?? "easy",
        visibility: dto.visibility === "private" ? "private" : "public",
        requiresGrading: dto.requiresGrading ?? true,
    };
}

/** Create a challenge from the editor draft; returns the new challenge's id. */
export async function createChallenge(draft: ChallengeDraft): Promise<string> {
    const created = await backend.codepeat.challenges.codepeatChallengesCreate({challenge: draftToBody(draft)});
    return created.id;
}

/** Update an existing challenge from the editor draft. */
export async function updateChallenge(id: string, draft: ChallengeDraft): Promise<void> {
    await backend.codepeat.challenges.codepeatChallengesPartialUpdate({
        id,
        patchedChallenge: draftToBody(draft) as unknown as PatchedChallenge,
    });
}

/** Permanently delete a challenge (creator only — enforced server-side). */
export async function deleteChallenge(id: string): Promise<void> {
    await backend.codepeat.challenges.codepeatChallengesDestroy({id});
}

/** Create a fresh, time-limited invitation link for a private challenge. */
export async function createInviteLink(id: string): Promise<{url: string; expiresIn: number}> {
    const res = await backend.codepeat.challenges.codepeatChallengesInviteLinkCreate({id});
    return {url: res.url, expiresIn: res.expiresIn};
}

/** Redeem an invitation link, granting the current user permanent access; returns the challenge id. */
export async function unlockChallenge(token: string): Promise<string> {
    const res = await backend.codepeat.challenges.codepeatChallengesUnlockCreate({challengeUnlock: {token}});
    return res.challenge;
}
