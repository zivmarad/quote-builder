/** אורך מינימלי לסיסמה חדשה. התחברות עם סיסמה קיימת לא נחסמת כאן. */
export const MIN_PASSWORD_LENGTH = 8;

export function isPasswordTooShort(password: string): boolean {
  return password.length < MIN_PASSWORD_LENGTH;
}

export const PASSWORD_TOO_SHORT_MESSAGE = `הסיסמה חייבת להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים`;
