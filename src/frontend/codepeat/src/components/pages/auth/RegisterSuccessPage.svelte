<!--
@component
Confirmation shown after registration: tells the user a verification email is on
its way and that the account is activated once they follow the link in it.
-->
<script lang="ts">
    import Icon from "../../basic/Icon.svelte";
    import AuthLayout from "./AuthLayout.svelte";

    const email = readEmailFromHash();

    function readEmailFromHash(): string {
        const hash = window.location.hash;
        const query = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : "";
        return new URLSearchParams(query).get("email") ?? "";
    }
</script>

<AuthLayout>
    <div class="flex w-full max-w-[560px] flex-col items-center gap-4 text-center">
        <div class="bg-primary/10 text-primary flex size-20 items-center justify-center rounded-full">
            <Icon name="mail" class="size-10" />
        </div>
        <h1 class="text-3xl font-bold sm:text-4xl">Fast geschafft!</h1>
        <p class="text-base-content/60 text-lg">
            Wir haben dir eine E-Mail{#if email}
                an <span class="text-base-content font-semibold">{email}</span>{/if} geschickt.
            Bitte bestätige deine Adresse über den Link in der E-Mail, um dein Konto zu aktivieren.
        </p>
        <a href="#/challenges" class="btn btn-primary mt-2 rounded-full">Zu den Challenges</a>
    </div>
</AuthLayout>
