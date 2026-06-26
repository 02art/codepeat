<!--
@component
Empty placeholder shown for routes that are wired up but not built yet.
The route passes a `title` prop describing the future page.
-->
<script lang="ts">
    let {title = "Bald verfügbar"}: {title?: string} = $props();
</script>

<div class="mx-auto w-full max-w-[1600px] px-6 py-24 text-center">
    <h1 class="text-2xl font-bold">{title}</h1>
    <p class="text-base-content/50 mt-2">Diese Seite gibt es noch nicht.</p>
</div>
