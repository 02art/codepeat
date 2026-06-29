/**
 * Selectable profile-picture pool.
 *
 * The images live in `static/PB/` and are copied to `/codepeat/PB/` at build time. A build
 * step (`build:avatars`) writes `PB/manifest.json` listing whatever images are present, so
 * the pool is fully dynamic: drop files into `static/PB/` (or remove them) and rebuild — no
 * code change needed.
 */
const AVATAR_DIR = "PB";

/** Load the avatar pool as relative image paths (e.g. `PB/avatar-1.jpg`); empty on failure. */
export async function loadAvatars(): Promise<string[]> {
    try {
        const response = await fetch(`${AVATAR_DIR}/manifest.json`);
        if (!response.ok) {
            return [];
        }
        const files: unknown = await response.json();
        if (!Array.isArray(files)) {
            return [];
        }
        return files.filter((file): file is string => typeof file === "string").map((file) => `${AVATAR_DIR}/${file}`);
    } catch {
        return [];
    }
}
