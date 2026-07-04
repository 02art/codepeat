/** Legal pages (privacy policy & imprint): public read, admin-only edit, via the generated client. */

import backend from "../../backend.js";

export type LegalSlug = "datenschutz" | "impressum";

export interface LegalContent {
    /** Datenschutzerklärung HTML. */
    privacy: string;
    /** Impressum HTML. */
    imprint: string;
    /** Whether the current user (an openbook admin) may edit the pages. */
    canEdit: boolean;
}

/** Load both legal documents and whether the current user may edit them. */
export async function fetchLegalContent(): Promise<LegalContent> {
    const {results} = await backend.codepeat.legal.codepeatLegalDocumentsList({pageSize: 50});
    const bySlug = new Map(results.map((doc) => [doc.slug, doc]));
    return {
        privacy: bySlug.get("datenschutz")?.content ?? "",
        imprint: bySlug.get("impressum")?.content ?? "",
        canEdit: results.some((doc) => doc.canEdit),
    };
}

/** Persist a legal document's HTML content (admins only — enforced server-side). */
export async function saveLegalContent(slug: LegalSlug, content: string): Promise<void> {
    await backend.codepeat.legal.codepeatLegalDocumentsPartialUpdate({slug, patchedLegalDocument: {content}});
}
