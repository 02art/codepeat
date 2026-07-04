<!--
@component
"Password forgotten" request page: the user enters their email and receives a
reset link. The confirmation is deliberately neutral to avoid leaking whether an
account exists (allauth answers the same either way).
-->
<script lang="ts">
    import {emailError} from "../../../services/auth/auth.validation.js";
    import {requestPasswordReset} from "../../../services/user/user.store.js";
    import AuthField from "../../basic/AuthField.svelte";
    import Icon from "../../basic/Icon.svelte";
    import AuthLayout from "./AuthLayout.svelte";

    let email = $state("");
    let submitting = $state(false);
    let error = $state<string | null>(null);
    let sent = $state(false);

    async function handleSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        error = emailError(email);
        if (error !== null) {
            return;
        }
        submitting = true;
        try {
            await requestPasswordReset(email.trim());
            sent = true;
        } catch (cause) {
            error = cause instanceof Error ? cause.message : "Die E-Mail konnte nicht gesendet werden.";
        } finally {
            submitting = false;
        }
    }
</script>

<AuthLayout>
    {#if sent}
        <div class="flex w-full max-w-[560px] flex-col items-center gap-4 text-center">
            <div class="bg-primary/10 text-primary flex size-20 items-center justify-center rounded-full">
                <Icon name="mail" class="size-10" />
            </div>
            <h1 class="text-3xl font-bold sm:text-4xl">Prüfe deine E-Mails</h1>
            <p class="text-base-content/60 text-lg">
                Falls ein Konto mit <span class="text-base-content font-semibold">{email}</span> existiert, haben wir dir
                einen Link zum Zurücksetzen deines Passworts geschickt.
            </p>
            <a href="#/login" class="btn btn-primary mt-2 rounded-full">Zurück zur Anmeldung</a>
        </div>
    {:else}
        <div class="flex flex-col items-center gap-2 text-center">
            <h1 class="text-3xl font-bold sm:text-4xl">Passwort <span class="text-primary">vergessen</span>?</h1>
            <p class="text-base-content/60 text-lg">
                Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.
            </p>
        </div>

        <form
            class="bg-base-100 flex w-full max-w-[560px] flex-col gap-5 rounded-3xl p-6 shadow-lg sm:p-8"
            novalidate
            onsubmit={handleSubmit}
        >
            <AuthField icon="mail" type="email" placeholder="Email" autocomplete="email" required bind:value={email} />

            {#if error}
                <p class="text-error text-sm font-semibold" role="alert">{error}</p>
            {/if}

            <button type="submit" class="btn btn-primary w-full rounded-full" disabled={submitting}>
                {#if submitting}
                    <span class="loading loading-spinner loading-sm"></span>
                {:else}
                    <Icon name="mail" />
                {/if}
                Link senden
            </button>

            <a href="#/login" class="link link-primary text-center text-sm font-semibold">Zurück zur Anmeldung</a>
        </form>
    {/if}
</AuthLayout>
