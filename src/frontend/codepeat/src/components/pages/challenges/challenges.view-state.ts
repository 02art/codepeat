/** Caches the overview's filter/search/sort selection across detail navigation. Resets on reload. */
export interface ChallengesViewState {
    searchQuery: string;
    activeKey: string;
    activeSortKey: string | null;
    showFavoritesOnly: boolean;
    hideSolved: boolean;
    /** Set by the detail back button so the overview restores its cached selection once, on next mount. */
    restore: boolean;
}

export const challengesViewState: ChallengesViewState = {
    searchQuery: "",
    activeKey: "all",
    activeSortKey: null,
    showFavoritesOnly: false,
    hideSolved: false,
    restore: false,
};
