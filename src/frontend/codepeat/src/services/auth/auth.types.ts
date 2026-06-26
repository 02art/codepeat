export interface RegistrationInput {
    email: string;
    username: string;
    password: string;
}

export interface PasswordChangeInput {
    currentPassword: string;
    newPassword: string;
}
