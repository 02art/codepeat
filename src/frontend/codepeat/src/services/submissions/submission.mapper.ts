/**
 * Maps submission DTOs to the activities domain model. Challenge and user are read from the
 * `?_expand=challenge,user` form; drf-flex-fields expansion is not in the OpenAPI schema, so the
 * generated client still types them as ids while at runtime they are the raw (snake_case) objects.
 */

import type {Submission as ApiSubmission} from "../../api-client/index.js";
import type {Difficulty} from "../challenges/challenges.types.js";
import type {ReflectionAnswer} from "../reflections/reflection.types.js";
import type {Activity, SubmissionDetail, SubmissionStatus, XpOutcome} from "./submission.types.js";

interface ExpandedChallenge {
    id: string;
    name?: string;
    difficulty?: Difficulty;
    requires_grading?: boolean;
}

interface ExpandedUser {
    id: number;
    username?: string;
    full_name?: string;
}

function expandedChallenge(value: unknown): ExpandedChallenge | null {
    return typeof value === "object" && value !== null && "id" in value ? (value as ExpandedChallenge) : null;
}

function expandedUser(value: unknown): ExpandedUser | null {
    return typeof value === "object" && value !== null && "id" in value ? (value as ExpandedUser) : null;
}

export function toActivity(dto: ApiSubmission): Activity {
    const challenge = expandedChallenge(dto.challenge);
    const user = expandedUser(dto.user);
    return {
        id: dto.id,
        challengeId: challenge?.id ?? String(dto.challenge ?? ""),
        challengeTitle: challenge?.name ?? "Challenge",
        difficulty: challenge?.difficulty ?? "easy",
        status: dto.status as SubmissionStatus,
        submittedAt: dto.submittedAt instanceof Date ? dto.submittedAt.toISOString() : String(dto.submittedAt ?? ""),
        studentName: user?.full_name?.trim() || user?.username || "Unbekannt",
    };
}

export function toSubmissionDetail(dto: ApiSubmission): SubmissionDetail {
    const challenge = expandedChallenge(dto.challenge);
    const user = expandedUser(dto.user);
    return {
        ...toActivity(dto),
        studentId: user ? String(user.id) : String(dto.user ?? ""),
        zipUrl: dto.zipFile ?? null,
        feedback: dto.feedback ?? null,
        xpOutcome: (dto.xpOutcome ?? "none") as XpOutcome,
        requiresGrading: challenge?.requires_grading ?? true,
        reflectionAnswers: (dto.reflectionAnswers ?? []) as ReflectionAnswer[],
    };
}
