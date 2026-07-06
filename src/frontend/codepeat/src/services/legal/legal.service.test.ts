import {beforeEach, describe, expect, it, vi} from "vitest";

import backend from "../../backend.js";
import {fetchLegalContent, saveLegalContent} from "./legal.service.js";

vi.mock("../../backend.js", () => ({
    default: {
        codepeat: {
            legal: {
                codepeatLegalDocumentsList: vi.fn(),
                codepeatLegalDocumentsPartialUpdate: vi.fn(),
            },
        },
    },
}));

const api = backend.codepeat.legal as unknown as Record<string, ReturnType<typeof vi.fn>>;

beforeEach(() => vi.clearAllMocks());

describe("fetchLegalContent", () => {
    it("splits documents by slug and reports edit rights", async () => {
        api.codepeatLegalDocumentsList.mockResolvedValue({results: [
            {slug: "datenschutz", content: "<p>Privacy</p>", canEdit: true},
            {slug: "impressum", content: "<p>Imprint</p>", canEdit: true},
        ]});
        expect(await fetchLegalContent()).toEqual({
            privacy: "<p>Privacy</p>",
            imprint: "<p>Imprint</p>",
            canEdit: true,
        });
    });

    it("defaults missing documents and edit rights", async () => {
        api.codepeatLegalDocumentsList.mockResolvedValue({results: []});
        expect(await fetchLegalContent()).toEqual({privacy: "", imprint: "", canEdit: false});
    });
});

describe("saveLegalContent", () => {
    it("patches a document by slug", async () => {
        await saveLegalContent("impressum", "<p>New</p>");
        expect(api.codepeatLegalDocumentsPartialUpdate).toHaveBeenCalledWith({
            slug: "impressum",
            patchedLegalDocument: {content: "<p>New</p>"},
        });
    });
});
