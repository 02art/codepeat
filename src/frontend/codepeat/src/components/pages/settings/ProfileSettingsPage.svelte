<!--
@component
Profile settings: avatar, account details, password change and account deletion.
Sensitive actions are confirmed by email and stay pending until confirmed.
-->
<script lang="ts">
    import {cancelAccountDeletion, changePassword, fetchDeletionStatus, requestAccountDeletion} from "../../../services/auth/auth.service.js";
    import {passwordError} from "../../../services/auth/auth.validation.js";
    import {currentUser, setAvatar} from "../../../services/user/user.store.js";
    import AuthField from "../../basic/AuthField.svelte";
    import Icon from "../../basic/Icon.svelte";
    import PasswordRequirements from "../../basic/PasswordRequirements.svelte";
    import AvatarPickerModal from "./AvatarPickerModal.svelte";
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

    let deletionPending = $state(false);
    let deletionBusy = $state(false);
    let deleteConfirmOpen = $state(false);
    let modalAction = $state<string | null>(null);

    let avatarPickerOpen = $state(false);

    // Persist the banner across reloads: the pending state lives on the server.
    $effect(() => {
        void fetchDeletionStatus().then((pending) => (deletionPending = pending));
    });

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
        deletionBusy = true;
        try {
            await requestAccountDeletion();
            deletionPending = true;
            modalAction = "Account-Löschung";
        } finally {
            deletionBusy = false;
        }
    }

    async function resendDeletionEmail(): Promise<void> {
        deletionBusy = true;
        try {
            await requestAccountDeletion();
            modalAction = "Account-Löschung";
        } finally {
            deletionBusy = false;
        }
    }

    async function cancelDeletion(): Promise<void> {
        deletionBusy = true;
        try {
            await cancelAccountDeletion();
            deletionPending = false;
        } finally {
            deletionBusy = false;
        }
    }

    async function onAvatarChosen(avatar: string): Promise<void> {
        try {
            await setAvatar(avatar);
        } catch {
            // Keep the previous picture if saving failed.
        }
    }
</script>

<div class="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6">
    {#if deletionPending}
        <div role="alert" class="bg-error/10 text-error mx-auto mb-8 flex max-w-4xl flex-col items-center justify-center gap-3 rounded-2xl px-6 py-4 text-center font-semibold sm:flex-row">
            <span class="flex items-center gap-3">
                <Icon name="no-symbol" class="size-5 shrink-0" />
                Account-Löschung ist beantragt. Bestätige sie über den Link in der E-Mail.
            </span>
            <button
                type="button"
                class="btn btn-sm btn-outline btn-error shrink-0 rounded-full"
                disabled={deletionBusy}
                onclick={resendDeletionEmail}
            >
                E-Mail erneut senden
            </button>
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
                        onclick={() => (avatarPickerOpen = true)}
                    >
                        <Icon name="edit" class="size-4" />
                    </button>
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

                {#if deletionPending}
                    <button
                        type="button"
                        class="text-base-content/70 hover:text-base-content disabled:text-base-content/40 flex w-fit items-center gap-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed"
                        disabled={deletionBusy}
                        onclick={cancelDeletion}
                    >
                        <Icon name="close" class="size-5" /> Löschung abbrechen
                    </button>
                {:else}
                    <button
                        type="button"
                        class="text-primary hover:text-primary/80 disabled:text-base-content/40 flex w-fit items-center gap-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed"
                        disabled={deletionBusy}
                        onclick={() => (deleteConfirmOpen = true)}
                    >
                        <Icon name="trash" class="size-5" /> Account Löschen
                    </button>
                {/if}
            </div>
        </section>

        <section class="bg-base-100 rounded-3xl p-6 shadow-sm sm:p-8">
            <h2 class="text-xl font-bold">Passwort ändern</h2>

            <form class="mt-6 flex flex-col gap-4" novalidate onsubmit={handleChangePassword}>
                <AuthField icon="lock" type="password" placeholder="* Altes Passwort" autocomplete="current-password" required bind:value={oldPassword} />
                <AuthField icon="lock" type="password" placeholder="* Neues Passwort" autocomplete="new-password" required bind:value={newPassword} />
                <AuthField icon="lock" type="password" placeholder="* Neues Passwort wiederholen" autocomplete="new-password" required bind:value={newPasswordRepeat} />
                <PasswordRequirements password={newPassword} />

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

<AvatarPickerModal
    open={avatarPickerOpen}
    current={avatarUrl}
    onSelect={onAvatarChosen}
    onClose={() => (avatarPickerOpen = false)}
/>
