<!--
@component
Redeems a private-challenge invitation link: grants the signed-in user permanent
access, then forwards to the challenge. Reached via /challenges/:id/unlock/:token.
-->
<script lang="ts">
    import {push} from "svelte-spa-router";

    import {unlockChallenge} from "../../../services/challenges/challenges.service.js";
    import Icon from "../../basic/Icon.svelte";

    let {params}: {params?: Record<string, string>} = $props();

    let error = $state<string | null>(null);

    $effect(() => {
        const token = params?.token;
        const fallbackId = params?.id;
        if (token === undefined) {
            error = "Der Einladungslink ist ungültig.";
            return;
        }
        let cancelled = false;
        unlockChallenge(token)
            .then((challengeId) => {
                if (!cancelled) {
                    void push(`/challenges/${challengeId || fallbackId}`);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    error = "Der Einladungslink ist ungültig oder abgelaufen.";
                }
            });
        return () => {
            cancelled = true;
        };
    });
</script>

<div class="mx-auto w-full max-w-md px-4 py-24 text-center">
    {#if error}
        <div role="alert" class="bg-base-100 rounded-2xl px-8 py-12 shadow-sm">
            <Icon name="lock" class="text-base-content/40 mx-auto size-10" />
            <p class="text-error mt-4 font-medium">{error}</p>
            <a href="#/challenges" class="link link-primary mt-2 inline-block text-sm">Zur Challenge-Übersicht</a>
        </div>
    {:else}
        <span class="loading loading-spinner loading-lg text-primary" aria-hidden="true"></span>
        <p class="text-base-content/60 mt-4" role="status">Challenge wird freigeschaltet…</p>
    {/if}
</div>
