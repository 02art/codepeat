const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 8;

/** Returns an error message for an invalid email, or `null` when it is valid. */
export function emailError(email: string): string | null {
    if (!EMAIL_PATTERN.test(email.trim())) {
        return "Bitte gib eine gültige E-Mail-Adresse ein.";
    }
    return null;
}

/** Returns an error message for a too-weak password, or `null` when it is valid. */
export function passwordError(password: string): string | null {
    if (password.length < PASSWORD_MIN_LENGTH) {
        return `Das Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen lang sein.`;
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        return "Das Passwort muss Buchstaben und Zahlen enthalten.";
    }
    return null;
}
