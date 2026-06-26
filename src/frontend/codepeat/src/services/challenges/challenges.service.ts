/** Challenge data access. Mock-backed; swap bodies for the generated client. */

import {CURRENT_USER_ID, MOCK_USERS} from "../user/user.mock.js";
import {MOCK_CHALLENGE_DETAILS, MOCK_CHALLENGES, MOCK_USER_PROGRESS} from "./challenges.mock.js";
import type {Challenge, ChallengeDetail} from "./challenges.types.js";

const NETWORK_DELAY_MS = 300;

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fetch all available challenges, annotated with the current user's progress. */
export async function fetchChallenges(): Promise<Challenge[]> {
    await delay(NETWORK_DELAY_MS);
    const solvedIds = new Set(MOCK_USER_PROGRESS[CURRENT_USER_ID] ?? []);
    return structuredClone(MOCK_CHALLENGES).map((challenge) => ({
        ...challenge,
        solved: solvedIds.has(challenge.id),
    }));
}

/** Fetch a single challenge with its full detail and resolved author. */
export async function fetchChallenge(id: string): Promise<ChallengeDetail> {
    await delay(NETWORK_DELAY_MS);

    const base = MOCK_CHALLENGES.find((c) => c.id === id);
    const content = MOCK_CHALLENGE_DETAILS[id];
    if (base === undefined || content === undefined) {
        throw new Error(`Challenge ${id} wurde nicht gefunden.`);
    }

    const author = MOCK_USERS.find((u) => u.id === base.createdBy);
    const solvedIds = new Set(MOCK_USER_PROGRESS[CURRENT_USER_ID] ?? []);

    return {
        ...structuredClone(base),
        ...structuredClone(content),
        solved: solvedIds.has(base.id),
        creator: {
            displayName: author?.displayName ?? "Unbekannt",
            avatarUrl: author?.avatarUrl ?? null,
            verified: author?.verified ?? false,
        },
    };
}

/** Mark a challenge as favorited (or not). */
export async function setFavorite(id: string, favorited: boolean): Promise<void> {
    await delay(NETWORK_DELAY_MS / 2);
    const challenge = MOCK_CHALLENGES.find((c) => c.id === id);
    if (challenge === undefined) {
        throw new Error(`Challenge ${id} wurde nicht gefunden.`);
    }
    challenge.favorited = favorited;
}
