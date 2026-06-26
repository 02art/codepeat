<!--
@component
Global layout: navbar, routed content and footer. Chrome is hidden on the auth
pages, which bring their own standalone layout.
-->
<script lang="ts">
    import Router, {push} from "svelte-spa-router";

    import {currentUser, logout} from "../../services/user/user.store.js";
    import Dropdown from "../basic/Dropdown.svelte";
    import Icon from "../basic/Icon.svelte";
    import SiteFooter from "../basic/SiteFooter.svelte";
    import routes from "../routes.js";

    const isAuthenticated = $derived($currentUser !== null);
    const handle = $derived($currentUser?.handle ?? "");
    const streak = $derived($currentUser?.streak ?? 0);
    const avatarUrl = $derived($currentUser?.avatarUrl ?? null);

    let path = $state(currentPath());

    $effect(() => {
        const onHashChange = (): void => {
            path = currentPath();
        };
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    });

    const bareLayout = $derived(path.startsWith("/register") || path.startsWith("/login"));
    const coursesActive = $derived(path.startsWith("/courses"));
    const challengesActive = $derived(path.startsWith("/challenges"));

    function currentPath(): string {
        const hash = window.location.hash.replace(/^#/, "");
        return hash.split("?")[0] || "/";
    }

    async function handleLogout(): Promise<void> {
        await logout();
        await push("/login");
    }
</script>

<div class="bg-base-200 flex min-h-screen flex-col">
    {#if !bareLayout}
        <header class="px-4 pt-4 sm:px-6 sm:pt-6">
            <div class="bg-base-100 mx-auto flex h-[77px] max-w-[1600px] items-center justify-between gap-3 rounded-2xl px-4 shadow-sm sm:px-8">
                <a href="#/" aria-label="CodePeat Startseite" class="flex shrink-0 items-center gap-2">
                    <img src="/codepeat-logo.png" alt="" class="h-10 w-auto sm:h-11" />
                    <span class="hidden text-lg leading-tight font-extrabold tracking-tight sm:block">
                        <span class="block">Code</span>
                        <span class="block">Peat</span>
                    </span>
                </a>

                <nav class="hidden items-center gap-3 md:flex">
                    <a
                        href="#/courses"
                        aria-current={coursesActive ? "page" : undefined}
                        class="flex items-center gap-2.5 rounded-full border py-1.5 pr-5 pl-1.5 shadow-sm transition-colors {coursesActive
                            ? 'border-primary bg-primary/5'
                            : 'border-transparent bg-base-100 hover:border-base-300'}"
                    >
                        <span class="flex size-9 items-center justify-center rounded-full transition-colors {coursesActive ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content'}">
                            <Icon name="clipboard-check" />
                        </span>
                        <span class="text-sm font-bold {coursesActive ? 'text-primary' : ''}">Kurse</span>
                    </a>
                    <a
                        href="#/challenges"
                        aria-current={challengesActive ? "page" : undefined}
                        class="flex items-center gap-2.5 rounded-full border py-1.5 pr-5 pl-1.5 shadow-sm transition-colors {challengesActive
                            ? 'border-primary bg-primary/5'
                            : 'border-transparent bg-base-100 hover:border-base-300'}"
                    >
                        <span class="flex size-9 items-center justify-center rounded-full transition-colors {challengesActive ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content'}">
                            <Icon name="bug" />
                        </span>
                        <span class="text-sm font-bold {challengesActive ? 'text-primary' : ''}">Challenges</span>
                    </a>
                </nav>

                <div class="flex shrink-0 items-center gap-3 md:gap-5">
                    {#if isAuthenticated}
                        <div class="flex items-center gap-1.5" role="img" aria-label="{streak} Tage Streak" title="{streak} Tage Streak">
                            <span class="text-lg font-bold {streak === 0 ? 'text-base-content/40' : ''}">{streak}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="size-6 {streak === 0 ? 'text-base-content/30' : 'text-warning'}">
                                <path fill-rule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" clip-rule="evenodd" />
                            </svg>
                        </div>

                        <span class="hidden text-sm font-bold whitespace-nowrap lg:inline">
                            Hallo <span class="text-primary">{handle}</span>
                        </span>
                    {/if}

                    {#if isAuthenticated}
                        <div class="hidden md:block">
                            <Dropdown
                                label="Benutzermenü öffnen"
                                triggerClass="avatar focus-visible:ring-primary/50 cursor-pointer rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-2 {avatarUrl ? '' : 'avatar-placeholder'}"
                                menuClass="menu bg-base-100 rounded-box mt-3 right-0 w-56 gap-1 p-2 shadow-md"
                            >
                                {#snippet trigger()}
                                    {#if avatarUrl}
                                        <div class="w-12 rounded-full">
                                            <img src={avatarUrl} alt="Profilbild" />
                                        </div>
                                    {:else}
                                        <div class="bg-neutral text-neutral-content w-12 rounded-full">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="size-8">
                                                <path fill-rule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clip-rule="evenodd" />
                                            </svg>
                                        </div>
                                    {/if}
                                {/snippet}
                                <li><a href="#/settings"><Icon name="settings" /> Profileinstellungen</a></li>
                                <li><button onclick={handleLogout}><Icon name="logout" /> Abmelden</button></li>
                            </Dropdown>
                        </div>
                    {:else}
                        <div class="hidden items-center gap-3 md:flex">
                            <a href="#/login" class="btn btn-outline rounded-full px-6">Anmelden</a>
                            <a href="#/register" class="btn btn-primary rounded-full px-6">Registrieren</a>
                        </div>
                    {/if}

                    <div class="md:hidden">
                        <Dropdown
                            label="Menü öffnen"
                            triggerClass="btn btn-circle btn-ghost"
                            menuClass="menu bg-base-100 rounded-box mt-3 right-0 w-60 gap-1 p-2 shadow-md"
                        >
                            {#snippet trigger()}
                                <Icon name="chevron-down" />
                            {/snippet}
                            {#if isAuthenticated}
                                <li class="menu-title text-xs">Hallo {handle}</li>
                            {/if}
                            <li>
                                <a href="#/courses" aria-current={coursesActive ? "page" : undefined} class:menu-active={coursesActive}>
                                    <Icon name="clipboard-check" /> Kurse
                                </a>
                            </li>
                            <li>
                                <a href="#/challenges" aria-current={challengesActive ? "page" : undefined} class:menu-active={challengesActive}>
                                    <Icon name="bug" /> Challenges
                                </a>
                            </li>
                            <li><div class="divider my-0"></div></li>
                            {#if isAuthenticated}
                                <li><a href="#/settings">Profileinstellungen</a></li>
                                <li><button onclick={handleLogout}>Abmelden</button></li>
                            {:else}
                                <li><a href="#/login">Einloggen</a></li>
                                <li><a href="#/register">Registrieren</a></li>
                            {/if}
                        </Dropdown>
                    </div>
                </div>
            </div>
        </header>
    {/if}

    <main class="flex flex-1 flex-col">
        <Router {routes} />
    </main>

    {#if !bareLayout}
        <SiteFooter />
    {/if}
</div>
