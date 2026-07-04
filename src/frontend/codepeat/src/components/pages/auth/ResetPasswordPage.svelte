<!--
@component
Password reset page opened from the link in the reset email (`#/reset-password/{key}`).
The user picks a new password; on success they sign in with it (allauth does not
auto-authenticate after a reset).
-->
<script lang="ts">
    import {resetPassword} from "../../../services/auth/auth.service.js";
    import {passwordError} from "../../../services/auth/auth.validation.js";
    import AuthField from "../../basic/AuthField.svelte";
    import Icon from "../../basic/Icon.svelte";
    import PasswordRequirements from "../../basic/PasswordRequirements.svelte";
    import AuthLayout from "./AuthLayout.svelte";

    let {params}: {params?: Record<string, string>} = $props();

    let password = $state("");
    let confirm = $state("");
    let submitting = $state(false);
    let error = $state<string | null>(null);
    let done = $state(false);

    async function handleSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const key = params?.key ?? "";
        if (key === "") {
            error = "Der Link ist unvollständig oder ungültig.";
            return;
        }
        error = passwordError(password);
        if (error !== null) {
            return;
        }
        if (password !== confirm) {
            error = "Die Passwörter stimmen nicht überein.";
            return;
        }
        submitting = true;
        try {
            await resetPassword(key, password);
            done = true;
        } catch (cause) {
            error = cause instanceof Error ? cause.message : "Das Passwort konnte nicht zurückgesetzt werden.";
        } finally {
            submitting = false;
        }
    }
</script>

<AuthLayout>
    {#if done}
        <div class="flex w-full max-w-[560px] flex-col items-center gap-4 text-center">
            <div class="bg-success/10 text-success flex size-20 items-center justify-center rounded-full">
                <Icon name="check" class="size-10" />
            </div>
            <h1 class="text-3xl font-bold sm:text-4xl">Passwort geändert</h1>
            <p class="text-base-content/60 text-lg">
                Dein neues Passwort ist aktiv. Melde dich damit an.
            </p>
            <a href="#/login" class="btn btn-primary mt-2 rounded-full">Zur Anmeldung</a>
        </div>
    {:else}
        <div class="flex flex-col items-center gap-2 text-center">
            <h1 class="text-3xl font-bold sm:text-4xl">Neues <span class="text-primary">Passwort</span></h1>
            <p class="text-base-content/60 text-lg">Wähle ein neues Passwort für dein Konto.</p>
        </div>

        <form
            class="bg-base-100 flex w-full max-w-[560px] flex-col gap-5 rounded-3xl p-6 shadow-lg sm:p-8"
            novalidate
            onsubmit={handleSubmit}
        >
            <AuthField icon="lock" type="password" placeholder="Neues Passwort" autocomplete="new-password" required bind:value={password} />
            <AuthField icon="lock" type="password" placeholder="Passwort bestätigen" autocomplete="new-password" required bind:value={confirm} />
            <PasswordRequirements {password} />

            {#if error}
                <p class="text-error text-sm font-semibold" role="alert">{error}</p>
            {/if}

            <button type="submit" class="btn btn-primary w-full rounded-full" disabled={submitting}>
                {#if submitting}
                    <span class="loading loading-spinner loading-sm"></span>
                {:else}
                    <Icon name="check" />
                {/if}
                Passwort speichern
            </button>

            <a href="#/forgot-password" class="link link-primary text-center text-sm font-semibold">
                Neuen Link anfordern
            </a>
        </form>
    {/if}
</AuthLayout>
