<!--
@component
Lists all coding challenges with quick filters, search, sorting and per-user progress.
-->
<script lang="ts">
    import Dropdown from "../../basic/Dropdown.svelte";
    import Icon from "../../basic/Icon.svelte";
    import {currentUser} from "../../../services/user/user.store.js";
    import {fetchChallenges, setFavorite} from "../../../services/challenges/challenges.service.js";
    import {QUICK_FILTERS, SORT_OPTIONS} from "./challenges.config.js";
    import {
        filterChallenges,
        sortChallenges,
        completedCount,
        difficultyLabel,
        difficultyClass,
    } from "./challenges.utils.js";
    import {challengesViewState} from "./challenges.view-state.js";
    import type {Challenge} from "../../../services/challenges/challenges.types.js";
    import type {FilterIcon, FilterPredicate} from "./challenges.types.js";

    const ALL_PREDICATE: FilterPredicate = {kind: "all"};
    const quickFilters = QUICK_FILTERS;
    const sortOptions = SORT_OPTIONS;
    const PAGE_SIZE = 20;

    let challenges = $state<Challenge[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    // Restore the cached selection only when arriving via the detail back button.
    const restoreFilters = challengesViewState.restore;
    challengesViewState.restore = false;

    let searchQuery = $state(restoreFilters ? challengesViewState.searchQuery : "");
    let activeKey = $state(restoreFilters ? challengesViewState.activeKey : "all");
    let activeSortKey = $state<string | null>(restoreFilters ? challengesViewState.activeSortKey : null);
    let showFavoritesOnly = $state(restoreFilters ? challengesViewState.showFavoritesOnly : false);
    let hideSolved = $state(restoreFilters ? challengesViewState.hideSolved : false);
    let searchExpanded = $state(false);

    let filterRowEl = $state<HTMLDivElement>();
    let filtersExpanded = $state(false);
    let filtersOverflow = $state(false);

    let visibleCount = $state(PAGE_SIZE);
    let loadingMore = $state(false);
    let sentinel = $state<HTMLDivElement>();

    $effect(() => {
        let cancelled = false;
        loading = true;
        error = null;

        fetchChallenges()
            .then((loaded) => {
                if (cancelled) return;
                challenges = loaded;
            })
            .catch((e: unknown) => {
                if (!cancelled) {
                    error = e instanceof Error ? e.message : "Challenges konnten nicht geladen werden.";
                }
            })
            .finally(() => {
                if (!cancelled) loading = false;
            });

        return () => {
            cancelled = true;
        };
    });

    // The expander only appears once chips no longer fit on a single line.
    $effect(() => {
        void quickFilters.length;
        void filtersExpanded;

        const el = filterRowEl;
        if (!el) return;

        const measure = (): void => {
            if (!filtersExpanded) {
                filtersOverflow = el.scrollWidth > el.clientWidth + 1;
            }
        };
        measure();

        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    });

    // Persist the selection so it is restored when returning from a detail page.
    $effect(() => {
        challengesViewState.searchQuery = searchQuery;
        challengesViewState.activeKey = activeKey;
        challengesViewState.activeSortKey = activeSortKey;
        challengesViewState.showFavoritesOnly = showFavoritesOnly;
        challengesViewState.hideSolved = hideSolved;
    });

    const currentUserId = $derived($currentUser?.id ?? null);
    const activePredicate = $derived(quickFilters.find((f) => f.key === activeKey)?.predicate ?? ALL_PREDICATE);
    const activeSort = $derived(sortOptions.find((o) => o.key === activeSortKey) ?? null);

    const matched = $derived(filterChallenges(challenges, searchQuery, activePredicate, currentUserId));
    const favoured = $derived(showFavoritesOnly ? matched.filter((c) => c.favorited) : matched);
    const unsolved = $derived(hideSolved ? favoured.filter((c) => !c.solved) : favoured);
    const visible = $derived(sortChallenges(unsolved, activeSort));

    const shown = $derived(visible.slice(0, visibleCount));
    const hasMore = $derived(visibleCount < visible.length);

    const completed = $derived(completedCount(challenges));
    const total = $derived(challenges.length);

    // Restart lazy loading from the top whenever the filtered result changes.
    $effect(() => {
        void searchQuery;
        void activeKey;
        void activeSortKey;
        void showFavoritesOnly;
        void hideSolved;
        visibleCount = PAGE_SIZE;
    });

    // Load the next page when the bottom sentinel scrolls into view (delayed so the spinner shows).
    $effect(() => {
        const el = sentinel;
        if (!el) return;

        let timer: ReturnType<typeof setTimeout> | undefined;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting && !loadingMore && visibleCount < visible.length) {
                loadingMore = true;
                timer = setTimeout(() => {
                    visibleCount = Math.min(visibleCount + PAGE_SIZE, visible.length);
                    loadingMore = false;
                }, 600);
            }
        });
        observer.observe(el);
        return () => {
            observer.disconnect();
            clearTimeout(timer);
        };
    });

    function setFilter(key: string): void {
        activeKey = activeKey === key ? "all" : key;
    }

    function setSort(key: string | null): void {
        activeSortKey = key;
    }

    async function toggleFavorite(challenge: Challenge): Promise<void> {
        const next = !challenge.favorited;
        challenge.favorited = next;
        try {
            await setFavorite(challenge.id, next);
        } catch {
            challenge.favorited = !next;
        }
    }
</script>

{#snippet filterIcon(name: FilterIcon)}
    {#if name === "logo"}
        <img src="codepeat-logo.png" alt="" class="size-5 object-contain" />
    {:else if name === "fire"}
        <Icon name="flame" />
    {:else}
        <Icon name={name} />
    {/if}
{/snippet}

{#snippet searchField(extra: string)}
    <label class="bg-base-100 focus-within:ring-primary/40 flex h-11 items-center gap-2 rounded-full px-4 shadow-sm transition-shadow focus-within:ring-2 {extra}">
        <Icon name="search" class="text-base-content/50 size-5 shrink-0" />
        <input
            type="search"
            class="grow bg-transparent text-sm outline-none"
            placeholder="Challenges Suchen"
            aria-label="Challenges suchen"
            bind:value={searchQuery}
        />
    </label>
{/snippet}

{#snippet sortControl()}
    <div class="shrink-0">
        <Dropdown
            label="Sortieren"
            triggerClass="btn btn-circle btn-ghost bg-base-100 shadow-sm {activeSort ? 'text-primary' : ''}"
            menuClass="menu bg-base-100 rounded-box mt-2 left-0 md:left-auto md:right-0 w-56 p-2 shadow-md"
        >
            {#snippet trigger()}
                <Icon name="sort" />
            {/snippet}
            <li class="menu-title text-xs">Sortieren nach</li>
            <li>
                <button class:menu-active={activeSort === null} onclick={() => setSort(null)}>Standard</button>
            </li>
            {#each sortOptions as option (option.key)}
                <li>
                    <button class:menu-active={activeSortKey === option.key} onclick={() => setSort(option.key)}>
                        {option.label}
                    </button>
                </li>
            {/each}
        </Dropdown>
    </div>
{/snippet}

{#snippet hideSolvedButton()}
    <button
        class="btn btn-circle gap-2 shrink-0 border-none whitespace-nowrap shadow-sm md:w-auto md:rounded-full md:px-4 {hideSolved ? 'btn-primary' : 'bg-base-100 text-base-content'}"
        aria-pressed={hideSolved}
        title={hideSolved ? "Erledigte einblenden" : "Erledigte ausblenden"}
        aria-label={hideSolved ? "Erledigte einblenden" : "Erledigte ausblenden"}
        onclick={() => (hideSolved = !hideSolved)}
    >
        <Icon name={hideSolved ? "eye" : "eye-off"} />
        <span class="hidden md:inline">{hideSolved ? "Erledigte einblenden" : "Erledigte ausblenden"}</span>
    </button>
{/snippet}

<div class="mx-auto w-full max-w-[1600px] px-6 py-6">
    <div class="flex items-start justify-between gap-4">
        <div>
            <p class="text-base-content/50 text-sm">Challengeübersicht</p>
            <h1 class="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">CodePeat Challenges</h1>
        </div>
        <div class="mt-2 flex items-center gap-2">
            {#if $currentUser?.canCreateChallenges}
                <a
                    href="#/challenges/new"
                    class="btn btn-circle btn-ghost border-base-200 bg-base-100 shadow-sm"
                    aria-label="Challenge erstellen"
                    title="Challenge erstellen"
                >
                    <Icon name="plus" />
                </a>
            {/if}
            <button
                class="btn btn-circle btn-ghost border-base-200 bg-base-100 shadow-sm {showFavoritesOnly ? 'text-warning' : ''}"
                aria-label="Nur Favoriten anzeigen"
                aria-pressed={showFavoritesOnly}
                title={showFavoritesOnly ? "Alle Challenges anzeigen" : "Nur Favoriten anzeigen"}
                onclick={() => (showFavoritesOnly = !showFavoritesOnly)}
            >
                <Icon name="star" filled={showFavoritesOnly} />
            </button>
        </div>
    </div>

    <div class="mt-8">
        <p class="text-base-content/60 mb-3 text-sm font-medium">Schnellsuche</p>
        <div class="flex items-start gap-3">
            <div
                bind:this={filterRowEl}
                class="flex flex-1 gap-3 pb-1 {filtersExpanded ? 'flex-wrap' : 'overflow-hidden'}"
            >
                {#each quickFilters as filter (filter.key)}
                    <button
                        class="flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors {activeKey === filter.key
                            ? 'bg-primary text-primary-content shadow-sm'
                            : 'bg-base-100 text-base-content hover:bg-base-200 shadow-sm'}"
                        onclick={() => setFilter(filter.key)}
                    >
                        {@render filterIcon(filter.icon)}
                        {filter.label}
                    </button>
                {/each}
            </div>
            {#if filtersOverflow || filtersExpanded}
                <button
                    class="btn btn-circle btn-ghost bg-base-100 shrink-0 shadow-sm"
                    aria-label={filtersExpanded ? "Kategorien einklappen" : "Alle Kategorien anzeigen"}
                    aria-expanded={filtersExpanded}
                    title={filtersExpanded ? "Einklappen" : "Alle Kategorien anzeigen"}
                    onclick={() => (filtersExpanded = !filtersExpanded)}
                >
                    <Icon name="chevrons-down" class="size-5 transition-transform {filtersExpanded ? 'rotate-180' : ''}" />
                </button>
            {/if}
        </div>
    </div>

    <div class="mt-6 border-b border-base-200 pb-6">
        <div class="flex items-center gap-3">
            <div class="hidden w-full max-w-md md:block">
                {@render searchField("w-full")}
            </div>

            <div class="flex items-center gap-2 md:hidden {searchExpanded ? 'flex-1' : ''}">
                {#if searchExpanded}
                    {@render searchField("flex-1")}
                    <button
                        class="btn btn-circle btn-ghost btn-sm shrink-0"
                        aria-label="Suche schließen"
                        onclick={() => (searchExpanded = false)}
                    >
                        <Icon name="close" />
                    </button>
                {:else}
                    <button
                        class="btn btn-circle btn-ghost bg-base-100 shrink-0 shadow-sm"
                        aria-label="Suchen"
                        onclick={() => (searchExpanded = true)}
                    >
                        <Icon name="search" />
                    </button>
                {/if}
            </div>

            {@render sortControl()}
            {@render hideSolvedButton()}

            <span class="text-base-content/50 ml-auto hidden text-sm whitespace-nowrap sm:inline">
                {#if loading}…{:else}{completed}/{total}{/if} Bearbeitet
            </span>
        </div>
    </div>

    <div class="mt-6 flex flex-col gap-4" aria-busy={loading}>
        {#if loading}
            <p class="sr-only" role="status">Challenges werden geladen…</p>
            {#each {length: 6} as _, i (i)}
                <div class="bg-base-100 flex items-center gap-6 rounded-2xl px-8 py-5 shadow-sm" aria-hidden="true">
                    <div class="min-w-0 flex-1">
                        <div class="skeleton h-4 w-48"></div>
                        <div class="skeleton mt-2 h-3 w-80 max-w-full"></div>
                    </div>
                    <div class="skeleton h-4 w-16"></div>
                    <div class="skeleton size-5 rounded"></div>
                    <div class="skeleton size-5 rounded"></div>
                </div>
            {/each}
        {:else if error}
            <div role="alert" class="bg-base-100 rounded-2xl px-8 py-12 text-center shadow-sm">
                <p class="text-error font-medium">{error}</p>
                <p class="text-base-content/50 mt-1 text-sm">Bitte lade die Seite neu.</p>
            </div>
        {:else}
            {#each shown as challenge (challenge.id)}
                {@const isOwn = challenge.createdBy === currentUserId}
                <div class="bg-base-100 hover:ring-primary/40 relative flex items-center gap-6 rounded-2xl px-8 py-5 shadow-sm transition-shadow hover:shadow-md hover:ring-2">
                    <div class="min-w-0 flex-1">
                        <h2 class="text-base font-bold">
                            <a
                                href="#/challenges/{challenge.id}"
                                class="focus-visible:after:ring-primary/60 rounded-sm outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:ring-2"
                            >
                                {challenge.title}
                            </a>
                        </h2>
                        <p class="text-base-content/50 mt-1 truncate text-sm">{challenge.description}</p>
                    </div>

                    {#if isOwn}
                        <a
                            href="#/challenges/{challenge.id}/edit"
                            class="btn btn-ghost btn-sm btn-square text-base-content/60 relative"
                            aria-label="Challenge bearbeiten"
                        >
                            <Icon name="edit" />
                        </a>
                    {:else}
                        <span class="w-16 text-right text-sm font-semibold {difficultyClass(challenge.difficulty)}">
                            {difficultyLabel(challenge.difficulty)}
                        </span>

                        <span class="flex size-5 shrink-0 items-center justify-center">
                            {#if challenge.solved}
                                <Icon name="check" class="text-base-content size-5" label="Bearbeitet" />
                            {:else if challenge.status === "locked"}
                                <Icon name="lock" class="text-base-content/50 size-5" label="Gesperrt" />
                            {/if}
                        </span>

                        <button
                            class="btn btn-ghost btn-sm btn-square relative {challenge.favorited ? 'text-warning' : 'text-base-content/60'}"
                            aria-label={challenge.favorited ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
                            aria-pressed={challenge.favorited}
                            onclick={() => void toggleFavorite(challenge)}
                        >
                            <Icon name="star" filled={challenge.favorited} />
                        </button>
                    {/if}
                </div>
            {/each}

            {#if hasMore}
                <div bind:this={sentinel} class="flex min-h-12 items-center justify-center py-4">
                    {#if loadingMore}
                        <span class="loading loading-spinner loading-lg text-primary" aria-hidden="true"></span>
                        <span class="sr-only" role="status">Weitere Challenges werden geladen…</span>
                    {/if}
                </div>
            {/if}

            {#if visible.length === 0}
                <div class="py-12 text-center">
                    <p class="text-base-content/50">
                        {#if showFavoritesOnly}Du hast noch keine Favoriten.{:else}Keine Challenges gefunden.{/if}
                    </p>
                </div>
            {/if}
        {/if}
    </div>
</div>
