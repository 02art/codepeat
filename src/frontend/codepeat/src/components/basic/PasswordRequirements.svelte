<!--
@component
Live password requirements checklist, revealed once the user starts typing: each rule
turns green with a check when met and stays muted with a cross otherwise. Rules come from
the shared validation config (which mirrors the Django password validators).
-->
<script lang="ts">
    import {slide} from "svelte/transition";

    import {PASSWORD_RULES} from "../../services/auth/auth.validation.js";
    import Icon from "./Icon.svelte";

    let {password}: {password: string} = $props();

    const results = $derived(PASSWORD_RULES.map((rule) => ({label: rule.label, met: rule.met(password)})));
</script>

{#if password.length > 0}
    <ul class="-mt-1 flex flex-col gap-1.5 px-1 text-sm" aria-label="Passwort-Anforderungen" transition:slide={{duration: 150}}>
        {#each results as rule (rule.label)}
            <li class="flex items-center gap-2 transition-colors {rule.met ? 'text-success' : 'text-base-content/40'}">
                <Icon name={rule.met ? "check" : "close"} class="size-4 shrink-0" />
                <span class="font-medium">{rule.label}</span>
            </li>
        {/each}
    </ul>
{/if}
