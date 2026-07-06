/**
 * Maps CodePeat backend DTOs to the frontend challenge domain model.
 *
 * Every field is backed by `/api/codepeat/challenges/`: the core task, the detail content
 * (constraints, worked example, view count), the topic categories, and the signed-in user's
 * per-challenge state (`is_solved`, `is_favorited`, both False for anonymous requests).
 */

import type {Challenge as ApiChallenge} from "../../api-client/index.js";
import type {Challenge, ChallengeCreator, ChallengeDetail, ChallengeExample} from "./challenges.types.js";

/** A freshly created challenge is flagged as "new" within this many days. */
const NEW_WINDOW_DAYS = 30;

/**
 * Shape of `created_by` when a challenge is fetched with `?_expand=created_by`.
 *
 * drf-flex-fields expansion is not reflected in the OpenAPI schema, so the generated client
 * still types the field as `number`; at runtime it is the raw (snake_case) user object.
 */
interface ExpandedCreator {
    id: number;
    username?: string;
    full_name?: string;
    picture?: string | null;
    is_staff?: boolean;
}

/**
 * Official creator shown for system-generated challenges (no creator on record) and for
 * challenges authored by an admin — both are presented as curated CodePeat content.
 */
const CODEPEAT_CREATOR: ChallengeCreator = {
    displayName: "CodePeat",
    avatarUrl: "codepeat-logo.png",
    verified: true,
};

function isExpandedCreator(value: unknown): value is ExpandedCreator {
    return typeof value === "object" && value !== null && "id" in value;
}

function toIsoDate(date: Date | null): string {
    return date ? date.toISOString().slice(0, 10) : "";
}

function isNew(date: Date | null): boolean {
    if (!date) {
        return false;
    }
    const ageMs = Date.now() - date.getTime();
    return ageMs >= 0 && ageMs < NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

/** Resolve the creator id whether `created_by` is a bare id or an expanded user object. */
function creatorId(createdBy: unknown): string {
    if (isExpandedCreator(createdBy)) {
        return String(createdBy.id);
    }
    return createdBy == null ? "" : String(createdBy);
}

/** Resolve the creator for display; system- and admin-authored challenges show as CodePeat. */
function toCreator(createdBy: unknown): ChallengeCreator {
    if (isExpandedCreator(createdBy)) {
        if (createdBy.is_staff) {
            return CODEPEAT_CREATOR;
        }
        return {
            displayName: createdBy.full_name?.trim() || createdBy.username || CODEPEAT_CREATOR.displayName,
            avatarUrl: createdBy.picture ?? null,
            verified: false,
        };
    }
    // No creator on record → system-generated → curated CodePeat content.
    return CODEPEAT_CREATOR;
}

/** Split multi-line text (description, constraints) into trimmed, non-empty bullet points. */
function toTasks(description: string): string[] {
    return description
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}

/** Build the worked example, or null when the challenge has no input/output on record. */
function toExample(dto: ApiChallenge): ChallengeExample | null {
    const input = dto.exampleInput?.trim() ?? "";
    const output = dto.exampleOutput?.trim() ?? "";
    if (input === "" && output === "") {
        return null;
    }
    return {
        language: dto.exampleLanguage?.trim() || "Text",
        input,
        output,
    };
}

/** Map a challenge for the overview list. */
export function toChallenge(dto: ApiChallenge): Challenge {
    const createdBy = creatorId(dto.createdBy);
    return {
        id: dto.id,
        title: dto.name,
        description: dto.description ?? "",
        difficulty: dto.difficulty ?? "easy",
        createdBy,
        official: createdBy === "",
        createdAt: toIsoDate(dto.createdAt),
        isNew: isNew(dto.createdAt),
        favorited: dto.isFavorited ?? false,
        solved: dto.isSolved ?? false,
        categories: Array.isArray(dto.categories) ? (dto.categories as string[]) : [],
        views: dto.views ?? 0,
    };
}

/** Map a challenge for the detail page, resolving the creator from the expanded `created_by`. */
export function toChallengeDetail(dto: ApiChallenge): ChallengeDetail {
    return {
        ...toChallenge(dto),
        creator: toCreator(dto.createdBy),
        tasks: toTasks(dto.description ?? ""),
        constraints: toTasks(dto.constraints ?? ""),
        example: toExample(dto),
        views: dto.views ?? 0,
    };
}
