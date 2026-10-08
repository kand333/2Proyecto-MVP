import { z } from "zod";
import type { UserRole } from "./enums";

export const USER_NAME_MAX_LENGTH = 100;
export const USER_EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 8;
/** Upper bound so a huge password cannot make the hashing (scrypt) expensive. */
export const PASSWORD_MAX_LENGTH = 128;
/** Only adults can buy: the API rejects younger customers (DEC-008). */
export const MIN_CUSTOMER_AGE = 18;
/** Ages are counted with the calendar date of the shop (Chile). */
export const SHOP_TIME_ZONE = "America/Santiago";
const BIRTH_DATE_MIN = "1900-01-01";

/** Today's calendar date in the shop's time zone, as `YYYY-MM-DD`. */
export function shopToday(now: Date = new Date()): string {
  // The en-CA locale formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: SHOP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/**
 * Whether someone born on `birthDate` (`YYYY-MM-DD`) is at least MIN_CUSTOMER_AGE today in Chile.
 * Someone born on February 29 comes of age on March 1 in non-leap years.
 */
export function isAdult(birthDate: string, now: Date = new Date()): boolean {
  const [year, monthAndDay] = [birthDate.slice(0, 4), birthDate.slice(4)];
  const comingOfAge = `${String(Number(year) + MIN_CUSTOMER_AGE).padStart(4, "0")}${monthAndDay}`;
  return comingOfAge <= shopToday(now);
}

const isCalendarDate = (value: string) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

/** A real calendar date as `YYYY-MM-DD` (the value of `<input type="date">`). The age is checked by the API. */
export const birthDateSchema = z
  .string({ error: "Ingresa tu fecha de nacimiento" })
  .trim()
  .min(1, { error: "Ingresa tu fecha de nacimiento" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Ingresa una fecha válida" })
  .refine((value) => isCalendarDate(value) && value >= BIRTH_DATE_MIN, { error: "Ingresa una fecha válida" });

/** Emails are compared and stored trimmed and lowercase. */
const emailSchema = z
  .string({ error: "Ingresa tu email" })
  .trim()
  .toLowerCase()
  .max(USER_EMAIL_MAX_LENGTH, { error: "El email es demasiado largo" })
  .pipe(z.email({ error: "Ingresa un email válido, por ejemplo nombre@example.com" }));

/** Body of `POST /api/auth/register`. */
export const registerSchema = z.object({
  name: z
    .string({ error: "Ingresa tu nombre" })
    .trim()
    .min(2, { error: "Ingresa tu nombre" })
    .max(USER_NAME_MAX_LENGTH, { error: `El nombre admite hasta ${USER_NAME_MAX_LENGTH} caracteres` }),
  email: emailSchema,
  // Not trimmed: spaces are valid characters of a password.
  password: z
    .string({ error: "Ingresa una contraseña" })
    .min(PASSWORD_MIN_LENGTH, { error: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres` })
    .max(PASSWORD_MAX_LENGTH, { error: `La contraseña admite hasta ${PASSWORD_MAX_LENGTH} caracteres` }),
  birthDate: birthDateSchema,
});

/** Message of the 422 the API returns when the person is under MIN_CUSTOMER_AGE. */
export const UNDERAGE_MESSAGE = `Debes tener al menos ${MIN_CUSTOMER_AGE} años para registrarte`;

/** Body of `POST /api/auth/login`. */
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: "Ingresa tu contraseña" })
    .min(1, { error: "Ingresa tu contraseña" })
    .max(PASSWORD_MAX_LENGTH, { error: "Email o contraseña incorrectos" }),
});

/** Body of `PATCH /api/account/profile`. The API requires `currentPassword` only when the email changes. */
export const updateProfileSchema = z.object({
  name: registerSchema.shape.name,
  email: registerSchema.shape.email,
  currentPassword: z.string().max(PASSWORD_MAX_LENGTH, { error: "La contraseña actual no es correcta" }).optional(),
});

/** Body of `PUT /api/account/password`. */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ error: "Ingresa tu contraseña actual" })
      .min(1, { error: "Ingresa tu contraseña actual" })
      .max(PASSWORD_MAX_LENGTH, { error: "La contraseña actual no es correcta" }),
    newPassword: registerSchema.shape.password,
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ["newPassword"],
    error: "La nueva contraseña debe ser distinta de la actual",
  });

export type UpdateProfileData = z.output<typeof updateProfileSchema>;
export type ChangePasswordData = z.output<typeof changePasswordSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterData = z.output<typeof registerSchema>;
export type LoginInput = z.input<typeof loginSchema>;
export type LoginData = z.output<typeof loginSchema>;

/** The authenticated user, as returned by the auth endpoints. Never includes the password hash. */
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Always true in a successful response: deactivated accounts cannot log in or keep a session. */
  isActive: boolean;
};
