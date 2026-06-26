import {wrap}                   from "svelte-spa-router/wrap";

import HomePage                 from "./pages/home/HomePage.svelte";
import ChallengesOverviewPage   from "./pages/challenges/ChallengesOverviewPage.svelte";
import ChallengeDetailPage      from "./pages/challenges/ChallengeDetailPage.svelte";
import ReflectionPage           from "./pages/challenges/ReflectionPage.svelte";
import LoginPage                from "./pages/auth/LoginPage.svelte";
import RegisterPage             from "./pages/auth/RegisterPage.svelte";
import RegisterSuccessPage      from "./pages/auth/RegisterSuccessPage.svelte";
import ProfileSettingsPage      from "./pages/settings/ProfileSettingsPage.svelte";
import PlaceholderPage          from "./pages/placeholder/PlaceholderPage.svelte";
import NotFoundPage             from "./pages/errors/NotFoundPage.svelte";

export default {
    "/": wrap({
        component: HomePage,
    }),

    "/challenges": wrap({
        component: ChallengesOverviewPage,
    }),

    "/login": wrap({
        component: LoginPage,
    }),

    "/register": wrap({
        component: RegisterPage,
    }),

    "/register/success": wrap({
        component: RegisterSuccessPage,
    }),

    // Placeholder routes — wired up in the UI but not built yet.
    "/courses": wrap({
        component: PlaceholderPage,
        props: {title: "Kurse"},
    }),

    "/impressum": wrap({
        component: PlaceholderPage,
        props: {title: "Impressum"},
    }),

    "/datenschutz": wrap({
        component: PlaceholderPage,
        props: {title: "Datenschutz"},
    }),

    "/settings": wrap({
        component: ProfileSettingsPage,
    }),

    "/challenges/:id/edit": wrap({
        component: PlaceholderPage,
        props: {title: "Challenge bearbeiten"},
    }),

    "/challenges/:id/reflection": wrap({
        component: ReflectionPage,
    }),

    "/challenges/:id": wrap({
        component: ChallengeDetailPage,
    }),

    "*": NotFoundPage,
};
