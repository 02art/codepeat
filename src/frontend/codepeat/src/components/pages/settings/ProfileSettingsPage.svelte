<!--
@component
Profile settings: avatar, account details, password change and account deletion.
Sensitive actions are confirmed by email and stay pending until confirmed.
-->
<script lang="ts">
    import {changePassword, isAccountDeletionRequested, requestAccountDeletion} from "../../../services/auth/auth.service.js";
    import {passwordError, PASSWORD_MIN_LENGTH} from "../../../services/auth/auth.validation.js";
    import {currentUser, setAvatar} from "../../../services/user/user.store.js";
    import AuthField from "../../basic/AuthField.svelte";
    import Icon from "../../basic/Icon.svelte";
    import ConfirmDialog from "./ConfirmDialog.svelte";
    import ConfirmationModal from "./ConfirmationModal.svelte";

    const email = $derived($currentUser?.email ?? "");
    const handle = $derived($currentUser?.handle ?? "");
    const avatarUrl = $derived($currentUser?.avatarUrl ?? null);

    let oldPassword = $state("");
    let newPassword = $state("");
    let newPasswordRepeat = $state("");
    let passwordFormError = $state<string | null>(null);
    let submitting = $state(false);

    let deletionPending = $state(isAccountDeletionRequested());
    let deleteConfirmOpen = $state(false);
    let modalAction = $state<string | null>(null);

    let fileInput = $state<HTMLInputElement | null>(null);

    async function handleChangePassword(event: SubmitEvent): Promise<void> {
        event.preventDefault();

        if (oldPassword === "") {
            passwordFormError = "Bitte gib dein altes Passwort ein.";
            return;
        }
        passwordFormError = passwordError(newPassword);
        if (passwordFormError !== null) {
            return;
        }
        if (newPassword !== newPasswordRepeat) {
            passwordFormError = "Die neuen Passwörter stimmen nicht überein.";
            return;
        }

        submitting = true;
        try {
            await changePassword({currentPassword: oldPassword, newPassword});
            oldPassword = "";
            newPassword = "";
            newPasswordRepeat = "";
            modalAction = "Passwortänderung";
        } catch (cause) {
            passwordFormError = cause instanceof Error ? cause.message : "Änderung fehlgeschlagen.";
        } finally {
            submitting = false;
        }
    }

    async function confirmDeleteAccount(): Promise<void> {
        deleteConfirmOpen = false;
        await requestAccountDeletion();
        deletionPending = true;
        modalAction = "Account-Löschung";
    }

    function onAvatarSelected(event: Event): void {
        const file = (event.currentTarget as HTMLInputElement).files?.[0];
        if (file !== undefined) {
            setAvatar(URL.createObjectURL(file));
        }
    }
</script>

<div class="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6">
    {#if deletionPending}
        <div role="alert" class="bg-error/10 text-error mx-auto mb-8 flex max-w-4xl items-center justify-center gap-3 rounded-2xl px-6 py-4 text-center font-semibold">
            <Icon name="no-symbol" class="size-5 shrink-0" />
            Account Löschung ist Beantragt. Bestätige die Löschung per Email um zu Finalisieren!
        </div>
    {/if}

    <div class="flex flex-col items-center gap-2 text-center">
        <h1 class="text-3xl font-bold sm:text-4xl">Profil <span class="text-primary">bearbeiten</span></h1>
        <p class="text-base-content/60 text-lg">Hier kannst du dein Profil steuern!</p>
    </div>

    <div class="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2 md:items-start">
        <section class="bg-base-100 rounded-3xl p-6 shadow-sm sm:p-8">
            <h2 class="text-xl font-bold">Profilinformationen</h2>

            <div class="mt-6 flex flex-col gap-6">
                <div class="relative w-fit">
                    {#if avatarUrl}
                        <img src={avatarUrl} alt="Profilbild" class="size-28 rounded-full object-cover" />
                    {:else}
                        <div class="bg-base-300 text-base-content flex size-28 items-center justify-center rounded-full">
                            <Icon name="user" filled class="size-16" />
                        </div>
                    {/if}
                    <button
                        type="button"
                        class="bg-base-100 ring-base-300 text-base-content/70 hover:text-base-content absolute right-0 bottom-1 flex size-9 items-center justify-center rounded-full shadow ring-1 transition-colors"
                        aria-label="Profilbild ändern"
                        onclick={() => fileInput?.click()}
                    >
                        <Icon name="edit" class="size-4" />
                    </button>
                    <input bind:this={fileInput} type="file" accept="image/*" class="hidden" onchange={onAvatarSelected} />
                </div>

                <dl class="flex flex-col gap-4">
                    <div>
                        <dt class="text-base-content/50 flex items-center gap-2 text-sm font-semibold">
                            <Icon name="mail" class="size-4" /> Email
                        </dt>
                        <dd class="mt-1 font-semibold">{email}</dd>
                    </div>
                    <div>
                        <dt class="text-base-content/50 flex items-center gap-2 text-sm font-semibold">
                            <Icon name="user" class="size-4" /> Nutzername
                        </dt>
                        <dd class="mt-1 font-semibold">{handle}</dd>
                    </div>
                </dl>

                <button
                    type="button"
                    class="text-primary hover:text-primary/80 disabled:text-base-content/40 flex w-fit items-center gap-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed"
                    disabled={deletionPending}
                    onclick={() => (deleteConfirmOpen = true)}
                >
                    <Icon name="trash" class="size-5" /> Account Löschen
                </button>
            </div>
        </section>

        <section class="bg-base-100 rounded-3xl p-6 shadow-sm sm:p-8">
            <h2 class="text-xl font-bold">Passwort ändern</h2>

            <form class="mt-6 flex flex-col gap-4" novalidate onsubmit={handleChangePassword}>
                <AuthField icon="lock" type="password" placeholder="* Altes Passwort" autocomplete="current-password" required bind:value={oldPassword} />
                <AuthField icon="lock" type="password" placeholder="* Neues Passwort" autocomplete="new-password" required bind:value={newPassword} />
                <AuthField icon="lock" type="password" placeholder="* Neues Passwort wiederholen" autocomplete="new-password" required bind:value={newPasswordRepeat} />
                <p class="text-base-content/50 px-2 text-xs">Mindestens {PASSWORD_MIN_LENGTH} Zeichen, mit Buchstaben und Zahlen.</p>

                {#if passwordFormError}
                    <p class="text-error text-sm font-semibold" role="alert">{passwordFormError}</p>
                {/if}

                <div class="flex justify-end">
                    <button type="submit" class="btn btn-primary w-full rounded-full px-8 sm:w-auto" disabled={submitting}>
                        {#if submitting}
                            <span class="loading loading-spinner loading-sm"></span>
                        {/if}
                        Ändern
                    </button>
                </div>
            </form>
        </section>
    </div>
</div>

<ConfirmDialog
    open={deleteConfirmOpen}
    title="Account wirklich löschen?"
    message="Möchtest du deinen Account wirklich löschen? Du musst die Löschung anschließend per Email bestätigen."
    confirmLabel="Account löschen"
    destructive
    onConfirm={confirmDeleteAccount}
    onCancel={() => (deleteConfirmOpen = false)}
/>

<ConfirmationModal open={modalAction !== null} action={modalAction ?? ""} onClose={() => (modalAction = null)} />
