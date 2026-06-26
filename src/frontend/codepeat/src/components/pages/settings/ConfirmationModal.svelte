<!--
@component
Notice shown after a sensitive account action: confirms that a verification email
was sent. `action` names the change being confirmed (e.g. "Passwortänderung").
-->
<script lang="ts">
    import Modal from "../../basic/Modal.svelte";

    interface Props {
        open: boolean;
        action: string;
        onClose: () => void;
    }

    let {open, action, onClose}: Props = $props();
</script>

<Modal {open} title="Bestätige die Änderung" {onClose}>
    <p class="text-base-content/70 mt-3">
        Wir haben dir eine Email geschickt um deine
        <span class="text-primary font-semibold">{action}</span> zu bestätigen.
    </p>
    <div class="mt-6 flex justify-center">
        <button type="button" class="btn btn-primary rounded-full px-8" onclick={onClose}>Verstanden</button>
    </div>
</Modal>
