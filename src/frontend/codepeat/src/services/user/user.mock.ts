/** In-memory fixtures backing the user service. Read only via that service. */

import type {User} from "./user.types.js";

/** Id of the user treated as authenticated for this session. */
export const CURRENT_USER_ID = "u1";

export const MOCK_USERS: User[] = [
    {id: "u1", handle: "dianaloveskitty7", displayName: "Diana",    email: "diana.messmann@dhbw-student.de", streak: 6, avatarUrl: "/pb-mock.png",       verified: false},
    {id: "u2", handle: "codepeat",         displayName: "CodePeat", email: "team@codepeat.dev",             streak: 0, avatarUrl: "/codepeat-logo.png", verified: true},
];
