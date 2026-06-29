<!--
@component
Account registration page: collects the sign-up details, validates them, and
routes to the confirmation page once the verification email has been queued.
-->
<script lang="ts">
    import {push} from "svelte-spa-router";

    import {emailError, passwordError, PASSWORD_MIN_LENGTH} from "../../../services/auth/auth.validation.js";
    import {loginWithProvider} from "../../../services/auth/auth.service.js";
    import {register} from "../../../services/user/user.store.js";
    import AuthField from "../../basic/AuthField.svelte";
    import GithubLogo from "../../basic/GithubLogo.svelte";
    import Icon from "../../basic/Icon.svelte";
    import AuthLayout from "./AuthLayout.svelte";

    let email = $state("");
    let username = $state("");
    let password = $state("");
    let confirmPassword = $state("");
    let submitting = $state(false);
    let error = $state<string | null>(null);

    async function handleSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        error = emailError(email) ?? passwordError(password);
        if (error !== null) {
            return;
        }

        if (password !== confirmPassword) {
            error = "Die Passwörter stimmen nicht überein.";
            return;
        }

        submitting = true;
        try {
            await register({email, username, password});
            await push(`/register/success?email=${encodeURIComponent(email)}`);
        } catch (cause) {
            error = cause instanceof Error ? cause.message : "Registrierung fehlgeschlagen.";
        } finally {
            submitting = false;
        }
    }

</script>

<AuthLayout>
    <div class="flex flex-col items-center gap-2 text-center">
        <h1 class="text-3xl font-bold sm:text-4xl">
            Willkommen bei <span class="text-primary">CodePeat</span>
        </h1>
        <p class="text-base-content/60 text-lg">
            Hier kannst du dich für deine AI-Challenge-Reise registrieren!
        </p>
    </div>

    <form
        class="bg-base-100 flex w-full max-w-[560px] flex-col gap-5 rounded-3xl p-6 shadow-lg sm:p-8"
        novalidate
        onsubmit={handleSubmit}
    >
        <AuthField icon="mail" type="email" placeholder="Email" autocomplete="email" required bind:value={email} />
        <AuthField icon="user" placeholder="Nutzername" autocomplete="username" required bind:value={username} />
        <AuthField icon="lock" type="password" placeholder="Passwort" autocomplete="new-password" required bind:value={password} />
        <AuthField icon="lock" type="password" placeholder="Passwort wiederholen" autocomplete="new-password" required bind:value={confirmPassword} />

        <p class="text-base-content/50 -mt-2 px-2 text-xs">
            Mindestens {PASSWORD_MIN_LENGTH} Zeichen, mit Buchstaben und Zahlen.
        </p>

        {#if error}
            <p class="text-error text-sm font-semibold" role="alert">{error}</p>
        {/if}

        <div class="mt-1 flex flex-col gap-3 sm:flex-row">
            <button type="submit" class="btn btn-primary w-full rounded-full sm:w-auto sm:flex-1" disabled={submitting}>
                {#if submitting}
                    <span class="loading loading-spinner loading-sm"></span>
                {:else}
                    <Icon name="user-plus" />
                {/if}
                Registrieren
            </button>
            <button
                type="button"
                class="btn btn-outline w-full rounded-full sm:w-auto sm:flex-1"
                disabled={submitting}
                onclick={() => loginWithProvider("github")}
            >
                <GithubLogo class="size-5" />
                Mit GitHub registrieren
            </button>
        </div>

        <p class="text-base-content/50 text-center text-sm">
            Durch das Registrieren stimme ich den
            <a href="#/datenschutz" class="link font-semibold">Datenschutzbedingungen</a> zu.
        </p>
    </form>
</AuthLayout>
