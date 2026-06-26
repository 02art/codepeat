export type Difficulty = "easy" | "medium" | "hard";

export type ChallengeStatus = "locked" | "open";

export interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: Difficulty;
    /** Global availability of the challenge (same for everyone). */
    status: ChallengeStatus;
    favorited: boolean;
    /** Whether the *current* user has solved it — per-user, set by the service. */
    solved: boolean;
    /** Id of the user who created this challenge. */
    createdBy: string;
    /** Topic categories this challenge belongs to (e.g. "Arrays"). */
    categories: string[];
    /** Whether the challenge is featured as popular. */
    popular: boolean;
    /** Whether the challenge was added recently. */
    isNew: boolean;
    /** Whether the challenge was assigned to the current user. */
    assigned: boolean;
    /** ISO date (YYYY-MM-DD) the challenge was created — used for "newest first". */
    createdAt: string;
    /** How many users have solved it — used for "most popular first". */
    solvedCount: number;
}

/** Worked example shown on the detail page. */
export interface ChallengeExample {
    language: string;
    input: string;
    output: string;
}

/** Author of a challenge, resolved for display on the detail page. */
export interface ChallengeCreator {
    displayName: string;
    avatarUrl: string | null;
    /** CodePeat in-house challenges are verified and shown with a badge. */
    verified: boolean;
}

/**
 * Full challenge from the detail endpoint: the list fields plus the heavy
 * content the overview does not need.
 */
export interface ChallengeDetail extends Challenge {
    /** How many times the challenge has been viewed. */
    views: number;
    /** Task description, one entry per bullet point. */
    tasks: string[];
    /** Constraints, one entry per bullet point. */
    constraints: string[];
    example: ChallengeExample;
    creator: ChallengeCreator;
}
