<!--
@component
Account login page. Supports password login, third-party (GitHub) login, and a
passwordless one-time code sent by email (allauth login-by-code).
-->
<script lang="ts">
    import {push} from "svelte-spa-router";

    import {emailError} from "../../../services/auth/auth.validation.js";
    import {loginWithProvider} from "../../../services/auth/auth.service.js";
    import {login, loginWithCode, requestLoginCode} from "../../../services/user/user.store.js";
    import AuthField from "../../basic/AuthField.svelte";
    import GithubLogo from "../../basic/GithubLogo.svelte";
    import Icon from "../../basic/Icon.svelte";
    import AuthLayout from "./AuthLayout.svelte";

    type Mode = "password" | "code-request" | "code-confirm";

    let mode = $state<Mode>("password");
    let email = $state("");
    let password = $state("");
    let code = $state("");
    let submitting = $state(false);
    let error = $state<string | null>(null);

    async function handlePasswordLogin(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        error = emailError(email);
        if (error !== null) {
            return;
        }
        if (password === "") {
            error = "Bitte gib dein Passwort ein.";
            return;
        }
        await run(async () => {
            await login({email, password});
            await push("/challenges");
        });
    }

    async function handleRequestCode(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        error = emailError(email);
        if (error !== null) {
            return;
        }
        await run(async () => {
            await requestLoginCode(email);
            code = "";
            mode = "code-confirm";
        });
    }

    async function handleConfirmCode(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        if (code.trim() === "") {
            error = "Bitte gib den Code aus der E-Mail ein.";
            return;
        }
        await run(async () => {
            await loginWithCode(code.trim());
            await push("/challenges");
        });
    }

    /** Run an async action with shared submitting/error handling. */
    async function run(action: () => Promise<void>): Promise<void> {
        error = null;
        submitting = true;
        try {
            await action();
        } catch (cause) {
            error = cause instanceof Error ? cause.message : "Anmeldung fehlgeschlagen.";
        } finally {
            submitting = false;
        }
    }

    function switchMode(next: Mode): void {
        mode = next;
        error = null;
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

    {#if mode === "password"}
        <form
            class="bg-base-100 flex w-full max-w-[560px] flex-col gap-5 rounded-3xl p-6 shadow-lg sm:p-8"
            novalidate
            onsubmit={handlePasswordLogin}
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
                    onclick={() => loginWithProvider("github")}
                >
                    <GithubLogo class="size-5" />
                    Mit GitHub anmelden
                </button>
            </div>

            <button
                type="button"
                class="link link-primary text-center text-sm font-semibold"
                onclick={() => switchMode("code-request")}
            >
                Stattdessen per E-Mail-Code anmelden
            </button>

            <p class="text-base-content/50 text-center text-sm">
                Noch kein Konto?
                <a href="#/register" class="link link-primary font-semibold">Jetzt registrieren</a>
            </p>
        </form>
    {:else if mode === "code-request"}
        <form
            class="bg-base-100 flex w-full max-w-[560px] flex-col gap-5 rounded-3xl p-6 shadow-lg sm:p-8"
            novalidate
            onsubmit={handleRequestCode}
        >
            <p class="text-base-content/70 text-sm">
                Wir senden dir einen einmaligen Anmelde-Code an deine E-Mail-Adresse.
            </p>
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
                Code senden
            </button>

            <button
                type="button"
                class="link link-primary text-center text-sm font-semibold"
                onclick={() => switchMode("password")}
            >
                Zurück zum Passwort-Login
            </button>
        </form>
    {:else}
        <form
            class="bg-base-100 flex w-full max-w-[560px] flex-col gap-5 rounded-3xl p-6 shadow-lg sm:p-8"
            novalidate
            onsubmit={handleConfirmCode}
        >
            <p class="text-base-content/70 text-sm">
                Wir haben einen Code an <span class="text-primary font-semibold">{email}</span> gesendet.
                Gib ihn hier ein.
            </p>
            <AuthField icon="lock" type="text" placeholder="Anmelde-Code" autocomplete="one-time-code" required bind:value={code} />

            {#if error}
                <p class="text-error text-sm font-semibold" role="alert">{error}</p>
            {/if}

            <button type="submit" class="btn btn-primary w-full rounded-full" disabled={submitting}>
                {#if submitting}
                    <span class="loading loading-spinner loading-sm"></span>
                {:else}
                    <Icon name="login" />
                {/if}
                Anmelden
            </button>

            <div class="flex flex-col gap-2 text-center text-sm">
                <button
                    type="button"
                    class="link link-primary font-semibold"
                    disabled={submitting}
                    onclick={() => switchMode("code-request")}
                >
                    Andere E-Mail / Code erneut anfordern
                </button>
                <button
                    type="button"
                    class="link link-primary font-semibold"
                    onclick={() => switchMode("password")}
                >
                    Zurück zum Passwort-Login
                </button>
            </div>
        </form>
    {/if}
</AuthLayout>
