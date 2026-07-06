/** XP and level snapshot, used by the navbar progress bar / level badge. */
export interface UserProgress {
    /** Current level (starts at 1). */
    level: number;
    /** Total XP earned across all completed challenges. */
    xp: number;
    /** XP earned within the current level (numerator of the progress bar). */
    xpIntoLevel: number;
    /** XP needed to advance from the current level to the next (denominator). */
    xpForNextLevel: number;
}

export interface User {
    id: string;
    /** Unique handle shown in the UI, e.g. "dianaloveskitty7". */
    handle: string;
    /** Human-friendly display name. */
    displayName: string;
    /** Account email address. */
    email: string;
    /** XP/level progression shown in the navbar. */
    progress: UserProgress;
    /** Profile picture URL, or null to fall back to the default avatar icon. */
    avatarUrl: string | null;
    /** Whether the user may create challenges (lecturers/admins). Drives the "add" button. */
    canCreateChallenges: boolean;
}
