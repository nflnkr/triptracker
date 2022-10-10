import type { CookieOptions } from "express-session";

const MILLISECONDS_IN_A_DAY = 1000 * 60 * 60 * 24;

export const cookieSettings: CookieOptions = {
    sameSite: false,
    secure: process.env.NODE_ENV === "production",
    maxAge: MILLISECONDS_IN_A_DAY * 30,
    httpOnly: true,
}