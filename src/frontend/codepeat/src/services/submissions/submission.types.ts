import type {Difficulty} from "../challenges/challenges.types.js";
import type {ReflectionAnswer} from "../reflections/reflection.types.js";

export type SubmissionStatus = "pending" | "accepted" | "rejected";

/** Why a submission does (not yet) earn XP — drives the message after the reflection step. */
export type XpOutcome = "none" | "pending" | "already";

/** Which side of the activities inbox a list is showing. */
export type ActivityScope = "mine" | "to_grade";

/** A submission row in the activities list. */
export interface Activity {
    id: string;
    challengeId: string;
    challengeTitle: string;
    difficulty: Difficulty;
    status: SubmissionStatus;
    submittedAt: string;
    studentName: string;
}

/** A single submission with everything the detail view needs. */
export interface SubmissionDetail extends Activity {
    studentId: string;
    zipUrl: string | null;
    feedback: string | null;
    xpOutcome: XpOutcome;
    requiresGrading: boolean;
    reflectionAnswers: ReflectionAnswer[];
}
