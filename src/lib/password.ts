export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Too short" | "Weak" | "Fair" | "Good" | "Strong";
  checks: {
    length: boolean;
    lowerUpper: boolean;
    number: boolean;
    symbol: boolean;
  };
}

export const MIN_PASSWORD_LENGTH = 8;

export function scorePassword(password: string): PasswordStrength {
  const checks = {
    length: password.length >= MIN_PASSWORD_LENGTH,
    lowerUpper: /[a-z]/.test(password) && /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  if (!checks.length) {
    return { score: 0, label: "Too short", checks };
  }

  const passed = Object.values(checks).filter(Boolean).length;
  const bonus = password.length >= 14 ? 1 : 0;
  const score = Math.min(4, Math.max(1, passed - 1 + bonus)) as 1 | 2 | 3 | 4;

  const labels: Record<1 | 2 | 3 | 4, PasswordStrength["label"]> = {
    1: "Weak",
    2: "Fair",
    3: "Good",
    4: "Strong",
  };

  return { score, label: labels[score], checks };
}

/** Blocks the handful of passwords that show up in every credential-stuffing list. */
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "qwerty123",
  "letmein1",
  "welcome1",
  "admin123",
  "iloveyou",
]);

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return "That password is too common. Choose something harder to guess.";
  }
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return "Include at least one letter and one number.";
  }
  return null;
}
