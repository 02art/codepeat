<!--
@component
Global layout: navbar, routed content and footer. Chrome is hidden on the auth
pages, which bring their own standalone layout.
-->
<script lang="ts">
    import Router, {push} from "svelte-spa-router";

    import {currentUser, logout, sessionReady} from "../../services/user/user.store.js";
    import Dropdown from "../basic/Dropdown.svelte";
    import Icon from "../basic/Icon.svelte";
    import LevelBadge from "../basic/LevelBadge.svelte";
    import SiteFooter from "../basic/SiteFooter.svelte";
    import routes from "../routes.js";

    const isAuthenticated = $derived($currentUser !== null);
    const handle = $derived($currentUser?.handle ?? "");
    const avatarUrl = $derived($currentUser?.avatarUrl ?? null);

    const progress = $derived($currentUser?.progress ?? {level: 1, xp: 0, xpIntoLevel: 0, xpForNextLevel: 100});
    const xpPercent = $derived(progress.xpForNextLevel > 0 ? Math.min(100, Math.round((progress.xpIntoLevel / progress.xpForNextLevel) * 100)) : 100);

    let path = $state(currentPath());

    $effect(() => {
        const onHashChange = (): void => {
            path = currentPath();
        };
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    });

    // Standalone auth/token pages bring their own layout (AuthLayout), so the app chrome
    // (navbar + footer) is hidden for them — otherwise the footer would appear twice.
    const BARE_LAYOUT_PREFIXES = [
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/delete-account",
        "/change-password",
    ];
    const bareLayout = $derived(BARE_LAYOUT_PREFIXES.some((prefix) => path.startsWith(prefix)));
    // The reflection questionnaire is a focused flow: hide the navbar (but keep the footer).
    const isReflection = $derived(path.endsWith("/reflection"));
    const coursesActive = $derived(path.startsWith("/courses"));
    const challengesActive = $derived(path.startsWith("/challenges"));
    const activitiesActive = $derived(path.startsWith("/activities"));

    // The route to redirect to for the current path + auth state, or null when allowed here.
    const redirect = $derived($sessionReady ? guardRedirect(path, $currentUser !== null) : null);

    // Enforce the guard: bounce to the appropriate page whenever the route isn't allowed.
    $effect(() => {
        if (redirect !== null) {
            void push(redirect);
        }
    });

    function currentPath(): string {
        const hash = window.location.hash.replace(/^#/, "");
        return hash.split("?")[0] || "/";
    }

    /** Pages reachable only while signed out (signed-in users are sent to the challenges). */
    function isGuestOnly(p: string): boolean {
        return p === "/login" || p === "/register" || p.startsWith("/register/");
    }

    /** Pages reachable by anyone (landing, legal, and the emailed token flows). */
    function isPublic(p: string): boolean {
        return (
            p === "/" ||
            p === "/impressum" ||
            p === "/datenschutz" ||
            p.startsWith("/verify-email") ||
            p.startsWith("/delete-account") ||
            p.startsWith("/change-password") ||
            p.startsWith("/forgot-password") ||
            p.startsWith("/reset-password")
        );
    }

    /** Where to redirect for a path given the auth state, or null if it may be shown. */
    function guardRedirect(p: string, authed: boolean): string | null {
        if (isGuestOnly(p)) {
            return authed ? "/challenges" : null;
        }
        if (isPublic(p)) {
            return null;
        }
        return authed ? null : "/login"; // everything else requires authentication
    }

    async function handleLogout(): Promise<void> {
        await logout();
        await push("/login");
    }
</script>

{#snippet xpProgress()}
    <div class="w-full px-1 py-1">
        <div class="text-base-content/70 mb-1.5 flex items-center justify-between text-xs font-semibold">
            <span class="text-primary">Level {progress.level}</span>
            <span>{progress.xpIntoLevel}/{progress.xpForNextLevel} XP</span>
        </div>
        <div class="bg-base-300 h-2 overflow-hidden rounded-full">
            <div class="bg-primary h-full rounded-full transition-all duration-500" style="width: {xpPercent}%"></div>
        </div>
    </div>
{/snippet}

<div class="bg-base-200 flex min-h-screen flex-col">
    {#if !bareLayout && !isReflection}
        <header class="px-4 pt-4 sm:px-6 sm:pt-6">
            <div class="bg-base-100 mx-auto flex h-[77px] max-w-[1600px] items-center justify-between gap-3 rounded-2xl px-4 shadow-sm sm:px-8">
                <a href="#/" aria-label="CodePeat Startseite" class="flex shrink-0 items-center gap-2">
                    <img src="codepeat-logo.png" alt="" class="h-10 w-auto sm:h-11" />
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
                    {#if isAuthenticated}
                        <a
                            href="#/activities"
                            aria-current={activitiesActive ? "page" : undefined}
                            class="flex items-center gap-2.5 rounded-full border py-1.5 pr-5 pl-1.5 shadow-sm transition-colors {activitiesActive
                                ? 'border-primary bg-primary/5'
                                : 'border-transparent bg-base-100 hover:border-base-300'}"
                        >
                            <span class="flex size-9 items-center justify-center rounded-full transition-colors {activitiesActive ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content'}">
                                <Icon name="inbox" />
                            </span>
                            <span class="text-sm font-bold {activitiesActive ? 'text-primary' : ''}">Aktivitäten</span>
                        </a>
                    {/if}
                </nav>

                <div class="flex shrink-0 items-center gap-3 md:gap-5">
                    {#if isAuthenticated}
                        <span title="Level {progress.level}">
                            <LevelBadge level={progress.level} class="size-9" />
                        </span>

                        <span class="hidden text-sm font-bold whitespace-nowrap lg:inline">
                            Hallo <span class="text-primary">{handle}</span>
                        </span>
                    {/if}

                    {#if isAuthenticated}
                        <div class="hidden md:block">
                            <Dropdown
                                label="Profilmenü öffnen"
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
                                <li class="menu-title">{@render xpProgress()}</li>
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
                                <li class="menu-title">{@render xpProgress()}</li>
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
                            {#if isAuthenticated}
                                <li>
                                    <a href="#/activities" aria-current={activitiesActive ? "page" : undefined} class:menu-active={activitiesActive}>
                                        <Icon name="inbox" /> Aktivitäten
                                    </a>
                                </li>
                            {/if}
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
        {#if !$sessionReady || redirect !== null}
            <div class="flex flex-1 items-center justify-center py-24" role="status" aria-label="Wird geladen">
                <span class="loading loading-spinner loading-lg text-primary"></span>
            </div>
        {:else}
            <Router {routes} />
        {/if}
    </main>

    {#if !bareLayout}
        <SiteFooter />
    {/if}
</div>
