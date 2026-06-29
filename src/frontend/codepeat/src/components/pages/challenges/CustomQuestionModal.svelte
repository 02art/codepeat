<!--
@component
Popup for authoring a custom reflection question: enter the question text, pick the
answer type (free text / scale / choice) and fill in the type-specific extras.
-->
<script lang="ts">
    import type {QuestionKind} from "../../../services/reflections/reflection.types.js";
    import Icon from "../../basic/Icon.svelte";
    import Modal from "../../basic/Modal.svelte";

    let {open, onClose, onAdd}: {
        open: boolean;
        onClose: () => void;
        onAdd: (q: {text: string; kind: QuestionKind; options: string[]}) => void;
    } = $props();

    const kinds: {value: QuestionKind; label: string; icon: "edit" | "sort" | "list"}[] = [
        {value: "text", label: "Freitext", icon: "edit"},
        {value: "scale", label: "Skala", icon: "sort"},
        {value: "choice", label: "Auswahl", icon: "list"},
    ];

    let text = $state("");
    let kind = $state<QuestionKind>("text");
    let options = $state<string[]>(["", ""]);
    let scaleMin = $state("gar nicht");
    let scaleMax = $state("sehr stark");
    let error = $state<string | null>(null);

    function reset(): void {
        text = "";
        kind = "text";
        options = ["", ""];
        scaleMin = "gar nicht";
        scaleMax = "sehr stark";
        error = null;
    }

    function close(): void {
        reset();
        onClose();
    }

    function add(): void {
        if (text.trim() === "") {
            error = "Bitte gib eine Frage ein.";
            return;
        }
        let opts: string[] = [];
        if (kind === "choice") {
            opts = options.map((o) => o.trim()).filter((o) => o.length > 0);
            if (opts.length < 2) {
                error = "Bitte gib mindestens zwei Antwortoptionen an.";
                return;
            }
        } else if (kind === "scale") {
            opts = [scaleMin.trim() || "gar nicht", scaleMax.trim() || "sehr stark"];
        }
        onAdd({text: text.trim(), kind, options: opts});
        reset();
    }
</script>

<Modal {open} title="Eigene Reflexionsfrage" onClose={close} boxClass="max-w-lg">
    <div class="space-y-5">
        <div>
            <label class="text-sm font-bold" for="cq-text">Frage</label>
            <textarea
                id="cq-text"
                class="border-base-200 focus:border-primary mt-2 w-full resize-y rounded-xl border px-4 py-3 outline-none"
                rows="2"
                placeholder="Formuliere deine Reflexionsfrage…"
                bind:value={text}
            ></textarea>
        </div>

        <div>
            <p class="text-sm font-bold">Antworttyp</p>
            <div class="mt-2 grid grid-cols-3 gap-3">
                {#each kinds as k (k.value)}
                    <button
                        type="button"
                        aria-pressed={kind === k.value}
                        class="flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-sm font-bold transition-all {kind === k.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-base-200 text-base-content/50 hover:border-base-300'}"
                        onclick={() => (kind = k.value)}
                    >
                        <Icon name={k.icon} class="size-5" />
                        {k.label}
                    </button>
                {/each}
            </div>
        </div>

        {#if kind === "choice"}
            <div>
                <p class="text-sm font-bold">Antwortoptionen</p>
                <div class="mt-2 space-y-2">
                    {#each options as _, i (i)}
                        <div class="flex items-center gap-2">
                            <input
                                type="text"
                                class="border-base-200 focus:border-primary flex-1 rounded-xl border px-3 py-2 text-sm outline-none"
                                placeholder={`Option ${i + 1}`}
                                bind:value={options[i]}
                            />
                            {#if options.length > 2}
                                <button type="button" class="text-base-content/40 hover:text-error shrink-0" aria-label="Option entfernen" onclick={() => (options = options.filter((_, j) => j !== i))}>
                                    <Icon name="close" class="size-5" />
                                </button>
                            {/if}
                        </div>
                    {/each}
                </div>
                <button type="button" class="text-primary mt-2 flex items-center gap-1.5 text-sm font-semibold" onclick={() => (options = [...options, ""])}>
                    <Icon name="plus" class="size-4" /> Option hinzufügen
                </button>
            </div>
        {:else if kind === "scale"}
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="text-sm font-bold" for="cq-min">Beschriftung links</label>
                    <input id="cq-min" type="text" class="border-base-200 focus:border-primary mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none" bind:value={scaleMin} />
                </div>
                <div>
                    <label class="text-sm font-bold" for="cq-max">Beschriftung rechts</label>
                    <input id="cq-max" type="text" class="border-base-200 focus:border-primary mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none" bind:value={scaleMax} />
                </div>
            </div>
        {/if}

        {#if error}
            <p class="text-error text-sm font-medium">{error}</p>
        {/if}

        <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="btn btn-ghost rounded-full" onclick={close}>Abbrechen</button>
            <button type="button" class="btn btn-primary rounded-full" onclick={add}>Hinzufügen</button>
        </div>
    </div>
</Modal>
