<!--
@component
The "Aktivitäten" inbox, split by role: "Meine Abgaben" (the user's own submissions with
status) and "Zu bewerten" (submissions on challenges they created). Both offer search and
sorting; the to-grade tab additionally filters to open submissions. Rows link to the detail.
-->
<script lang="ts">
    import {currentUser} from "../../../services/user/user.store.js";
    import {deleteSubmission, fetchActivities} from "../../../services/submissions/submission.service.js";
    import type {Activity, ActivityScope, SubmissionStatus} from "../../../services/submissions/submission.types.js";
    import Dropdown from "../../basic/Dropdown.svelte";
    import Icon from "../../basic/Icon.svelte";
    import ConfirmDialog from "../settings/ConfirmDialog.svelte";

    const STATUS: Record<SubmissionStatus, {label: string; class: string}> = {
        pending: {label: "Offen", class: "bg-warning/15 text-warning"},
        accepted: {label: "Akzeptiert", class: "bg-success/15 text-success"},
        rejected: {label: "Abgelehnt", class: "bg-error/15 text-error"},
    };

    const canGrade = $derived($currentUser?.canCreateChallenges ?? false);

    let scope = $state<ActivityScope>("mine");
    let items = $state<Activity[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let search = $state("");
    let newestFirst = $state(true);
    let onlyOpen = $state(true);
    let pendingDelete = $state<Activity | null>(null);

    $effect(() => {
        const currentScope = scope;
        let cancelled = false;
        loading = true;
        error = null;
        fetchActivities(currentScope)
            .then((loaded) => {
                if (!cancelled) {
                    items = loaded;
                }
            })
            .catch((cause: unknown) => {
                if (!cancelled) {
                    error = cause instanceof Error ? cause.message : "Abgaben konnten nicht geladen werden.";
                }
            })
            .finally(() => {
                if (!cancelled) {
                    loading = false;
                }
            });
        return () => {
            cancelled = true;
        };
    });

    const visible = $derived(
        items
            .filter((item) => (scope === "to_grade" && onlyOpen ? item.status === "pending" : true))
            .filter((item) => {
                const needle = search.trim().toLowerCase();
                return needle === "" || item.challengeTitle.toLowerCase().includes(needle) || item.studentName.toLowerCase().includes(needle);
            })
            .sort((a, b) => (newestFirst ? b.submittedAt.localeCompare(a.submittedAt) : a.submittedAt.localeCompare(b.submittedAt))),
    );

    function formatDate(iso: string): string {
        return iso ? new Date(iso).toLocaleDateString("de-DE", {day: "2-digit", month: "2-digit", year: "numeric"}) : "";
    }

    async function confirmDelete(): Promise<void> {
        const target = pendingDelete;
        pendingDelete = null;
        if (target === null) {
            return;
        }
        items = items.filter((item) => item.id !== target.id);
        try {
            await deleteSubmission(target.id);
        } catch {
            items = [...items, target]; // restore on failure
        }
    }
</script>

<div class="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6">
    <div>
        <p class="text-base-content/50 text-sm">Aktivitäten</p>
        <h1 class="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Deine Abgaben</h1>
    </div>

    {#if canGrade}
        <div class="border-base-200 mt-6 flex gap-1 overflow-x-auto border-b">
            {#each [{key: "mine", label: "Meine Abgaben"}, {key: "to_grade", label: "Zu bewerten"}] as tab (tab.key)}
                <button
                    type="button"
                    class="shrink-0 rounded-t-xl px-5 py-3 text-sm font-bold whitespace-nowrap transition-colors {scope === tab.key
                        ? 'border-primary text-primary border-b-2'
                        : 'text-base-content/60 hover:text-base-content border-b-2 border-transparent'}"
                    onclick={() => (scope = tab.key as ActivityScope)}
                >
                    {tab.label}
                </button>
            {/each}
        </div>
    {/if}

    <div class="mt-6 flex items-center gap-3">
        <label class="bg-base-100 focus-within:ring-primary/40 flex h-11 flex-1 items-center gap-2 rounded-full px-4 shadow-sm transition-shadow focus-within:ring-2 sm:max-w-md">
            <Icon name="search" class="text-base-content/50 size-5 shrink-0" />
            <input type="search" class="grow bg-transparent text-sm outline-none" placeholder="Suchen" aria-label="Abgaben suchen" bind:value={search} />
        </label>

        <Dropdown
            label="Sortieren"
            triggerClass="btn btn-circle btn-ghost bg-base-100 shadow-sm text-primary"
            menuClass="menu bg-base-100 rounded-box mt-2 right-0 w-48 p-2 shadow-md"
        >
            {#snippet trigger()}
                <Icon name="sort" />
            {/snippet}
            <li class="menu-title text-xs">Sortieren nach</li>
            <li><button class:menu-active={newestFirst} onclick={() => (newestFirst = true)}>Neueste zuerst</button></li>
            <li><button class:menu-active={!newestFirst} onclick={() => (newestFirst = false)}>Älteste zuerst</button></li>
        </Dropdown>

        {#if scope === "to_grade"}
            <button
                class="btn btn-circle gap-2 shrink-0 border-none whitespace-nowrap shadow-sm md:w-auto md:rounded-full md:px-4 {onlyOpen ? 'btn-primary' : 'bg-base-100 text-base-content'}"
                aria-pressed={onlyOpen}
                title="Nur offene Abgaben"
                onclick={() => (onlyOpen = !onlyOpen)}
            >
                <Icon name="clock" />
                <span class="hidden md:inline">Nur offene</span>
            </button>
        {/if}
    </div>

    <div class="mt-6 flex flex-col gap-4" aria-busy={loading}>
        {#if loading}
            {#each {length: 4} as _, i (i)}
                <div class="bg-base-100 flex items-center gap-6 rounded-2xl px-6 py-5 shadow-sm sm:px-8" aria-hidden="true">
                    <div class="min-w-0 flex-1">
                        <div class="skeleton h-4 w-48"></div>
                        <div class="skeleton mt-2 h-3 w-32"></div>
                    </div>
                    <div class="skeleton h-6 w-20 rounded-full"></div>
                </div>
            {/each}
        {:else if error}
            <div role="alert" class="bg-base-100 rounded-2xl px-8 py-12 text-center shadow-sm">
                <p class="text-error font-medium">{error}</p>
            </div>
        {:else if visible.length === 0}
            <div class="py-16 text-center">
                <div class="bg-base-200 text-base-content/40 mx-auto flex size-16 items-center justify-center rounded-full">
                    <Icon name="inbox" class="size-8" />
                </div>
                <p class="text-base-content/50 mt-4">
                    {#if scope === "to_grade"}Keine Abgaben zu bewerten.{:else}Du hast noch keine Abgaben.{/if}
                </p>
            </div>
        {:else}
            {#each visible as item (item.id)}
                <div class="bg-base-100 hover:ring-primary/40 relative flex items-center gap-4 rounded-2xl px-6 py-5 shadow-sm transition-shadow hover:shadow-md hover:ring-2 sm:gap-6 sm:px-8">
                    <div class="min-w-0 flex-1">
                        <h2 class="truncate text-base font-bold">
                            <a
                                href="#/activities/{item.id}"
                                class="rounded-sm outline-none after:absolute after:inset-0 after:content-['']"
                            >
                                {item.challengeTitle}
                            </a>
                        </h2>
                        <p class="text-base-content/50 mt-1 truncate text-sm">
                            {#if scope === "to_grade"}{item.studentName} · {/if}{formatDate(item.submittedAt)}
                        </p>
                    </div>

                    <span class="shrink-0 rounded-full px-3 py-1 text-xs font-bold {STATUS[item.status].class}">
                        {STATUS[item.status].label}
                    </span>

                    <button
                        type="button"
                        class="btn btn-ghost btn-sm btn-square text-base-content/50 hover:text-error relative"
                        aria-label="Abgabe entfernen"
                        onclick={() => (pendingDelete = item)}
                    >
                        <Icon name="trash" />
                    </button>
                </div>
            {/each}
        {/if}
    </div>
</div>

<ConfirmDialog
    open={pendingDelete !== null}
    title="Abgabe entfernen?"
    message={canGrade && scope === "to_grade"
        ? "Die Abgabe wird als abgelehnt an die einreichende Person zurückgeschickt."
        : "Die Abgabe verschwindet aus deiner Liste. Sobald sie bewertet wird, taucht sie wieder auf."}
    confirmLabel="Entfernen"
    destructive
    onConfirm={confirmDelete}
    onCancel={() => (pendingDelete = null)}
/>
