<!--
@component
Submission detail. The owner (student) sees the status and, once graded, the lecturer's
feedback. The challenge creator sees the reflection answers, can download the ZIP and — only
after downloading — grade the submission (accept/reject with an optional comment).
-->
<script lang="ts">
    import {currentUser} from "../../../services/user/user.store.js";
    import {fetchSubmission, gradeSubmission} from "../../../services/submissions/submission.service.js";
    import type {ReflectionAnswer} from "../../../services/reflections/reflection.types.js";
    import type {SubmissionDetail, SubmissionStatus} from "../../../services/submissions/submission.types.js";
    import Icon from "../../basic/Icon.svelte";

    let {params}: {params?: Record<string, string>} = $props();

    const STATUS: Record<SubmissionStatus, {label: string; class: string}> = {
        pending: {label: "Offen", class: "bg-warning/15 text-warning"},
        accepted: {label: "Akzeptiert", class: "bg-success/15 text-success"},
        rejected: {label: "Abgelehnt", class: "bg-error/15 text-error"},
    };

    let submission = $state<SubmissionDetail | null>(null);
    let loading = $state(true);
    let error = $state<string | null>(null);

    let downloaded = $state(false);
    let gradingOpen = $state(false);
    let comment = $state("");
    let submitting = $state(false);

    const isOwner = $derived(submission !== null && String($currentUser?.id ?? "") === submission.studentId);
    const canGrade = $derived(submission !== null && !isOwner && submission.status === "pending");

    $effect(() => {
        const id = params?.id;
        if (id === undefined) {
            error = "Abgabe nicht gefunden.";
            loading = false;
            return;
        }
        let cancelled = false;
        loading = true;
        fetchSubmission(id)
            .then((loaded) => {
                if (!cancelled) {
                    submission = loaded;
                }
            })
            .catch((cause: unknown) => {
                if (!cancelled) {
                    error = cause instanceof Error ? cause.message : "Die Abgabe konnte nicht geladen werden.";
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

    function formatDate(iso: string): string {
        return iso ? new Date(iso).toLocaleDateString("de-DE", {day: "2-digit", month: "2-digit", year: "numeric"}) : "";
    }

    function answerText(answer: ReflectionAnswer): string {
        if (answer.kind === "choice" && Array.isArray(answer.answer)) {
            return answer.answer.length > 0 ? answer.answer.join(", ") : "—";
        }
        if (answer.kind === "scale") {
            return `Stufe ${Number(answer.answer) + 1} von 5`;
        }
        const text = String(answer.answer ?? "").trim();
        return text === "" ? "—" : text;
    }

    async function grade(decision: "accept" | "reject"): Promise<void> {
        if (submission === null) {
            return;
        }
        submitting = true;
        try {
            await gradeSubmission(submission.id, decision, comment);
            submission = {...submission, status: decision === "accept" ? "accepted" : "rejected", feedback: comment.trim() || null};
            gradingOpen = false;
        } catch (cause) {
            error = cause instanceof Error ? cause.message : "Bewertung fehlgeschlagen.";
        } finally {
            submitting = false;
        }
    }
</script>

<div class="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6">
    <a href="#/activities" class="text-base-content/60 hover:text-base-content mb-6 inline-flex items-center gap-2 text-sm font-semibold">
        <Icon name="arrow-left" class="size-4" /> Zurück zu den Aktivitäten
    </a>

    {#if loading}
        <div class="flex items-center justify-center py-24" role="status" aria-label="Wird geladen">
            <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>
    {:else if error}
        <div role="alert" class="bg-base-100 rounded-2xl px-8 py-12 text-center shadow-sm">
            <p class="text-error font-medium">{error}</p>
        </div>
    {:else if submission}
        <div class="bg-base-100 rounded-3xl p-6 shadow-sm sm:p-8">
            <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                    <h1 class="text-2xl font-extrabold tracking-tight">
                        <a href="#/challenges/{submission.challengeId}" class="hover:text-primary transition-colors">{submission.challengeTitle}</a>
                    </h1>
                    <p class="text-base-content/50 mt-1 text-sm">
                        {#if !isOwner}{submission.studentName} · {/if}Abgegeben am {formatDate(submission.submittedAt)}
                    </p>
                    {#if submission.zipUrl}
                        <a href={submission.zipUrl} download class="btn btn-outline btn-sm mt-4 rounded-full" onclick={() => (downloaded = true)}>
                            <Icon name="download" class="size-5" /> ZIP herunterladen
                        </a>
                    {/if}
                </div>
                <span class="shrink-0 rounded-full px-3 py-1 text-xs font-bold {STATUS[submission.status].class}">{STATUS[submission.status].label}</span>
            </div>
        </div>

        <section class="bg-base-100 mt-4 rounded-3xl p-6 shadow-sm sm:p-8">
            <h2 class="text-lg font-bold">Reflexionsfragen</h2>
            {#if submission.reflectionAnswers.length === 0}
                <p class="text-base-content/50 mt-3 text-sm">Keine Reflexionsantworten hinterlegt.</p>
            {:else}
                <dl class="mt-4 flex flex-col gap-4">
                    {#each submission.reflectionAnswers as answer, i (i)}
                        <div class="border-base-200 border-b pb-4 last:border-0 last:pb-0">
                            <dt class="text-base-content/70 text-sm font-semibold">{answer.question}</dt>
                            <dd class="mt-1 whitespace-pre-wrap">{answerText(answer)}</dd>
                        </div>
                    {/each}
                </dl>
            {/if}
        </section>

        {#if canGrade}
            <section class="bg-base-100 mt-4 rounded-3xl p-6 shadow-sm sm:p-8">
                <h2 class="text-lg font-bold">Bewerten</h2>
                {#if !gradingOpen}
                    <p class="text-base-content/50 mt-2 text-sm">
                        {#if downloaded || submission.zipUrl === null}Akzeptiere oder lehne die Abgabe ab. Ein Kommentar ist optional.{:else}Lade zuerst die Abgabe herunter (oben), um sie zu bewerten.{/if}
                    </p>
                    <button type="button" class="btn btn-primary mt-4 rounded-full" disabled={submission.zipUrl !== null && !downloaded} onclick={() => (gradingOpen = true)}>
                        Bewerten
                    </button>
                {:else}
                    <textarea
                        class="border-base-200 focus:border-primary mt-4 w-full resize-y rounded-2xl border px-5 py-4 outline-none"
                        rows="4"
                        placeholder="Bewertung (optional)…"
                        bind:value={comment}
                    ></textarea>
                    <div class="mt-4 flex flex-col gap-3 sm:flex-row">
                        <button type="button" class="btn btn-success flex-1 rounded-full" disabled={submitting} onclick={() => grade("accept")}>
                            <Icon name="check" class="size-5" /> Akzeptieren
                        </button>
                        <button type="button" class="btn btn-error btn-outline flex-1 rounded-full" disabled={submitting} onclick={() => grade("reject")}>
                            <Icon name="no-symbol" class="size-5" /> Ablehnen
                        </button>
                    </div>
                {/if}
            </section>
        {:else if isOwner && submission.status !== "pending"}
            <section class="bg-base-100 mt-4 rounded-3xl p-6 shadow-sm sm:p-8">
                <h2 class="text-lg font-bold">Bewertung</h2>
                {#if submission.feedback}
                    <p class="mt-3 whitespace-pre-wrap">{submission.feedback}</p>
                {:else}
                    <p class="text-base-content/50 mt-3 text-sm">
                        {submission.status === "accepted" ? "Deine Abgabe wurde akzeptiert." : "Deine Abgabe wurde abgelehnt."}
                    </p>
                {/if}
                {#if submission.status === "accepted" && submission.requiresGrading}
                    <p class="text-success mt-3 text-sm font-semibold">Deine XP wurden freigeschaltet. 🎉</p>
                {/if}
            </section>
        {/if}
    {/if}
</div>
