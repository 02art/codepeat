<!--
@component
Email verification landing page. Opened from the link in the verification email
(`#/verify-email/{key}`); submits the key to allauth and reports the result.
-->
<script lang="ts">
    import {onMount} from "svelte";

    import {verifyEmail} from "../../../services/auth/auth.service.js";
    import {refreshSession} from "../../../services/user/user.store.js";
    import Icon from "../../basic/Icon.svelte";
    import AuthLayout from "./AuthLayout.svelte";

    let {params}: {params?: Record<string, string>} = $props();

    type Status = "verifying" | "success" | "error";

    let status = $state<Status>("verifying");
    let errorMessage = $state("");

    // The confirmation key is single-use, so consume it exactly once on mount (never re-run
    // on re-render, which would try to redeem the already-used key and fail).
    onMount(() => {
        const key = params?.key;
        if (key === undefined || key === "") {
            status = "error";
            errorMessage = "Der Bestätigungslink ist unvollständig.";
            return;
        }

        let cancelled = false;
        verifyEmail(key)
            .then(() => refreshSession())
            .then(() => {
                if (!cancelled) {
                    status = "success";
                }
            })
            .catch((cause: unknown) => {
                if (!cancelled) {
                    status = "error";
                    errorMessage = cause instanceof Error ? cause.message : "Die Bestätigung ist fehlgeschlagen.";
                }
            });

        return () => {
            cancelled = true;
        };
    });
</script>

<AuthLayout>
    <div class="flex w-full max-w-[560px] flex-col items-center gap-4 text-center">
        {#if status === "verifying"}
            <span class="loading loading-spinner loading-lg text-primary" aria-hidden="true"></span>
            <h1 class="text-3xl font-bold sm:text-4xl">E-Mail wird bestätigt …</h1>
            <p class="text-base-content/60 text-lg" role="status">Einen Moment bitte.</p>
        {:else if status === "success"}
            <div class="bg-success/10 text-success flex size-20 items-center justify-center rounded-full">
                <Icon name="check" class="size-10" />
            </div>
            <h1 class="text-3xl font-bold sm:text-4xl">E-Mail bestätigt!</h1>
            <p class="text-base-content/60 text-lg">
                Dein Konto ist jetzt aktiviert. Du kannst dich anmelden und loslegen.
            </p>
            <a href="#/login" class="btn btn-primary mt-2 rounded-full">Zum Login</a>
        {:else}
            <div class="bg-error/10 text-error flex size-20 items-center justify-center rounded-full">
                <Icon name="no-symbol" class="size-10" />
            </div>
            <h1 class="text-3xl font-bold sm:text-4xl">Bestätigung fehlgeschlagen</h1>
            <p class="text-base-content/60 text-lg" role="alert">{errorMessage}</p>
            <a href="#/register" class="link link-primary mt-2 text-sm">Zurück zur Registrierung</a>
        {/if}
    </div>
</AuthLayout>
