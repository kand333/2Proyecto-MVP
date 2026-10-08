/**
 * Development users created by the seed. For local development and manual QA only: the seed refuses
 * to run in production or against a non-local database.
 */
export const TEST_USER_PASSWORD = "test1234";

export const TEST_USERS = [
  { name: "Admin", email: "admin@example.com", role: "ADMIN" },
  { name: "User", email: "user@example.com", role: "USER" },
] as const;
