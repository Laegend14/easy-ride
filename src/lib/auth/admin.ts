import "server-only";

const DEFAULT_DEV_EMAILS = [
  "mueabraham16@gmail.com",
];

/**
 * Checks if the given user email belongs to a developer / administrator.
 * Supports environment overrides via DEV_EMAIL, DEV_EMAILS, ADMIN_EMAIL, or ADMIN_EMAILS in .env.local.
 */
export function isDeveloperEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();

  const envDevEmails = (
    process.env.DEV_EMAIL ||
    process.env.DEV_EMAILS ||
    process.env.ADMIN_EMAIL ||
    process.env.ADMIN_EMAILS ||
    ""
  )
    .split(",")
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);

  const devSet = new Set([...DEFAULT_DEV_EMAILS, ...envDevEmails]);
  return devSet.has(clean);
}
