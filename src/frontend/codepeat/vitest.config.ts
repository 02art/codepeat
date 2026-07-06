import {existsSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {defineConfig} from "vitest/config";
import {svelte} from "@sveltejs/vite-plugin-svelte";

// The codebase imports TypeScript modules with a ".js" extension (matching the "Bundler"
// module resolution used by the esbuild build). Vite does not rewrite ".js" -> ".ts" on its
// own, so this small resolver does it for relative imports.
const jsToTs = {
    name: "resolve-js-to-ts",
    enforce: "pre" as const,
    resolveId(source: string, importer: string | undefined) {
        if (importer && source.endsWith(".js") && (source.startsWith("./") || source.startsWith("../"))) {
            const candidate = resolve(dirname(importer), source.slice(0, -3) + ".ts");
            if (existsSync(candidate)) return candidate;
        }
        return null;
    },
};

export default defineConfig({
    plugins: [jsToTs, svelte({compilerOptions: {compatibility: {componentApi: 4}}})],
    resolve: {conditions: ["svelte", "browser"]},
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./vitest.setup.ts"],
        include: ["src/**/*.{test,spec}.ts"],
        coverage: {
            provider: "v8",
            include: ["src/services/**", "src/components/**"],
            exclude: ["src/api-client/**", "src/auth-client/**", "**/*.d.ts", "src/**/*.{test,spec}.ts"],
            reporter: ["text-summary", "text"],
        },
    },
});
