import {wrap}                   from "svelte-spa-router/wrap";

import HomePage                 from "./pages/home/HomePage.svelte";
import ChallengesOverviewPage   from "./pages/challenges/ChallengesOverviewPage.svelte";
import ChallengeDetailPage      from "./pages/challenges/ChallengeDetailPage.svelte";
import ChallengeEditorPage      from "./pages/challenges/ChallengeEditorPage.svelte";
import ChallengeUnlockPage      from "./pages/challenges/ChallengeUnlockPage.svelte";
import ReflectionPage           from "./pages/challenges/ReflectionPage.svelte";
import ActivitiesPage           from "./pages/activities/ActivitiesPage.svelte";
import SubmissionDetailPage     from "./pages/activities/SubmissionDetailPage.svelte";
import LoginPage                from "./pages/auth/LoginPage.svelte";
import RegisterPage             from "./pages/auth/RegisterPage.svelte";
import RegisterSuccessPage      from "./pages/auth/RegisterSuccessPage.svelte";
import VerifyEmailPage          from "./pages/auth/VerifyEmailPage.svelte";
import DeleteAccountPage        from "./pages/auth/DeleteAccountPage.svelte";
import ChangePasswordPage       from "./pages/auth/ChangePasswordPage.svelte";
import ForgotPasswordPage       from "./pages/auth/ForgotPasswordPage.svelte";
import ResetPasswordPage        from "./pages/auth/ResetPasswordPage.svelte";
import ProfileSettingsPage      from "./pages/settings/ProfileSettingsPage.svelte";
import LegalPage                from "./pages/legal/LegalPage.svelte";
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

    "/verify-email/:key": wrap({
        component: VerifyEmailPage,
    }),

    "/delete-account/:token": wrap({
        component: DeleteAccountPage,
    }),

    "/change-password/:token": wrap({
        component: ChangePasswordPage,
    }),

    "/forgot-password": wrap({
        component: ForgotPasswordPage,
    }),

    "/reset-password/:key": wrap({
        component: ResetPasswordPage,
    }),

    // Placeholder routes — wired up in the UI but not built yet.
    "/courses": wrap({
        component: PlaceholderPage,
        props: {title: "Kurse"},
    }),

    "/datenschutz": wrap({
        component: LegalPage,
    }),

    "/impressum": wrap({
        component: LegalPage,
        props: {section: "impressum"},
    }),

    "/settings": wrap({
        component: ProfileSettingsPage,
    }),

    "/activities": wrap({
        component: ActivitiesPage,
    }),

    "/activities/:id": wrap({
        component: SubmissionDetailPage,
    }),

    "/challenges/new": wrap({
        component: ChallengeEditorPage,
    }),

    "/challenges/:id/edit": wrap({
        component: ChallengeEditorPage,
    }),

    "/challenges/:id/unlock/:token": wrap({
        component: ChallengeUnlockPage,
    }),

    "/challenges/:id/reflection": wrap({
        component: ReflectionPage,
    }),

    "/challenges/:id": wrap({
        component: ChallengeDetailPage,
    }),

    "*": NotFoundPage,
};
