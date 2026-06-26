<!--
@component
Global site footer with copyright, legal links and a GitHub link.
-->
<script lang="ts">
    import GithubLogo from "./GithubLogo.svelte";

    const year = new Date().getFullYear();
</script>

<footer class="px-4 py-6 sm:px-6">
    <div class="text-base-content/50 mx-auto flex max-w-[1600px] flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold">
        <span>© {year} CodePeat. All rights reserved.</span>
        <a href="#/impressum" class="underline transition-colors hover:text-base-content">Impressum</a>
        <a href="#/datenschutz" class="underline transition-colors hover:text-base-content">Datenschutz</a>
        <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            class="transition-colors hover:text-base-content"
        >
            <GithubLogo label="GitHub" />
        </a>
    </div>
</footer>
