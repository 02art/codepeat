import {render, screen, fireEvent} from "@testing-library/svelte";
import {beforeEach, describe, expect, it, vi} from "vitest";

vi.mock("../../../services/legal/legal.service.js", () => ({
    fetchLegalContent: vi.fn(),
    saveLegalContent: vi.fn().mockResolvedValue(undefined),
}));

import * as legalService from "../../../services/legal/legal.service.js";
import LegalPage from "./LegalPage.svelte";

const service = vi.mocked(legalService);

beforeEach(() => vi.clearAllMocks());

describe("LegalPage", () => {
    it("renders the fetched legal HTML", async () => {
        service.fetchLegalContent.mockResolvedValue({privacy: "<p>Datenschutz-Text</p>", imprint: "<p>Impressum-Text</p>", canEdit: false});
        const {container} = render(LegalPage, {props: {section: "impressum"}});
        await vi.waitFor(() => expect(container.innerHTML).toContain("Impressum-Text"));
    });

    it("hides the edit control from non-admins", async () => {
        service.fetchLegalContent.mockResolvedValue({privacy: "<p>P</p>", imprint: "<p>I</p>", canEdit: false});
        render(LegalPage);
        await vi.waitFor(() => expect(service.fetchLegalContent).toHaveBeenCalled());
        expect(screen.queryByRole("button", {name: /bearbeiten/i})).toBeNull();
    });

    it("lets an admin edit and save", async () => {
        service.fetchLegalContent.mockResolvedValue({privacy: "<p>P</p>", imprint: "<p>I</p>", canEdit: true});
        render(LegalPage);
        const editButton = await screen.findByRole("button", {name: /bearbeiten/i});
        await fireEvent.click(editButton);
        const [firstArea] = screen.getAllByRole("textbox");
        await fireEvent.input(firstArea, {target: {value: "<p>Geändert</p>"}});
        await fireEvent.click(screen.getByRole("button", {name: /speichern/i}));
        expect(service.saveLegalContent).toHaveBeenCalled();
    });
});
