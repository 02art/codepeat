<!--
@component
Pill-shaped form field used across the auth and account pages: a leading icon,
the input itself, and a reveal toggle for password fields.
-->
<script lang="ts">
    import Icon, {type IconName} from "./Icon.svelte";

    interface Props {
        icon: IconName;
        placeholder: string;
        value: string;
        type?: "text" | "email" | "password";
        autocomplete?: string;
        required?: boolean;
    }

    let {
        icon,
        placeholder,
        value = $bindable(""),
        type = "text",
        autocomplete,
        required = false,
    }: Props = $props();

    let revealed = $state(false);

    const isPassword = $derived(type === "password");
    const inputType = $derived(isPassword && revealed ? "text" : type);
</script>

<label class="bg-base-100 focus-within:ring-primary/40 flex items-center gap-3 rounded-full px-5 py-3 shadow-sm transition-shadow focus-within:ring-2">
    <Icon name={icon} class="text-base-content/40 size-5 shrink-0" />
    <input
        type={inputType}
        value={value}
        oninput={(event) => (value = event.currentTarget.value)}
        {placeholder}
        aria-label={placeholder}
        {autocomplete}
        {required}
        class="text-base-content placeholder:text-base-content/40 w-full bg-transparent text-base font-semibold outline-none"
    />
    {#if isPassword}
        <button
            type="button"
            class="text-base-content/40 hover:text-base-content shrink-0 transition-colors"
            aria-label={revealed ? "Passwort verbergen" : "Passwort anzeigen"}
            onclick={() => (revealed = !revealed)}
        >
            <Icon name={revealed ? "eye-off" : "eye"} />
        </button>
    {/if}
</label>
