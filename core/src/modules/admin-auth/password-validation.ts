/**
 * password-validation --- Validates Super Admin new password strength rules ---
 */

/**
 * Validates a new Super Admin password (min 8 chars, at least one letter and one digit).
 * @param password - Plain-text password to validate
 * @returns Error message when invalid, or null when valid
 */
export function validateNewPassword(password: string): string | null {
  if (password.length < 8) {
    return 'New password must be at least 8 characters';
  }
  if (!/[a-zA-Z]/.test(password)) {
    return 'New password must contain at least one letter';
  }
  if (!/\d/.test(password)) {
    return 'New password must contain at least one digit';
  }
  return null;
}
