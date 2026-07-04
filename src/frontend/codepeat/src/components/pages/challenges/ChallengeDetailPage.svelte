<!--
@component
Challenge detail page: shows the task, a worked example and constraints for a
single challenge, with a running solve timer that can be paused.
-->
<script lang="ts">
    import {push} from "svelte-spa-router";

    import {fetchChallenge} from "../../../services/challenges/challenges.service.js";
    import type {ChallengeDetail} from "../../../services/challenges/challenges.types.js";
    import {createSubmission} from "../../../services/submissions/submission.service.js";
    import {currentUser, refreshSession} from "../../../services/user/user.store.js";
    import Icon from "../../basic/Icon.svelte";
    import VerifiedBadge from "../../basic/VerifiedBadge.svelte";
    import CodeBlock from "./CodeBlock.svelte";
    import SubmitModal from "./SubmitModal.svelte";
    import {difficultyBadgeClass, difficultyLabel} from "./challenges.utils.js";
    import {challengesViewState} from "./challenges.view-state.js";

    let {params}: {params?: Record<string, string>} = $props();

    let challenge = $state<ChallengeDetail | null>(null);
    let loading = $state(true);
    let error = $state<string | null>(null);

    let elapsedSeconds = $state(0);
    let timerRunning = $state(true);
    let submitOpen = $state(false);

    const formattedTime = $derived(formatDuration(elapsedSeconds));
    const formattedDate = $derived(challenge ? formatDate(challenge.createdAt) : "");
    // Own challenges cannot be submitted to; the creator sees an edit shortcut instead.
    const isOwn = $derived(challenge !== null && challenge.createdBy === ($currentUser?.id ?? null));

    $effect(() => {
        const id = params?.id;
        loading = true;
        error = null;
        challenge = null;

        if (id === undefined) {
            error = "Challenge nicht gefunden.";
            loading = false;
            return;
        }

        let cancelled = false;
        fetchChallenge(id)
            .then((result) => {
                if (!cancelled) {
                    challenge = result;
                }
            })
            .catch((cause) => {
                if (!cancelled) {
                    error = cause instanceof Error ? cause.message : "Challenge konnte nicht geladen werden.";
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

    $effect(() => {
        if (!timerRunning) {
            return;
        }
        const handle = setInterval(() => {
            elapsedSeconds += 1;
        }, 1000);
        return () => clearInterval(handle);
    });

    function formatDuration(totalSeconds: number): string {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
    }

    function formatDate(isoDate: string): string {
        const date = new Date(isoDate);
        return isoDate === "" || Number.isNaN(date.getTime())
            ? ""
            : date.toLocaleDateString("de-DE", {day: "numeric", month: "short", year: "numeric"});
    }

    async function submitSolution(file: File): Promise<void> {
        if (challenge === null) {
            return;
        }
        const id = challenge.id;
        const {id: submissionId, xpOutcome} = await createSubmission(id, file); // throws → modal shows the error
        submitOpen = false;
        await refreshSession(); // reflect any newly earned XP in the navbar
        void push(`/challenges/${id}/reflection?submission=${submissionId}&xp=${xpOutcome}`);
    }
</script>

<div class="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6">
    {#if loading}
        <div class="flex justify-center py-24">
            <span class="loading loading-spinner loading-lg text-primary" aria-hidden="true"></span>
            <span class="sr-only" role="status">Challenge wird geladen…</span>
        </div>
    {:else if error}
        <div role="alert" class="bg-base-100 rounded-2xl px-8 py-12 text-center shadow-sm">
            <p class="text-error font-medium">{error}</p>
            <a href="#/challenges" class="link link-primary mt-2 inline-block text-sm">Zurück zur Übersicht</a>
        </div>
    {:else if challenge}
        <div class="flex items-center gap-3">
            <a
                href="#/challenges"
                aria-label="Zurück zur Übersicht"
                class="text-base-content/60 hover:text-base-content shrink-0 transition-colors"
                onclick={() => (challengesViewState.restore = true)}
            >
                <Icon name="arrow-left" class="size-7" />
            </a>
            <h1 class="text-3xl font-bold sm:text-4xl">{challenge.title}</h1>
        </div>

        <div class="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div class="flex items-center gap-3">
                <div class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full {challenge.creator.verified ? 'bg-base-100 ring-base-200 ring-1' : 'bg-base-300'}">
                    {#if challenge.creator.avatarUrl}
                        <img
                            src={challenge.creator.avatarUrl}
                            alt=""
                            class={challenge.creator.verified ? "size-9 object-contain" : "size-full object-cover"}
                        />
                    {:else}
                        <Icon name="user" filled class="text-base-content size-7" />
                    {/if}
                </div>
                <div>
                    <div class="flex items-center gap-1.5">
                        <span class="font-bold">{challenge.creator.displayName}</span>
                        {#if challenge.creator.verified}
                            <VerifiedBadge class="size-5" />
                        {/if}
                    </div>
                    <div class="text-base-content/50 mt-1 flex items-center gap-4 text-sm">
                        {#if challenge.views > 0}
                            <span class="flex items-center gap-1.5">
                                <Icon name="eye" class="size-4" /> {challenge.views}
                            </span>
                        {/if}
                        <span class="flex items-center gap-1.5">
                            <Icon name="calendar" class="size-4" /> {formattedDate}
                        </span>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <span class="font-mono text-lg tabular-nums">{formattedTime}</span>
                <Icon name="clock" class="text-base-content/60 size-6" />
                <button
                    type="button"
                    class="text-base-content/70 hover:text-base-content transition-colors"
                    aria-label={timerRunning ? "Timer pausieren" : "Timer fortsetzen"}
                    onclick={() => (timerRunning = !timerRunning)}
                >
                    <Icon name={timerRunning ? "pause" : "play"} class="size-6" />
                </button>
            </div>
        </div>

        <div class="mt-5">
            <span class="inline-block rounded-full px-4 py-1.5 text-sm font-semibold {difficultyBadgeClass(challenge.difficulty)}">
                {difficultyLabel(challenge.difficulty)}
            </span>
        </div>

        <hr class="border-base-300 my-6" />

        <div class="bg-base-100 rounded-3xl p-6 shadow-sm sm:p-10">
            <section>
                <h2 class="text-xl font-bold">Aufgabenstellung</h2>
                <ul class="text-base-content/80 mt-4 list-disc space-y-2 pl-6">
                    {#each challenge.tasks as task (task)}
                        <li>{task}</li>
                    {/each}
                </ul>
            </section>

            {#if challenge.example}
                <hr class="border-base-200 my-8" />

                <section>
                    <h2 class="text-xl font-bold">Beispiel</h2>
                    <div class="mt-4 space-y-6">
                        <CodeBlock label="Input" language={challenge.example.language} code={challenge.example.input} />
                        <CodeBlock label="Output" language={challenge.example.language} code={challenge.example.output} />
                    </div>
                </section>
            {/if}

            {#if challenge.constraints.length > 0}
                <hr class="border-base-200 my-8" />

                <section>
                    <h2 class="text-xl font-bold">Einschränkungen</h2>
                    <ul class="text-base-content/80 mt-4 list-disc space-y-2 pl-6">
                        {#each challenge.constraints as constraint (constraint)}
                            <li>{constraint}</li>
                        {/each}
                    </ul>
                </section>
            {/if}

            {#if isOwn}
                <a href="#/challenges/{challenge.id}/edit" class="btn btn-outline mt-10 h-14 w-full rounded-full text-lg">
                    <Icon name="edit" class="size-5" /> Challenge bearbeiten
                </a>
            {:else}
                <button type="button" class="btn btn-primary mt-10 h-14 w-full rounded-full text-lg" onclick={() => (submitOpen = true)}>
                    Einreichen
                </button>
            {/if}
        </div>
    {/if}
</div>

{#if !isOwn}
    <SubmitModal open={submitOpen} onClose={() => (submitOpen = false)} onSubmit={submitSolution} />
{/if}
