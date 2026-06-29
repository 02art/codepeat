/** Reflection question + answer data access via the generated CodePeat client. */

import backend from "../../backend.js";
import type {Reflection, ReflectionQuestion as ApiReflectionQuestion} from "../../api-client/index.js";
import {CODEPEAT_DEFAULTS} from "./reflection.config.js";
import type {QuestionDraft, QuestionKind, ReflectionAnswer, ReflectionQuestion} from "./reflection.types.js";

function toQuestion(dto: ApiReflectionQuestion): ReflectionQuestion {
    return {
        id: dto.id,
        text: dto.text,
        kind: (dto.kind ?? "text") as QuestionKind,
        options: Array.isArray(dto.options) ? (dto.options as string[]) : [],
    };
}

/** The reflection questions a teacher attached to a challenge (backend only). */
export async function fetchChallengeQuestions(challengeId: string): Promise<ReflectionQuestion[]> {
    const {results} = await backend.codepeat.reflectionQuestions.codepeatReflectionQuestionsList({
        challenge: challengeId,
        pageSize: 100,
        sort: "position",
    });
    return results.map(toQuestion);
}

/**
 * The questions a student actually fills in: the challenge's own questions, plus — for CodePeat
 * challenges — the (up to 3) default questions prepended.
 */
export async function fetchQuestionsForFilling(challengeId: string, isCodepeat: boolean): Promise<ReflectionQuestion[]> {
    const own = await fetchChallengeQuestions(challengeId);
    const defaults: ReflectionQuestion[] = isCodepeat
        ? CODEPEAT_DEFAULTS.map((q, i) => ({id: `codepeat-default-${i}`, text: q.text, kind: q.kind, options: q.options ?? []}))
        : [];
    return [...defaults, ...own];
}

/** Replace a challenge's reflection questions with the given list (used when saving the editor). */
export async function replaceReflectionQuestions(challengeId: string, questions: QuestionDraft[]): Promise<void> {
    const existing = await fetchChallengeQuestions(challengeId);
    for (const q of existing) {
        await backend.codepeat.reflectionQuestions.codepeatReflectionQuestionsDestroy({id: q.id});
    }
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await backend.codepeat.reflectionQuestions.codepeatReflectionQuestionsCreate({
            reflectionQuestion: {
                challenge: challengeId,
                text: q.text,
                kind: q.kind,
                options: q.options,
                position: i,
            } as unknown as ApiReflectionQuestion,
        });
    }
}

/** Persist the student's reflection answers for a submission. */
export async function saveReflection(submissionId: string, answers: ReflectionAnswer[]): Promise<void> {
    await backend.codepeat.reflections.codepeatReflectionsCreate({
        reflection: {submission: submissionId, answers} as unknown as Reflection,
    });
}
