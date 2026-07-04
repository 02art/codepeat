const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 8;

/** Returns an error message for an invalid email, or `null` when it is valid. */
export function emailError(email: string): string | null {
    if (!EMAIL_PATTERN.test(email.trim())) {
        return "Bitte gib eine gültige E-Mail-Adresse ein.";
    }
    return null;
}

export interface PasswordRule {
    label: string;
    met: (password: string) => boolean;
}

/** Password rules mirrored by the Django validators; also drives the live requirements checklist. */
export const PASSWORD_RULES: PasswordRule[] = [
    {label: `Mindestens ${PASSWORD_MIN_LENGTH} Zeichen`, met: (p) => p.length >= PASSWORD_MIN_LENGTH},
    {label: "Groß- und Kleinbuchstaben", met: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p)},
    {label: "Mindestens eine Zahl", met: (p) => /\d/.test(p)},
    {label: "Mindestens ein Sonderzeichen", met: (p) => /[^A-Za-z0-9]/.test(p)},
];

/** Returns an error message when the password fails any rule, or `null` when it satisfies all. */
export function passwordError(password: string): string | null {
    return PASSWORD_RULES.every((rule) => rule.met(password)) ? null : "Das Passwort erfüllt noch nicht alle Anforderungen.";
}
