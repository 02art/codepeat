<!--
@component
Challenge editor for teachers/admins: create or edit a challenge across three tabs
(task with live preview · reflection questions · settings with privacy, invite
links and deletion). Backed by the real CodePeat API.
-->
<script lang="ts">
    import {push} from "svelte-spa-router";

    import {currentUser} from "../../../services/user/user.store.js";
    import {
        createChallenge,
        createInviteLink,
        deleteChallenge,
        fetchChallengeDraft,
        updateChallenge,
    } from "../../../services/challenges/challenges.service.js";
    import type {ChallengeDraft, Difficulty} from "../../../services/challenges/challenges.types.js";
    import {fetchChallengeQuestions, replaceReflectionQuestions} from "../../../services/reflections/reflection.service.js";
    import {CATALOGUE} from "../../../services/reflections/reflection.config.js";
    import type {QuestionDraft, QuestionKind} from "../../../services/reflections/reflection.types.js";
    import Icon, {type IconName} from "../../basic/Icon.svelte";
    import Modal from "../../basic/Modal.svelte";
    import CodeBlock from "./CodeBlock.svelte";
    import CustomQuestionModal from "./CustomQuestionModal.svelte";

    let {params}: {params?: Record<string, string>} = $props();

    const editId = $derived(params?.id ?? null);
    const isEdit = $derived(editId !== null);

    type Tab = "aufgabe" | "reflexion" | "einstellungen";
    let activeTab = $state<Tab>("aufgabe");

    let draft = $state<ChallengeDraft>({
        title: "",
        description: "",
        constraints: "",
        exampleLanguage: "Java",
        exampleInput: "",
        exampleOutput: "",
        difficulty: "easy",
        visibility: "public",
        requiresGrading: true,
    });

    let loading = $state(false);
    let saving = $state(false);
    let error = $state<string | null>(null);

    // Invitation link (private challenges, edit mode only).
    let inviteUrl = $state<string | null>(null);
    let inviteExpiresAt = $state(0);
    let nowMs = $state(Date.now());
    let inviteLoading = $state(false);
    let linkCopied = $state(false);

    let deleteOpen = $state(false);
    let deleting = $state(false);

    // Reflection questions attached to this challenge (staged client-side, saved on publish).
    let questions = $state<QuestionDraft[]>([]);
    let catalogueOpen = $state(false);
    let customOpen = $state(false);
    let keyCounter = 0;

    const kindLabels: Record<QuestionKind, string> = {text: "Freitext", scale: "Skala", choice: "Auswahl"};

    const difficulties: {value: Difficulty; label: string; active: string}[] = [
        {value: "easy", label: "Einfach", active: "border-success bg-success/10 text-success"},
        {value: "medium", label: "Mittel", active: "border-warning bg-warning/10 text-warning"},
        {value: "hard", label: "Schwer", active: "border-error bg-error/10 text-error"},
    ];

    const tabs: {id: Tab; icon: IconName; label: string}[] = [
        {id: "aufgabe", icon: "edit", label: "Aufgabe"},
        {id: "reflexion", icon: "clipboard-check", label: "Reflexionsfragen"},
        {id: "einstellungen", icon: "settings", label: "Einstellungen"},
    ];

    // Only teachers/admins may use the editor; bounce everyone else.
    $effect(() => {
        if ($currentUser !== null && !$currentUser.canCreateChallenges) {
            void push("/challenges");
        }
    });

    // Edit mode: load the existing challenge's raw fields.
    $effect(() => {
        const id = editId;
        if (id === null) {
            return;
        }
        loading = true;
        error = null;
        let cancelled = false;
        fetchChallengeDraft(id)
            .then((loaded) => {
                if (!cancelled) {
                    draft = loaded;
                }
            })
            .catch(() => {
                if (!cancelled) {
                    error = "Challenge konnte nicht geladen werden.";
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

    // Edit mode: load the challenge's existing reflection questions.
    $effect(() => {
        const id = editId;
        if (id === null) {
            return;
        }
        let cancelled = false;
        fetchChallengeQuestions(id)
            .then((loaded) => {
                if (!cancelled) {
                    questions = loaded.map((q) => ({key: `q-${keyCounter++}`, text: q.text, kind: q.kind, options: q.options}));
                }
            })
            .catch(() => {
                /* leave the list empty; the rest of the editor still works */
            });
        return () => {
            cancelled = true;
        };
    });

    function addCatalogueQuestion(text: string, kind: QuestionKind, options: string[]): void {
        if (questions.some((q) => q.text === text)) {
            return; // already added
        }
        questions = [...questions, {key: `q-${keyCounter++}`, text, kind, options}];
    }

    function addCustomQuestion(q: {text: string; kind: QuestionKind; options: string[]}): void {
        questions = [...questions, {key: `q-${keyCounter++}`, ...q}];
        customOpen = false;
    }

    function removeQuestion(key: string): void {
        questions = questions.filter((q) => q.key !== key);
    }

    // Tick the invite-link countdown while a link is shown.
    $effect(() => {
        if (inviteUrl === null) {
            return;
        }
        const handle = setInterval(() => (nowMs = Date.now()), 1000);
        return () => clearInterval(handle);
    });

    const remaining = $derived(inviteUrl === null ? 0 : Math.max(0, Math.round((inviteExpiresAt - nowMs) / 1000)));
    const remainingLabel = $derived(
        `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`,
    );

    const previewTasks = $derived(splitLines(draft.description));
    const previewConstraints = $derived(splitLines(draft.constraints));
    const hasExample = $derived(draft.exampleInput.trim() !== "" || draft.exampleOutput.trim() !== "");

    function splitLines(text: string): string[] {
        return text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
    }

    function onVisibilityChange(makePrivate: boolean): void {
        draft.visibility = makePrivate ? "private" : "public";
        if (!makePrivate) {
            inviteUrl = null; // public challenges have no invite link
        }
    }

    async function publish(): Promise<void> {
        if (draft.title.trim() === "") {
            error = "Bitte gib einen Titel ein.";
            activeTab = "aufgabe";
            return;
        }
        saving = true;
        error = null;
        try {
            let id = editId;
            if (isEdit && editId !== null) {
                await updateChallenge(editId, draft);
            } else {
                id = await createChallenge(draft);
            }
            if (id !== null) {
                await replaceReflectionQuestions(id, questions);
            }
            await push("/challenges");
        } catch {
            error = "Speichern fehlgeschlagen. Bitte versuche es erneut.";
        } finally {
            saving = false;
        }
    }

    async function generateLink(): Promise<void> {
        if (editId === null) {
            return;
        }
        inviteLoading = true;
        error = null;
        try {
            await updateChallenge(editId, draft); // make sure the saved challenge is private first
            const {url, expiresIn} = await createInviteLink(editId);
            inviteUrl = url;
            inviteExpiresAt = Date.now() + expiresIn * 1000;
            nowMs = Date.now();
        } catch {
            error = "Einladungslink konnte nicht erstellt werden.";
        } finally {
            inviteLoading = false;
        }
    }

    async function copyLink(): Promise<void> {
        if (inviteUrl === null || navigator.clipboard === undefined) {
            return;
        }
        await navigator.clipboard.writeText(inviteUrl);
        linkCopied = true;
        setTimeout(() => (linkCopied = false), 2000);
    }

    async function confirmDelete(): Promise<void> {
        if (editId === null) {
            return;
        }
        deleting = true;
        try {
            await deleteChallenge(editId);
            await push("/challenges");
        } catch {
            error = "Challenge konnte nicht gelöscht werden.";
            deleting = false;
            deleteOpen = false;
        }
    }
</script>

{#snippet codeField(label: string, value: string, placeholder: string, set: (v: string) => void)}
    <div>
        <div class="text-base-content/70 mb-1.5 flex items-center gap-2 text-sm font-bold">
            <Icon name={label === "Input" ? "bug" : "settings"} class="size-4" /> {label}
        </div>
        <div class="border-base-200 overflow-hidden rounded-xl border">
            <div class="bg-base-200 px-4 py-2">
                <span class="text-primary text-sm font-semibold">{draft.exampleLanguage}</span>
            </div>
            <textarea
                class="bg-base-100 text-base-content w-full resize-y px-4 py-3 font-mono text-sm outline-none"
                rows="2"
                {placeholder}
                value={value}
                oninput={(e) => set(e.currentTarget.value)}
            ></textarea>
        </div>
    </div>
{/snippet}

<div class="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6">
    <p class="text-base-content/50 text-sm">Challenge Editor</p>
    <h1 class="mt-1 text-3xl font-bold sm:text-4xl">{isEdit ? "Challenge bearbeiten" : "Challenge erstellen"}</h1>

    <!-- Tabs (horizontally scrollable on narrow screens so they never get clipped) -->
    <div class="border-base-200 mt-8 flex gap-1 overflow-x-auto border-b">
        {#each tabs as tab (tab.id)}
            <button
                type="button"
                class="flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors sm:px-5 {activeTab === tab.id
                    ? 'border-primary text-primary border-b-2'
                    : 'text-base-content/60 hover:text-base-content border-b-2 border-transparent'}"
                onclick={() => (activeTab = tab.id)}
            >
                <Icon name={tab.icon} class="size-4 shrink-0" /> {tab.label}
            </button>
        {/each}
    </div>

    {#if error}
        <div role="alert" class="bg-error/10 text-error mt-4 rounded-xl px-4 py-3 text-sm font-medium">{error}</div>
    {/if}

    {#if loading}
        <div class="flex justify-center py-24">
            <span class="loading loading-spinner loading-lg text-primary" aria-hidden="true"></span>
            <span class="sr-only" role="status">Challenge wird geladen…</span>
        </div>
    {:else}
        <!-- Aufgabe -->
        {#if activeTab === "aufgabe"}
            <div class="mt-6 grid gap-6 lg:grid-cols-2">
                <!-- Form -->
                <div class="bg-base-100 rounded-3xl p-6 shadow-sm sm:p-8">
                    <h2 class="flex items-center gap-2 text-lg font-bold"><Icon name="search" class="size-5" /> Titel</h2>
                    <input
                        type="text"
                        maxlength="72"
                        class="border-base-200 focus:border-primary mt-3 w-full rounded-xl border px-4 py-3 outline-none"
                        placeholder="Der Titel wird in der Challenge-Übersicht angezeigt."
                        bind:value={draft.title}
                    />
                    <p class="text-base-content/40 mt-1.5 text-right text-xs font-semibold">max. 72 Zeichen</p>

                    <h2 class="mt-6 flex items-center gap-2 text-lg font-bold"><Icon name="edit" class="size-5" /> Aufgabenstellung</h2>
                    <textarea
                        class="border-base-200 focus:border-primary mt-3 w-full resize-y rounded-xl border px-4 py-3 outline-none"
                        rows="5"
                        placeholder="Beschreibe die Aufgabe aus Sicht der Lernenden. Eine Anforderung pro Zeile."
                        bind:value={draft.description}
                    ></textarea>
                    <p class="text-primary mt-2 text-sm font-medium">🐊 CodePeat Tipp: Eine Anforderung pro Zeile — jede Zeile wird ein Aufzählungspunkt.</p>

                    <div class="mt-6 grid gap-5 sm:grid-cols-2">
                        {@render codeField("Input", draft.exampleInput, "// Beispiel: numb1 = 5; numb2 = 10;", (v) => (draft.exampleInput = v))}
                        {@render codeField("Output", draft.exampleOutput, "// Beispiel: sum = 15;", (v) => (draft.exampleOutput = v))}
                    </div>

                    <h2 class="mt-6 flex items-center gap-2 text-lg font-bold"><Icon name="sort" class="size-5" /> Einschränkungen</h2>
                    <textarea
                        class="border-base-200 focus:border-primary mt-3 w-full resize-y rounded-xl border px-4 py-3 outline-none"
                        rows="3"
                        placeholder="z. B. keine Schleifen, maximale Laufzeit, keine Hilfsfunktionen. Eine Einschränkung pro Zeile."
                        bind:value={draft.constraints}
                    ></textarea>
                    <p class="text-primary mt-2 text-sm font-medium">🐊 CodePeat Tipp: Dieses Feld kann deine Challenge besonders einzigartig machen.</p>
                </div>

                <!-- Live preview -->
                <div class="bg-base-100 rounded-3xl p-6 shadow-sm sm:p-10">
                    <div class="mb-2 flex justify-end">
                        <span class="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
                            <Icon name="eye" class="size-4" /> Live Preview
                        </span>
                    </div>

                    <h2 class="text-xl font-bold">Aufgabenstellung <span class="text-base-content/40 text-base font-normal">(Preview)</span></h2>
                    <ul class="text-base-content/80 mt-4 list-disc space-y-2 pl-6">
                        {#if previewTasks.length === 0}
                            <li class="text-base-content/40 list-none pl-0">Die Aufgabenstellung erscheint hier, sobald du sie erfasst.</li>
                        {:else}
                            {#each previewTasks as task (task)}<li>{task}</li>{/each}
                        {/if}
                    </ul>

                    <hr class="border-base-200 my-6" />

                    <h2 class="text-xl font-bold">Beispiel</h2>
                    <div class="mt-4 space-y-6">
                        <CodeBlock label="Input" language={draft.exampleLanguage} code={hasExample ? draft.exampleInput : "// Noch kein Beispiel definiert"} />
                        <CodeBlock label="Output" language={draft.exampleLanguage} code={hasExample ? draft.exampleOutput : "// Noch kein Beispiel definiert"} />
                    </div>

                    <hr class="border-base-200 my-6" />

                    <h2 class="text-xl font-bold">Einschränkungen</h2>
                    <ul class="text-base-content/80 mt-4 list-disc space-y-2 pl-6">
                        {#if previewConstraints.length === 0}
                            <li class="text-base-content/40 list-none pl-0">Die Einschränkungen erscheinen hier, sobald du sie erfasst.</li>
                        {:else}
                            {#each previewConstraints as constraint (constraint)}<li>{constraint}</li>{/each}
                        {/if}
                    </ul>
                </div>
            </div>
        {/if}

        <!-- Reflexionsfragen -->
        {#if activeTab === "reflexion"}
            <div class="bg-base-100 mt-6 rounded-3xl p-6 shadow-sm sm:p-8">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <h2 class="text-xl font-bold">Reflexionsfragen <span class="text-base-content/40 text-base font-normal">({questions.length})</span></h2>
                    <div class="flex gap-2">
                        <button type="button" class="btn btn-outline rounded-full" onclick={() => (catalogueOpen = !catalogueOpen)}>
                            <Icon name="list" class="size-5" /> Aus Vorlage
                        </button>
                        <button type="button" class="btn btn-primary rounded-full" onclick={() => (customOpen = true)}>
                            <Icon name="plus" class="size-5" /> Eigene Frage
                        </button>
                    </div>
                </div>

                <!-- Catalogue picker -->
                {#if catalogueOpen}
                    <div class="border-base-200 mt-4 rounded-2xl border p-4">
                        {#each CATALOGUE as group (group.title)}
                            <p class="text-base-content/50 mt-2 mb-1 text-xs font-bold tracking-wide uppercase first:mt-0">{group.title}</p>
                            {#each group.questions as q (q.text)}
                                {@const added = questions.some((x) => x.text === q.text)}
                                <button
                                    type="button"
                                    class="hover:bg-base-200 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors disabled:opacity-40"
                                    disabled={added}
                                    onclick={() => addCatalogueQuestion(q.text, q.kind, q.options ?? [])}
                                >
                                    <Icon name={added ? "check" : "plus"} class="text-primary size-5 shrink-0" />
                                    <span class="flex-1 text-sm">{q.text}</span>
                                    <span class="bg-base-200 text-base-content/60 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold">{kindLabels[q.kind]}</span>
                                </button>
                            {/each}
                        {/each}
                    </div>
                {/if}

                <!-- Added questions -->
                {#if questions.length === 0}
                    <p class="text-base-content/50 mt-6 text-sm">Noch keine Reflexionsfragen. Füge welche aus der Vorlage hinzu oder lege eine eigene an.</p>
                {:else}
                    <ul class="mt-4 space-y-3">
                        {#each questions as q (q.key)}
                            <li class="border-base-200 flex items-start gap-3 rounded-2xl border px-4 py-3">
                                <span class="bg-primary/10 text-primary mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold">{kindLabels[q.kind]}</span>
                                <div class="min-w-0 flex-1">
                                    <p class="text-sm font-medium">{q.text}</p>
                                    {#if q.kind === "choice"}
                                        <p class="text-base-content/50 mt-1 truncate text-xs">{q.options.join(" · ")}</p>
                                    {:else if q.kind === "scale"}
                                        <p class="text-base-content/50 mt-1 text-xs">{q.options[0]} → {q.options[1]}</p>
                                    {/if}
                                </div>
                                <button type="button" class="text-base-content/40 hover:text-error shrink-0" aria-label="Frage entfernen" onclick={() => removeQuestion(q.key)}>
                                    <Icon name="trash" class="size-5" />
                                </button>
                            </li>
                        {/each}
                    </ul>
                {/if}

                {#if $currentUser !== null}
                    <p class="text-base-content/40 mt-6 text-xs">
                        Bei CodePeat-Challenges sind zusätzlich bis zu drei Standardfragen automatisch enthalten.
                    </p>
                {/if}
            </div>
        {/if}

        <!-- Einstellungen -->
        {#if activeTab === "einstellungen"}
            <div class="bg-base-100 mt-6 rounded-3xl p-6 shadow-sm sm:p-8">
                <h2 class="text-xl font-bold">Einstellungen</h2>

                <!-- Difficulty -->
                <div class="border-base-200 mt-6 border-b pb-6">
                    <p class="flex items-center gap-2 font-bold"><Icon name="flame" class="size-5" /> Schwierigkeit</p>
                    <div class="mt-3 flex flex-wrap gap-3">
                        {#each difficulties as d (d.value)}
                            <button
                                type="button"
                                aria-pressed={draft.difficulty === d.value}
                                class="min-w-24 rounded-xl border-2 px-5 py-2.5 text-sm font-bold transition-all {draft.difficulty === d.value
                                    ? d.active
                                    : 'border-base-200 text-base-content/50 hover:border-base-300'}"
                                onclick={() => (draft.difficulty = d.value)}
                            >
                                {d.label}
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Grading / XP release -->
                <div class="mt-6">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <h3 class="flex items-center gap-2 font-bold"><Icon name="clipboard-check" class="size-5" /> Bewertung erforderlich</h3>
                            <p class="text-base-content/60 mt-1.5 max-w-3xl text-sm">
                                Ist diese Einstellung aktiv, erhalten Studierende ihre XP erst, nachdem du ihre Abgabe
                                freigegeben hast. Ist sie deaktiviert, gibt es für diese Challenge aktuell keine XP,
                                da es noch keine automatische Bewertung gibt.
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            class="toggle toggle-primary shrink-0"
                            aria-label="Bewertung erforderlich"
                            bind:checked={draft.requiresGrading}
                        />
                    </div>
                </div>

                <!-- Privacy -->
                <div class="mt-6">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <h3 class="flex items-center gap-2 font-bold"><Icon name="lock" class="size-5" /> Private Challenge</h3>
                            <p class="text-base-content/60 mt-1.5 max-w-3xl text-sm">
                                Mit dieser Einstellung kannst du die Challenge auf privat setzen. Nach dem Aktivieren kannst du einen
                                Einladungslink erstellen, über den andere dauerhaft Zugriff erhalten. Der Link ist 30 Minuten gültig und
                                kann jeweils um weitere 30 Minuten verlängert werden. Wird die Challenge zwischenzeitlich öffentlich
                                geschaltet und anschließend wieder privat, verlieren alle bisher freigeschalteten Personen ihren Zugriff.
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            class="toggle toggle-primary shrink-0"
                            aria-label="Private Challenge"
                            checked={draft.visibility === "private"}
                            onchange={(e) => onVisibilityChange(e.currentTarget.checked)}
                        />
                    </div>

                    {#if draft.visibility === "private"}
                        <div class="mt-5">
                            {#if !isEdit}
                                <p class="text-base-content/50 text-sm">Der Einladungslink kann nach dem Veröffentlichen erstellt werden.</p>
                            {:else if inviteUrl === null}
                                <button type="button" class="btn btn-outline rounded-full" onclick={generateLink} disabled={inviteLoading}>
                                    {#if inviteLoading}<span class="loading loading-spinner loading-sm"></span>{:else}<Icon name="link" class="size-5" />{/if}
                                    Einladungslink erstellen
                                </button>
                            {:else}
                                <div class="flex min-w-0 items-center gap-2 sm:gap-3">
                                    <div class="border-base-200 flex min-w-0 flex-1 items-center gap-2 rounded-full border px-4 py-2">
                                        <Icon name="link" class="text-base-content/40 size-5 shrink-0" />
                                        <input
                                            type="text"
                                            readonly
                                            value={inviteUrl}
                                            aria-label="Einladungslink"
                                            class="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
                                            onclick={(e) => e.currentTarget.select()}
                                        />
                                        <button type="button" class="text-base-content/50 hover:text-base-content shrink-0" aria-label="Link kopieren" onclick={copyLink}>
                                            <Icon name={linkCopied ? "check" : "copy"} class="size-5" />
                                        </button>
                                    </div>
                                    <button type="button" class="btn btn-circle btn-ghost border-base-200 shrink-0" aria-label="Link erneuern" title="Link erneuern" onclick={generateLink} disabled={inviteLoading}>
                                        <Icon name="refresh" class="size-5" />
                                    </button>
                                    <span class="text-base-content/60 flex shrink-0 items-center gap-1.5 font-mono text-sm tabular-nums {remaining === 0 ? 'text-error' : ''}">
                                        {remainingLabel} <Icon name="clock" class="size-5" />
                                    </span>
                                </div>
                                {#if remaining === 0}
                                    <p class="text-error mt-2 text-sm">Der Link ist abgelaufen. Erneuere ihn, um wieder Zugriff zu gewähren.</p>
                                {/if}
                            {/if}
                        </div>
                    {/if}
                </div>

                {#if isEdit}
                    <div class="border-base-200 mt-6 border-t pt-6">
                        <button type="button" class="text-primary hover:text-primary/80 flex items-center gap-2 font-semibold" onclick={() => (deleteOpen = true)}>
                            <Icon name="trash" class="size-5" /> Challenge löschen
                        </button>
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Publish -->
        <button type="button" class="btn btn-primary mt-8 h-14 w-full rounded-full text-lg" onclick={publish} disabled={saving}>
            {#if saving}<span class="loading loading-spinner"></span>{:else}Veröffentlichen{/if}
        </button>
    {/if}
</div>

<Modal open={deleteOpen} title="Challenge löschen" onClose={() => (deleteOpen = false)}>
    <p class="text-base-content/80">Möchtest du diese Challenge wirklich dauerhaft löschen? Das kann nicht rückgängig gemacht werden.</p>
    <div class="mt-6 flex justify-end gap-3">
        <button type="button" class="btn btn-ghost rounded-full" onclick={() => (deleteOpen = false)}>Abbrechen</button>
        <button type="button" class="btn btn-error rounded-full" onclick={confirmDelete} disabled={deleting}>
            {#if deleting}<span class="loading loading-spinner loading-sm"></span>{/if} Löschen
        </button>
    </div>
</Modal>

<CustomQuestionModal open={customOpen} onClose={() => (customOpen = false)} onAdd={addCustomQuestion} />
