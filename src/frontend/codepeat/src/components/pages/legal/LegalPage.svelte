<!--
@component
Legal pages (privacy policy + imprint), loaded from the backend and rendered as HTML.
The footer links here: "Datenschutz" opens the top, "Impressum" passes section="impressum"
to scroll to the imprint. openbook admins get an edit button (top right) to change the content.
-->
<script lang="ts">
    import {fetchLegalContent, saveLegalContent} from "../../../services/legal/legal.service.js";
    import Icon from "../../basic/Icon.svelte";

    let {section}: {section?: string} = $props();

    let privacy = $state("");
    let imprint = $state("");
    let canEdit = $state(false);
    let loading = $state(true);
    let error = $state<string | null>(null);

    let editing = $state(false);
    let saving = $state(false);
    let draftPrivacy = $state("");
    let draftImprint = $state("");

    $effect(() => {
        let cancelled = false;
        fetchLegalContent()
            .then((content) => {
                if (cancelled) {
                    return;
                }
                privacy = content.privacy;
                imprint = content.imprint;
                canEdit = content.canEdit;
                scrollToSection();
            })
            .catch((cause: unknown) => {
                if (!cancelled) {
                    error = cause instanceof Error ? cause.message : "Die Seite konnte nicht geladen werden.";
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

    function scrollToSection(): void {
        if (!section) {
            return;
        }
        requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView({behavior: "smooth", block: "start"}));
    }

    function startEdit(): void {
        draftPrivacy = privacy;
        draftImprint = imprint;
        error = null;
        editing = true;
    }

    async function save(): Promise<void> {
        saving = true;
        error = null;
        try {
            if (draftPrivacy !== privacy) {
                await saveLegalContent("datenschutz", draftPrivacy);
                privacy = draftPrivacy;
            }
            if (draftImprint !== imprint) {
                await saveLegalContent("impressum", draftImprint);
                imprint = draftImprint;
            }
            editing = false;
        } catch (cause) {
            error = cause instanceof Error ? cause.message : "Speichern fehlgeschlagen.";
        } finally {
            saving = false;
        }
    }
</script>

<div class="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
    {#if canEdit && !loading}
        <div class="mb-4 flex justify-end">
            {#if editing}
                <div class="flex gap-3">
                    <button type="button" class="btn btn-outline rounded-full px-8" disabled={saving} onclick={() => (editing = false)}>Abbrechen</button>
                    <button type="button" class="btn btn-primary rounded-full px-8" disabled={saving} onclick={save}>
                        {#if saving}<span class="loading loading-spinner loading-sm"></span>{/if} Speichern
                    </button>
                </div>
            {:else}
                <button
                    type="button"
                    class="btn btn-circle btn-ghost border-base-200 bg-base-100 shadow-sm"
                    aria-label="Rechtstexte bearbeiten"
                    title="Bearbeiten"
                    onclick={startEdit}
                >
                    <Icon name="edit" />
                </button>
            {/if}
        </div>
    {/if}

    {#if loading}
        <div class="flex justify-center py-24" role="status" aria-label="Wird geladen">
            <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>
    {:else if error && !editing}
        <div role="alert" class="bg-base-100 rounded-2xl px-8 py-12 text-center shadow-sm">
            <p class="text-error font-medium">{error}</p>
        </div>
    {:else if editing}
        <div class="flex flex-col gap-6">
            <div>
                <h2 class="mb-2 font-bold">Datenschutzerklärung (HTML)</h2>
                <textarea bind:value={draftPrivacy} rows="18" class="border-base-300 focus:border-primary w-full resize-y rounded-2xl border p-4 font-mono text-sm outline-none"></textarea>
            </div>
            <div>
                <h2 class="mb-2 font-bold">Impressum (HTML)</h2>
                <textarea bind:value={draftImprint} rows="8" class="border-base-300 focus:border-primary w-full resize-y rounded-2xl border p-4 font-mono text-sm outline-none"></textarea>
            </div>
            {#if error}
                <p class="text-error text-sm font-semibold" role="alert">{error}</p>
            {/if}
        </div>
    {:else}
        <article class="legal-content text-base-content/80 flex flex-col gap-8 leading-relaxed">
            <div>{@html privacy}</div>
            <div id="impressum" class="border-base-300 scroll-mt-28 border-t pt-12">{@html imprint}</div>
        </article>
    {/if}
</div>

<style>
    .legal-content :global(h1) {
        color: var(--color-base-content);
        font-size: 1.875rem;
        font-weight: 700;
        text-align: center;
    }
    .legal-content :global(h2) {
        color: var(--color-base-content);
        font-size: 1.25rem;
        font-weight: 700;
        margin-top: 1.5rem;
    }
    .legal-content :global(p) {
        margin-top: 0.5rem;
    }
    .legal-content :global(ul) {
        margin-top: 0.5rem;
        list-style: disc;
        padding-left: 1.5rem;
    }
    .legal-content :global(li) {
        margin-top: 0.25rem;
    }
    .legal-content :global(address) {
        margin-top: 0.5rem;
        font-style: normal;
    }
    .legal-content :global(a) {
        color: var(--color-primary);
        text-decoration: underline;
    }
</style>
