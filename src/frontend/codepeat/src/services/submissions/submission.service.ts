/** Submission & grading data access (the "Aktivitäten" inbox), backed by the generated client. */

import backend from "../../backend.js";
import {toActivity, toSubmissionDetail} from "./submission.mapper.js";
import type {Activity, ActivityScope, SubmissionDetail, XpOutcome} from "./submission.types.js";

const PAGE_SIZE = 100;

/** List the activities for a scope ("mine" or "to_grade"), newest first, optionally searched. */
export async function fetchActivities(scope: ActivityScope, search = ""): Promise<Activity[]> {
    const {results} = await backend.codepeat.submissions.codepeatSubmissionsList({
        scope,
        search: search.trim() || undefined,
        expand: "challenge,user",
        sort: "-submitted_at",
        pageSize: PAGE_SIZE,
    });
    return results.map(toActivity);
}

/** Load a single submission with its challenge, reflection answers and feedback. */
export async function fetchSubmission(id: string): Promise<SubmissionDetail> {
    const dto = await backend.codepeat.submissions.codepeatSubmissionsRetrieve({id, expand: "challenge,user"});
    return toSubmissionDetail(dto);
}

/** Upload a solution ZIP for a challenge; returns the new submission id and its XP outcome. */
export async function createSubmission(challengeId: string, file: File): Promise<{id: string; xpOutcome: XpOutcome}> {
    const created = await backend.codepeat.submissions.codepeatSubmissionsCreate({challenge: challengeId, zipFile: file});
    return {id: created.id, xpOutcome: (created.xpOutcome ?? "none") as XpOutcome};
}

/** Accept or reject a submission with an optional comment (challenge creator only). */
export async function gradeSubmission(id: string, decision: "accept" | "reject", comment: string): Promise<void> {
    await backend.codepeat.submissions.codepeatSubmissionsGradeCreate({id, decision, comment: comment.trim() || undefined});
}

/** Remove a submission from the caller's list (student) or reject and return it (lecturer). */
export async function deleteSubmission(id: string): Promise<void> {
    await backend.codepeat.submissions.codepeatSubmissionsDestroy({id});
}
