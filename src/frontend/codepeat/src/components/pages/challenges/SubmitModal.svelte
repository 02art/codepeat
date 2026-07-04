<!--
@component
Source-code upload dialog (zip via drag & drop or file picker). The chosen file is handed to
the caller on submit, which performs the real upload; a spinner shows while it is in flight.
-->
<script lang="ts">
    import Icon from "../../basic/Icon.svelte";
    import Modal from "../../basic/Modal.svelte";

    let {open, onClose, onSubmit}: {open: boolean; onClose: () => void; onSubmit: (file: File) => Promise<void> | void} = $props();

    let fileInput = $state<HTMLInputElement | null>(null);
    let file = $state<File | null>(null);
    let dragOver = $state(false);
    let submitting = $state(false);
    let error = $state<string | null>(null);

    const sizeLabel = $derived(file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : "");

    $effect(() => {
        if (!open) {
            reset();
        }
    });

    function reset(): void {
        file = null;
        dragOver = false;
        submitting = false;
        error = null;
        if (fileInput !== null) {
            fileInput.value = "";
        }
    }

    function selectFile(selected: File): void {
        file = selected;
    }

    function onPick(event: Event): void {
        const selected = (event.currentTarget as HTMLInputElement).files?.[0];
        if (selected !== undefined) {
            selectFile(selected);
        }
    }

    function onDrop(event: DragEvent): void {
        event.preventDefault();
        dragOver = false;
        const dropped = event.dataTransfer?.files?.[0];
        if (dropped !== undefined) {
            selectFile(dropped);
        }
    }

    function onDragOver(event: DragEvent): void {
        event.preventDefault();
        dragOver = true;
    }

    async function submit(): Promise<void> {
        if (file === null) {
            return;
        }
        submitting = true;
        error = null;
        try {
            await onSubmit(file);
        } catch (cause) {
            error = cause instanceof Error ? cause.message : "Der Upload ist fehlgeschlagen.";
        } finally {
            submitting = false;
        }
    }
</script>

<Modal {open} title="Lade deinen Quellcode hoch" {onClose} boxClass="max-w-lg">
    <button
        type="button"
        class="mt-5 flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-8 text-center transition-colors {dragOver
            ? 'border-primary bg-primary/5'
            : 'border-base-300 bg-base-200/40 hover:border-base-content/30'}"
        onclick={() => fileInput?.click()}
        ondragover={onDragOver}
        ondragleave={() => (dragOver = false)}
        ondrop={onDrop}
    >
        <Icon name="upload" class="text-base-content/50 size-8" />
        <p class="font-semibold">
            Drag &amp; Drop oder <span class="text-primary">Wähle eine Datei</span> zum Hochladen
        </p>
        <p class="text-base-content/40 text-xs">zip</p>
    </button>
    <input bind:this={fileInput} type="file" accept=".zip,application/zip" class="hidden" onchange={onPick} />

    {#if file}
        <div class="bg-base-200/60 mt-4 flex items-center justify-between gap-3 rounded-xl p-3">
            <span class="min-w-0">
                <span class="block truncate font-semibold">{file.name}</span>
                <span class="text-base-content/50 text-xs">{sizeLabel}</span>
            </span>
            <button type="button" class="text-base-content/40 hover:text-base-content shrink-0 transition-colors" aria-label="Datei entfernen" disabled={submitting} onclick={reset}>
                <Icon name="close" class="size-4" />
            </button>
        </div>
    {/if}

    <div class="divider text-base-content/40 text-xs">Hinweis zum Upload</div>

    <p class="text-base-content/70 text-center text-sm">
        Deine <span class="text-primary font-semibold">main.java</span> muss im Hauptverzeichnis liegen
        für die automatische Auswertung.
    </p>

    {#if error}
        <p class="text-error mt-4 text-center text-sm font-semibold" role="alert">{error}</p>
    {/if}

    <div class="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
        <button type="button" class="btn btn-outline rounded-full px-8" disabled={submitting} onclick={onClose}>Abbrechen</button>
        <button type="button" class="btn btn-primary rounded-full px-8" disabled={file === null || submitting} onclick={submit}>
            {#if submitting}<span class="loading loading-spinner loading-sm"></span>{/if}
            Einreichen
        </button>
    </div>

    <a href="#/datenschutz" class="text-base-content/40 hover:text-base-content mt-4 flex items-center justify-center gap-1.5 text-sm transition-colors">
        <Icon name="lock" class="size-4" /> Datenschutz
    </a>
</Modal>
