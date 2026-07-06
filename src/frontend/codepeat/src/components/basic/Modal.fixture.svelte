<script lang="ts">
    import Modal from "./Modal.svelte";

    let {open = true, onClose = () => {}}: {open?: boolean; onClose?: () => void} = $props();
</script>

<Modal {open} title="Titel" {onClose}>
    <p>Modal-Inhalt</p>
</Modal>
