<!--
@component
Standalone layout for the authentication pages: centered brand logo, the page
content, and the shared site footer. Rendered without the application navbar.
-->
<script lang="ts">
    import type {Snippet} from "svelte";

    import SiteFooter from "../../basic/SiteFooter.svelte";

    let {children}: {children: Snippet} = $props();
</script>

<div class="flex min-h-full flex-1 flex-col">
    <main class="flex flex-1 flex-col items-center gap-12 px-4 py-10 sm:px-6 sm:py-16">
        <a href="#/" aria-label="CodePeat Startseite" class="shrink-0">
            <img src="codepeat-logo.png" alt="CodePeat" class="h-24 w-auto sm:h-28" />
        </a>
        {@render children()}
    </main>
    <SiteFooter />
</div>
