<!--
@component
Labelled code snippet with a language header and a copy-to-clipboard button that
briefly confirms the copy.
-->
<script lang="ts">
    import Icon from "../../basic/Icon.svelte";

    let {label, language, code}: {label: string; language: string; code: string} = $props();

    let copied = $state(false);
    let resetHandle: ReturnType<typeof setTimeout> | undefined;

    $effect(() => () => clearTimeout(resetHandle));

    async function copy(): Promise<void> {
        if (navigator.clipboard === undefined) {
            return;
        }
        await navigator.clipboard.writeText(code);
        copied = true;
        clearTimeout(resetHandle);
        resetHandle = setTimeout(() => (copied = false), 2000);
    }
</script>

<div>
    <h3 class="text-sm font-bold">{label}</h3>
    <div class="border-base-200 mt-2 overflow-hidden rounded-xl border">
        <div class="bg-base-200 flex items-center justify-between px-4 py-2">
            <span class="text-primary text-sm font-semibold">{language}</span>
            <button
                type="button"
                class="flex items-center gap-1.5 text-sm font-medium transition-colors {copied ? 'text-primary' : 'text-base-content/50 hover:text-base-content'}"
                onclick={copy}
            >
                <Icon name={copied ? "check" : "copy"} class="size-4" />
                {copied ? "Kopiert" : "Code Kopieren"}
            </button>
        </div>
        <pre class="bg-base-100 overflow-x-auto px-4 py-4"><code class="text-base-content font-mono text-sm">{code}</code></pre>
    </div>
</div>
