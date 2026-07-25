/** Human-friendly messages for common Supabase Auth errors. */
export function formatAuthError(error: { message?: string; code?: string; name?: string; status?: number }) {
  const message = (error.message || "").trim();
  const code = (error.code || "").toLowerCase();
  const lower = message.toLowerCase();

  if (
    error.name === "AuthRetryableFetchError" ||
    lower.includes("failed to fetch") ||
    lower.includes("network")
  ) {
    return "Unable to reach the auth service. Check your connection and try again.";
  }

  if (
    code === "email_not_confirmed" ||
    lower.includes("email not confirmed") ||
    lower.includes("confirm your email")
  ) {
    return "Please confirm your email before signing in. Check your inbox for the confirmation link.";
  }

  if (code === "invalid_credentials" || lower.includes("invalid login credentials")) {
    return "Invalid email or password. If you just signed up, confirm your email first.";
  }

  if (code === "over_email_send_rate_limit" || lower.includes("rate limit")) {
    return "Too many emails sent. Wait a minute and try again.";
  }

  if (code === "user_already_exists" || lower.includes("already registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (lower.includes("password") && lower.includes("least")) {
    return message;
  }

  return message || "Authentication failed. Please try again.";
}
