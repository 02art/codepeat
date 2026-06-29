<!--
@component
Password-change confirmation page. Opened from the link in the confirmation email
(`#/change-password/{token}`); submits the token so the staged new password takes effect.
-->
<script lang="ts">
    import {confirmPasswordChange} from "../../../services/auth/auth.service.js";
    import Icon from "../../basic/Icon.svelte";
    import AuthLayout from "./AuthLayout.svelte";

    let {params}: {params?: Record<string, string>} = $props();

    type Status = "confirming" | "success" | "error";

    let status = $state<Status>("confirming");
    let errorMessage = $state("");

    $effect(() => {
        const token = params?.token;
        if (token === undefined || token === "") {
            status = "error";
            errorMessage = "Der Bestätigungslink ist unvollständig.";
            return;
        }

        let cancelled = false;
        confirmPasswordChange(token)
            .then(() => {
                if (!cancelled) {
                    status = "success";
                }
            })
            .catch((cause: unknown) => {
                if (!cancelled) {
                    status = "error";
                    errorMessage = cause instanceof Error ? cause.message : "Die Änderung ist fehlgeschlagen.";
                }
            });

        return () => {
            cancelled = true;
        };
    });
</script>

<AuthLayout>
    <div class="flex w-full max-w-[560px] flex-col items-center gap-4 text-center">
        {#if status === "confirming"}
            <span class="loading loading-spinner loading-lg text-primary" aria-hidden="true"></span>
            <h1 class="text-3xl font-bold sm:text-4xl">Passwort wird geändert …</h1>
            <p class="text-base-content/60 text-lg" role="status">Einen Moment bitte.</p>
        {:else if status === "success"}
            <div class="bg-success/10 text-success flex size-20 items-center justify-center rounded-full">
                <Icon name="check" class="size-10" />
            </div>
            <h1 class="text-3xl font-bold sm:text-4xl">Passwort geändert</h1>
            <p class="text-base-content/60 text-lg">
                Dein neues Passwort ist jetzt aktiv. Melde dich damit an.
            </p>
            <a href="#/login" class="btn btn-primary mt-2 rounded-full">Zur Anmeldung</a>
        {:else}
            <div class="bg-error/10 text-error flex size-20 items-center justify-center rounded-full">
                <Icon name="no-symbol" class="size-10" />
            </div>
            <h1 class="text-3xl font-bold sm:text-4xl">Änderung fehlgeschlagen</h1>
            <p class="text-base-content/60 text-lg" role="alert">{errorMessage}</p>
            <a href="#/settings" class="link link-primary mt-2 text-sm">Zurück zum Profil</a>
        {/if}
    </div>
</AuthLayout>
