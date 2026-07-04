<!--
@component
Reflection questionnaire shown after submitting a solution: one question per step
(free text · scale · choice) with a progress bar. CodePeat challenges always include
up to three default questions; teacher challenges show the questions they configured.
-->
<script lang="ts">
    import {push} from "svelte-spa-router";

    import {fetchChallenge} from "../../../services/challenges/challenges.service.js";
    import {fetchQuestionsForFilling, saveReflection} from "../../../services/reflections/reflection.service.js";
    import type {AnswerValue, ReflectionAnswer, ReflectionQuestion} from "../../../services/reflections/reflection.types.js";
    import Icon from "../../basic/Icon.svelte";

    let {params}: {params?: Record<string, string>} = $props();

    // The submission id and XP outcome ride along as query params on the route hash
    // (#/challenges/:id/reflection?submission=…&xp=none|pending|already).
    const routeQuery = new URLSearchParams(window.location.hash.split("?")[1] ?? "");
    const submissionId = routeQuery.get("submission") ?? "";
    const xpOutcome = routeQuery.get("xp") ?? "";

    // The thank-you message depends on how (and whether) this submission earns XP.
    const XP_MESSAGE: Record<string, string> = {
        pending: "Sobald dein Dozent deine Abgabe freigegeben hat, bekommst du deine wohlverdienten XP.",
        none: "Da diese Challenge unbewertet ist, bekommst du für diese Abgabe leider keine XP.",
        already: "Du hast diese Challenge schon einmal gemacht – dafür gibt es keine weiteren XP.",
    };
    const thankYouMessage = XP_MESSAGE[xpOutcome] ?? "Wir haben deine Abgabe erhalten.";

    let questions = $state<ReflectionQuestion[]>([]);
    let answers = $state<Record<string, AnswerValue>>({});
    let step = $state(0);
    let loading = $state(true);
    let saving = $state(false);
    let done = $state(false);
    let error = $state<string | null>(null);

    const SCALE_STEPS = 5;

    const total = $derived(questions.length);
    const current = $derived(questions[step] ?? null);
    const percent = $derived(total === 0 ? 0 : Math.round(((step + 1) / total) * 100));
    const isLast = $derived(step === total - 1);

    $effect(() => {
        const id = params?.id;
        if (id === undefined) {
            error = "Challenge nicht gefunden.";
            loading = false;
            return;
        }
        loading = true;
        let cancelled = false;
        (async () => {
            let isCodepeat = false;
            try {
                const challenge = await fetchChallenge(id);
                isCodepeat = challenge.creator.verified;
            } catch {
                /* fall back to no defaults */
            }
            const loaded = await fetchQuestionsForFilling(id, isCodepeat);
            if (cancelled) {
                return;
            }
            if (loaded.length === 0) {
                done = true; // nothing to reflect on, but the submission still counts
                loading = false;
                return;
            }
            questions = loaded;
            loading = false;
        })().catch(() => {
            if (!cancelled) {
                error = "Die Reflexionsfragen konnten nicht geladen werden.";
                loading = false;
            }
        });
        return () => {
            cancelled = true;
        };
    });

    function setScale(id: string, value: number): void {
        answers[id] = value;
    }

    function toggleChoice(id: string, option: string): void {
        const selected = Array.isArray(answers[id]) ? (answers[id] as string[]) : [];
        answers[id] = selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option];
    }

    function isChecked(id: string, option: string): boolean {
        return Array.isArray(answers[id]) && (answers[id] as string[]).includes(option);
    }

    function back(): void {
        if (step > 0) {
            step -= 1;
        } else {
            void push(`/challenges/${params?.id}`);
        }
    }

    async function next(): Promise<void> {
        if (!isLast) {
            step += 1;
            return;
        }
        saving = true;
        const payload: ReflectionAnswer[] = questions.map((q) => ({
            question: q.text,
            kind: q.kind,
            answer: answers[q.id] ?? (q.kind === "choice" ? [] : ""),
        }));
        try {
            if (submissionId !== "") {
                await saveReflection(submissionId, payload);
            }
        } catch {
            // best-effort: still finish the flow
        }
        saving = false;
        done = true;
    }
</script>

<div class="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 py-10 sm:py-14">
    <a href="#/challenges" aria-label="CodePeat" class="shrink-0">
        <img src="codepeat-logo.png" alt="CodePeat" class="h-16 w-auto" />
    </a>

    {#if done}
        <div class="bg-base-100 mt-12 w-full max-w-xl rounded-3xl p-8 text-center shadow-sm sm:p-12">
            <div class="bg-success/15 text-success mx-auto flex size-16 items-center justify-center rounded-full">
                <Icon name="check" class="size-9" />
            </div>
            <h1 class="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Vielen Dank für die <span class="text-primary">Abgabe</span>!
            </h1>
            <p class="text-base-content/60 mx-auto mt-4 max-w-md">
                {thankYouMessage}
            </p>
            <a href="#/challenges" class="btn btn-primary mt-8 rounded-full px-8">Zur Übersicht</a>
        </div>
    {:else}
        <h1 class="mt-8 text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            Wir hätten da noch ein paar <span class="text-primary">Fragen</span>…
        </h1>
        <p class="text-base-content/50 mt-2 text-center">Diese Fragen helfen uns dabei, dir zu helfen.</p>

        {#if loading}
        <div class="flex flex-1 items-center py-24">
            <span class="loading loading-spinner loading-lg text-primary" aria-hidden="true"></span>
            <span class="sr-only" role="status">Reflexionsfragen werden geladen…</span>
        </div>
    {:else if error}
        <div role="alert" class="bg-base-100 mt-10 rounded-2xl px-8 py-12 text-center shadow-sm">
            <p class="text-error font-medium">{error}</p>
            <a href="#/challenges" class="link link-primary mt-2 inline-block text-sm">Zur Übersicht</a>
        </div>
    {:else if current}
        <div class="bg-base-100 mt-10 w-full rounded-3xl p-6 shadow-sm sm:p-10">
            <h2 class="text-center text-lg font-bold">{current.text}</h2>

            <div class="mt-6">
                {#if current.kind === "text"}
                    <textarea
                        class="border-base-200 focus:border-primary w-full resize-y rounded-2xl border px-5 py-4 outline-none"
                        rows="4"
                        placeholder="Diese Antwort finden wir besonders interessant…"
                        value={typeof answers[current.id] === "string" ? (answers[current.id] as string) : ""}
                        oninput={(e) => (answers[current.id] = e.currentTarget.value)}
                    ></textarea>
                {:else if current.kind === "scale"}
                    <div class="px-2">
                        <div class="flex items-center justify-between">
                            {#each Array(SCALE_STEPS) as _, i (i)}
                                <button
                                    type="button"
                                    aria-label={`Stufe ${i + 1} von ${SCALE_STEPS}`}
                                    aria-pressed={answers[current.id] === i}
                                    class="size-6 rounded-full border-2 transition-colors {answers[current.id] === i
                                        ? 'border-primary bg-primary'
                                        : 'border-base-300 bg-base-100 hover:border-primary'}"
                                    onclick={() => setScale(current.id, i)}
                                ></button>
                            {/each}
                        </div>
                        <div class="text-base-content/60 mt-2 flex justify-between text-sm">
                            <span>{current.options[0] ?? "gar nicht"}</span>
                            <span>{current.options[1] ?? "sehr stark"}</span>
                        </div>
                    </div>
                {:else}
                    <div class="space-y-3">
                        {#each current.options as option (option)}
                            <label class="flex cursor-pointer items-center gap-3">
                                <input type="checkbox" class="checkbox checkbox-primary" checked={isChecked(current.id, option)} onchange={() => toggleChoice(current.id, option)} />
                                <span>{option}</span>
                            </label>
                        {/each}
                    </div>
                {/if}
            </div>

            <div class="mt-8 flex justify-center gap-4">
                <button type="button" class="btn btn-outline w-40 rounded-full" onclick={back}>Zurück</button>
                <button type="button" class="btn btn-primary w-40 rounded-full" onclick={next} disabled={saving}>
                    {#if saving}<span class="loading loading-spinner loading-sm"></span>{:else}{isLast ? "Abschließen" : "Weiter"}{/if}
                </button>
            </div>
        </div>

        <div class="mt-auto w-full pt-12">
            <p class="text-base-content/60 mb-2 text-center text-sm font-medium">{percent}%</p>
            <div class="bg-base-300 h-2.5 w-full overflow-hidden rounded-full">
                <div class="bg-primary h-full rounded-full transition-all duration-500" style="width: {percent}%"></div>
            </div>
        </div>
        {/if}
    {/if}
</div>
