<script lang="ts">
    import Dropdown from "./Dropdown.svelte";

    let {onItem = () => {}}: {onItem?: () => void} = $props();
</script>

<Dropdown label="Menü öffnen" triggerClass="btn">
    {#snippet trigger()}
        <span>Menü</span>
    {/snippet}
    <li><button type="button" onclick={onItem}>Eintrag</button></li>
</Dropdown>
