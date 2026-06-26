<!--
@component
Account login page: collects credentials and opens a session, then routes to the
challenges overview.
-->
<script lang="ts">
    import {push} from "svelte-spa-router";

    import {emailError} from "../../../services/auth/auth.validation.js";
    import {login} from "../../../services/user/user.store.js";
    import AuthField from "../../basic/AuthField.svelte";
    import GithubLogo from "../../basic/GithubLogo.svelte";
    import Icon from "../../basic/Icon.svelte";
    import AuthLayout from "./AuthLayout.svelte";

    let email = $state("");
    let password = $state("");
    let submitting = $state(false);
    let error = $state<string | null>(null);

    async function handleSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        error = emailError(email);
        if (error !== null) {
            return;
        }
        if (password === "") {
            error = "Bitte gib dein Passwort ein.";
            return;
        }
        await authenticate();
    }

    async function authenticate(): Promise<void> {
        error = null;
        submitting = true;
        try {
            await login();
            await push("/challenges");
        } catch {
            error = "Anmeldung fehlgeschlagen.";
        } finally {
            submitting = false;
        }
    }
</script>

<AuthLayout>
    <div class="flex flex-col items-center gap-2 text-center">
        <h1 class="text-3xl font-bold sm:text-4xl">
            Willkommen zurück bei <span class="text-primary">CodePeat</span>
        </h1>
        <p class="text-base-content/60 text-lg">
            Melde dich an, um deine AI-Challenge-Reise fortzusetzen!
        </p>
    </div>

    <form
        class="bg-base-100 flex w-full max-w-[560px] flex-col gap-5 rounded-3xl p-6 shadow-lg sm:p-8"
        novalidate
        onsubmit={handleSubmit}
    >
        <AuthField icon="mail" type="email" placeholder="Email" autocomplete="email" required bind:value={email} />
        <AuthField icon="lock" type="password" placeholder="Passwort" autocomplete="current-password" required bind:value={password} />

        {#if error}
            <p class="text-error text-sm font-semibold" role="alert">{error}</p>
        {/if}

        <div class="mt-1 flex flex-col gap-3 sm:flex-row">
            <button type="submit" class="btn btn-primary w-full rounded-full sm:w-auto sm:flex-1" disabled={submitting}>
                {#if submitting}
                    <span class="loading loading-spinner loading-sm"></span>
                {:else}
                    <Icon name="login" />
                {/if}
                Anmelden
            </button>
            <button
                type="button"
                class="btn btn-outline w-full rounded-full sm:w-auto sm:flex-1"
                disabled={submitting}
                onclick={authenticate}
            >
                <GithubLogo class="size-5" />
                Mit GitHub anmelden
            </button>
        </div>

        <p class="text-base-content/50 text-center text-sm">
            Noch kein Konto?
            <a href="#/register" class="link link-primary font-semibold">Jetzt registrieren</a>
        </p>
    </form>
</AuthLayout>
