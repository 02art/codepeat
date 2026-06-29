/** Reflection questionnaire domain types. */

export type QuestionKind = "text" | "scale" | "choice";

/** A reflection question shown to the student (from the backend or a CodePeat default). */
export interface ReflectionQuestion {
    id: string;
    text: string;
    kind: QuestionKind;
    /** choice → selectable options; scale → [minLabel, maxLabel]; text → []. */
    options: string[];
}

/** Editable draft of a question in the challenge editor (no persisted id yet). */
export interface QuestionDraft {
    /** Stable client-side key for list rendering. */
    key: string;
    text: string;
    kind: QuestionKind;
    options: string[];
}

/** A predefined catalogue entry the teacher can add to a challenge. */
export interface CatalogueQuestion {
    text: string;
    kind: QuestionKind;
    options?: string[];
}

export interface CatalogueGroup {
    title: string;
    questions: CatalogueQuestion[];
}

export type AnswerValue = string | number | string[];

/** One stored answer (self-describing snapshot kept on the Reflection). */
export interface ReflectionAnswer {
    question: string;
    kind: QuestionKind;
    answer: AnswerValue;
}
