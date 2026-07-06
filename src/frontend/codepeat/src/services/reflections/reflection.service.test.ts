import {beforeEach, describe, expect, it, vi} from "vitest";

import backend from "../../backend.js";
import {CODEPEAT_DEFAULTS} from "./reflection.config.js";
import {
    fetchChallengeQuestions,
    fetchQuestionsForFilling,
    replaceReflectionQuestions,
    saveReflection,
} from "./reflection.service.js";

vi.mock("../../backend.js", () => ({
    default: {
        codepeat: {
            reflectionQuestions: {
                codepeatReflectionQuestionsList: vi.fn(),
                codepeatReflectionQuestionsCreate: vi.fn(),
                codepeatReflectionQuestionsDestroy: vi.fn(),
            },
            reflections: {
                codepeatReflectionsCreate: vi.fn(),
            },
        },
    },
}));

const questions = backend.codepeat.reflectionQuestions as unknown as Record<string, ReturnType<typeof vi.fn>>;
const reflections = backend.codepeat.reflections as unknown as Record<string, ReturnType<typeof vi.fn>>;

beforeEach(() => vi.clearAllMocks());

describe("fetchChallengeQuestions", () => {
    it("maps questions and defaults the kind/options", async () => {
        questions.codepeatReflectionQuestionsList.mockResolvedValue({results: [
            {id: "q1", text: "Frage", kind: undefined, options: undefined},
            {id: "q2", text: "Skala", kind: "scale", options: ["min", "max"]},
        ]});
        const result = await fetchChallengeQuestions("c1");
        expect(result[0]).toEqual({id: "q1", text: "Frage", kind: "text", options: []});
        expect(result[1]).toEqual({id: "q2", text: "Skala", kind: "scale", options: ["min", "max"]});
    });
});

describe("fetchQuestionsForFilling", () => {
    it("prepends CodePeat defaults for official challenges", async () => {
        questions.codepeatReflectionQuestionsList.mockResolvedValue({results: [{id: "own", text: "Own", kind: "text"}]});
        const result = await fetchQuestionsForFilling("c1", true);
        expect(result).toHaveLength(CODEPEAT_DEFAULTS.length + 1);
        expect(result[0].id).toBe("codepeat-default-0");
        expect(result.at(-1)?.id).toBe("own");
    });

    it("omits defaults for non-official challenges", async () => {
        questions.codepeatReflectionQuestionsList.mockResolvedValue({results: [{id: "own", text: "Own", kind: "text"}]});
        const result = await fetchQuestionsForFilling("c1", false);
        expect(result).toEqual([{id: "own", text: "Own", kind: "text", options: []}]);
    });
});

describe("replaceReflectionQuestions", () => {
    it("deletes the existing questions and recreates with positions", async () => {
        questions.codepeatReflectionQuestionsList.mockResolvedValue({results: [{id: "old", text: "Old", kind: "text"}]});
        await replaceReflectionQuestions("c1", [
            {key: "a", text: "A", kind: "text", options: []},
            {key: "b", text: "B", kind: "choice", options: ["x", "y"]},
        ]);
        expect(questions.codepeatReflectionQuestionsDestroy).toHaveBeenCalledWith({id: "old"});
        expect(questions.codepeatReflectionQuestionsCreate).toHaveBeenCalledTimes(2);
        const second = questions.codepeatReflectionQuestionsCreate.mock.calls[1][0].reflectionQuestion;
        expect(second).toMatchObject({challenge: "c1", text: "B", position: 1});
    });
});

describe("saveReflection", () => {
    it("creates a reflection for the submission", async () => {
        await saveReflection("s1", [{question: "q", kind: "text", answer: "a"}]);
        expect(reflections.codepeatReflectionsCreate).toHaveBeenCalledWith({
            reflection: {submission: "s1", answers: [{question: "q", kind: "text", answer: "a"}]},
        });
    });
});
