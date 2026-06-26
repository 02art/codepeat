<!--
@component
Source-code upload dialog (zip via drag & drop or file picker). Upload progress
is simulated; the submission is not wired to a backend yet.
-->
<script lang="ts">
    import Icon from "../../basic/Icon.svelte";
    import Modal from "../../basic/Modal.svelte";

    let {open, onClose, onSubmit}: {open: boolean; onClose: () => void; onSubmit: () => void} = $props();

    let fileInput = $state<HTMLInputElement | null>(null);
    let file = $state<File | null>(null);
    let progress = $state(0);
    let dragOver = $state(false);

    let uploadHandle: ReturnType<typeof setInterval> | undefined;

    const sizeLabel = $derived(file ? `${(file.size / (1024 * 1024)).toFixed(0)}MB` : "");
    const remainingLabel = $derived(progress >= 100 ? "Fertig" : `${Math.ceil((100 - progress) / 20)} Sekunden übrig`);

    $effect(() => {
        if (!open) {
            reset();
        }
    });

    $effect(() => () => clearInterval(uploadHandle));

    function reset(): void {
        clearInterval(uploadHandle);
        file = null;
        progress = 0;
        dragOver = false;
        if (fileInput !== null) {
            fileInput.value = "";
        }
    }

    function selectFile(selected: File): void {
        file = selected;
        progress = 0;
        clearInterval(uploadHandle);
        uploadHandle = setInterval(() => {
            progress = Math.min(100, progress + 5);
            if (progress >= 100) {
                clearInterval(uploadHandle);
            }
        }, 200);
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
        <div class="bg-base-200/60 mt-4 rounded-xl p-3">
            <div class="flex items-center justify-between gap-3">
                <span class="truncate font-semibold">{file.name}</span>
                <button type="button" class="text-base-content/40 hover:text-base-content transition-colors" aria-label="Datei entfernen" onclick={reset}>
                    <Icon name="close" class="size-4" />
                </button>
            </div>
            <div
                class="bg-base-300 mt-2 h-1.5 overflow-hidden rounded-full"
                role="progressbar"
                aria-label="Upload-Fortschritt"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div class="bg-primary h-full rounded-full transition-all" style="width: {progress}%"></div>
            </div>
            <div class="text-base-content/50 mt-1.5 flex items-center justify-between text-xs">
                <span>{sizeLabel} • {remainingLabel}</span>
                <span>{progress}%</span>
            </div>
        </div>
    {/if}

    <div class="divider text-base-content/40 text-xs">Hinweis zum Upload</div>

    <p class="text-base-content/70 text-center text-sm">
        Deine <span class="text-primary font-semibold">main.java</span> muss im Hauptverzeichnis liegen
        für die automatische Auswertung.
    </p>

    <div class="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
        <button type="button" class="btn btn-outline rounded-full px-8" onclick={onClose}>Abbrechen</button>
        <button type="button" class="btn btn-primary rounded-full px-8" disabled={file === null} onclick={onSubmit}>
            Einreichen
        </button>
    </div>

    <a href="#/datenschutz" class="text-base-content/40 hover:text-base-content mt-4 flex items-center justify-center gap-1.5 text-sm transition-colors">
        <Icon name="lock" class="size-4" /> Datenschutz
    </a>
</Modal>
