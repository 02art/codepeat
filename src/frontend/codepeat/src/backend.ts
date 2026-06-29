/**
 * Pre-instantiated, type-safe backend clients generated from the OpenAPI specs.
 *
 * Do not call the generated clients (`src/api-client`, `src/auth-client`) directly
 * from components — go through the service modules in `src/services`, which keep API
 * access centralized and map backend DTOs to the frontend domain model.
 *
 * Regenerate the clients with `npm run build:api-client` / `npm run build:auth-client`.
 */

import * as apiClient from "./api-client/index.js";
import * as authClient from "./auth-client/index.js";
import {Configuration as ApiConfiguration} from "./api-client/index.js";
import {Configuration as AuthConfiguration} from "./auth-client/index.js";

/**
 * Resolve the backend base URL from the static `server.url` file (same mechanism as the main app).
 *
 * CodePeat is served same-origin by Django, so if `server.url` can't be read (e.g. the backend
 * is momentarily unreachable) we fall back to the current origin instead of letting this
 * top-level await reject — a rejection here would abort the whole module and leave a blank page.
 */
async function resolveServerUrl(): Promise<string> {
    try {
        const response = await fetch("server.url");
        if (response.ok) {
            const url = (await response.text()).trim();
            if (url) {
                return url;
            }
        }
    } catch {
        // Fall through to the origin-based default below.
    }
    return window.location.origin;
}

let serverUrl = await resolveServerUrl();

while (serverUrl.endsWith("/")) {
    serverUrl = serverUrl.slice(0, serverUrl.length - 1);
}

function csrfToken(): string {
    return document.cookie.match(/csrftoken=([\w-]+)/)?.[1] || "";
}

/**
 * Inject a fresh CSRF token on every request. Reading the cookie per-request (rather than once
 * at construction) is what makes POSTs work, since the cookie is only set after the first GET.
 * Using a middleware (instead of per-call `initOverrides`) avoids clobbering other headers such
 * as `Content-Type`, which DRF requires for JSON bodies.
 */
const csrfMiddleware = {
    pre: async (context: {url: string; init: RequestInit}) => {
        context.init.headers = {
            ...(context.init.headers as Record<string, string>),
            "X-CSRFToken": csrfToken(),
        };
        return {url: context.url, init: context.init};
    },
};

const apiConfiguration = new ApiConfiguration({basePath: serverUrl, middleware: [csrfMiddleware]});
const authConfiguration = new AuthConfiguration({basePath: serverUrl, middleware: [csrfMiddleware]});

/**
 * Grouped client objects. Each property is a generated API class bound to the
 * correct base URL and CSRF header.
 */
export default {
    // Allauth headless API (auth-client)
    account: {
        email: new authClient.AccountEmailApi(authConfiguration),
        password: new authClient.AccountPasswordApi(authConfiguration),
        phone: new authClient.AccountPhoneApi(authConfiguration),
        providers: new authClient.AccountProvidersApi(authConfiguration),
    },

    authentication: {
        account: new authClient.AuthenticationAccountApi(authConfiguration),
        currentSession: new authClient.AuthenticationCurrentSessionApi(authConfiguration),
        loginByCode: new authClient.AuthenticationLoginByCodeApi(authConfiguration),
        passwordReset: new authClient.AuthenticationPasswordResetApi(authConfiguration),
        providers: new authClient.AuthenticationProvidersApi(authConfiguration),
    },

    // OpenBook auth/user (api-client)
    auth: {
        currentUser: new apiClient.CurrentUserApi(apiConfiguration),
        userProfiles: new apiClient.UserProfilesApi(apiConfiguration),
    },

    // OpenBook course (api-client) — challenges may reference a course
    course: {
        courses: new apiClient.CoursesApi(apiConfiguration),
    },

    // CodePeat app (api-client)
    codepeat: {
        challenges: new apiClient.CodepeatChallengesApi(apiConfiguration),
        submissions: new apiClient.CodepeatSubmissionsApi(apiConfiguration),
        reflections: new apiClient.CodepeatReflectionsApi(apiConfiguration),
        reflectionQuestions: new apiClient.CodepeatReflectionQuestionsApi(apiConfiguration),
        feedbacks: new apiClient.CodepeatFeedbackApi(apiConfiguration),
        testResults: new apiClient.CodepeatTestResultsApi(apiConfiguration),
        account: new apiClient.CodepeatAccountApi(apiConfiguration),
    },
};
