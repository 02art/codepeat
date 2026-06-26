<!--
@component
Are-you-sure dialog for a sensitive action: a cancel button and a confirm button
that can be styled as destructive.
-->
<script lang="ts">
    import Modal from "../../basic/Modal.svelte";

    interface Props {
        open: boolean;
        title: string;
        message: string;
        confirmLabel: string;
        cancelLabel?: string;
        destructive?: boolean;
        onConfirm: () => void;
        onCancel: () => void;
    }

    let {
        open,
        title,
        message,
        confirmLabel,
        cancelLabel = "Abbrechen",
        destructive = false,
        onConfirm,
        onCancel,
    }: Props = $props();
</script>

<Modal {open} {title} onClose={onCancel}>
    <p class="text-base-content/70 mt-3">{message}</p>
    <div class="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <button type="button" class="btn btn-ghost rounded-full" onclick={onCancel}>{cancelLabel}</button>
        <button type="button" class="btn rounded-full {destructive ? 'btn-error' : 'btn-primary'}" onclick={onConfirm}>
            {confirmLabel}
        </button>
    </div>
</Modal>
