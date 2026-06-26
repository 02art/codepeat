export interface User {
    id: string;
    /** Unique handle shown in the UI, e.g. "dianaloveskitty7". */
    handle: string;
    /** Human-friendly display name. */
    displayName: string;
    /** Account email address. */
    email: string;
    /** Number of consecutive days a challenge was solved (0 = no streak). */
    streak: number;
    /** Profile picture URL, or null to fall back to the default avatar icon. */
    avatarUrl: string | null;
    /** Whether this is a verified CodePeat account (shown with a badge). */
    verified: boolean;
}
