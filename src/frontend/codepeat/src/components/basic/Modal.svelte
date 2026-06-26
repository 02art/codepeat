<!--
@component
Accessible modal dialog: a native <dialog> opened with showModal(), so the
focus trap, Escape-to-close and background inertness come from the platform.
Renders a titled header with a close button; the body is the default content.
-->
<script lang="ts" module>
    let nextId = 0;
</script>

<script lang="ts">
    import type {Snippet} from "svelte";

    import Icon from "./Icon.svelte";

    interface Props {
        open: boolean;
        title: string;
        onClose: () => void;
        boxClass?: string;
        children: Snippet;
    }

    let {open, title, onClose, boxClass = "max-w-md", children}: Props = $props();

    const titleId = `modal-title-${nextId++}`;
    let dialog = $state<HTMLDialogElement>();

    $effect(() => {
        if (!dialog) return;
        if (open && !dialog.open) {
            dialog.showModal();
        } else if (!open && dialog.open) {
            dialog.close();
        }
    });

    function close(): void {
        dialog?.close();
    }
</script>

<dialog
    bind:this={dialog}
    class="modal"
    aria-modal="true"
    aria-labelledby={titleId}
    onclose={() => {
        if (open) onClose();
    }}
>
    <div class="modal-box {boxClass}">
        <div class="flex items-start justify-between gap-4">
            <h3 id={titleId} class="text-xl font-bold">{title}</h3>
            <button
                type="button"
                class="text-base-content/40 hover:text-base-content transition-colors"
                aria-label="Schließen"
                onclick={close}
            >
                <Icon name="close" />
            </button>
        </div>
        {@render children()}
    </div>
    <button type="button" class="modal-backdrop" aria-label="Schließen" onclick={close}></button>
</dialog>
