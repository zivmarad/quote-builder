'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/** הסשן (מי מחובר כרגע) נשמר ב-localStorage; רשימת המשתמשים נשמרת בשרת (API) וזמינה מכל מכשיר. */
const CURRENT_USER_KEY = 'quoteBuilder_currentUser';

export interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface CurrentUser {
  id: string;
  username: string;
  email?: string;
}

function getCurrentUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

function setCurrentUser(user: CurrentUser | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (e) {
    console.warn('Auth: could not save session to localStorage', e);
  }
}

interface AuthContextType {
  user: CurrentUser | null;
  isLoaded: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  sendVerificationCode: (email: string) => Promise<{ ok: boolean; error?: string }>;
  checkVerificationCode: (email: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  signupWithEmail: (email: string, code: string, username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  sendResetCode: (email: string) => Promise<{ ok: boolean; error?: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  sendUsernameToEmail: (email: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    setIsLoaded(true);
  }, []);

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    const trimmed = usernameOrEmail.trim();
    if (!trimmed || !password) {
      return { ok: false, error: 'נא למלא שם משתמש או אימייל וסיסמה' };
    }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error ?? 'שגיאה בהתחברות' };
      }
      if (data.ok && data.user) {
        const current: CurrentUser = { id: data.user.id, username: data.user.username, email: data.user.email };
        setCurrentUser(current);
        setUser(current);
        return { ok: true };
      }
      return { ok: false, error: 'שגיאה בהתחברות' };
    } catch (e) {
      console.warn('Login request failed', e);
      return { ok: false, error: 'לא ניתן להתחבר לשרת. בדוק חיבור לאינטרנט.' };
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const u = getCurrentUser();
    if (!u) return { ok: false, error: 'לא מחובר' };
    if (!newPassword || newPassword.length < 4) return { ok: false, error: 'הסיסמה החדשה חייבת לפחות 4 תווים' };
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: u.id, currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error ?? 'שגיאה בשינוי סיסמה' };
      return { ok: true };
    } catch (e) {
      console.warn('Change password failed', e);
      return { ok: false, error: 'לא ניתן לשנות סיסמה. בדוק חיבור לאינטרנט.' };
    }
  }, []);

  const signup = useCallback(async (username: string, password: string) => {
    const trimmed = username.trim();
    if (!trimmed) {
      return { ok: false, error: 'נא להזין שם משתמש' };
    }
    if (trimmed.length < 2) {
      return { ok: false, error: 'שם המשתמש חייב להכיל לפחות 2 תווים' };
    }
    if (!password || password.length < 4) {
      return { ok: false, error: 'הסיסמה חייבת להכיל לפחות 4 תווים' };
    }
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error ?? 'שגיאה בהרשמה' };
      }
      if (data.ok && data.user) {
        const current: CurrentUser = { id: data.user.id, username: data.user.username, email: data.user.email };
        setCurrentUser(current);
        setUser(current);
        return { ok: true };
      }
      return { ok: false, error: 'שגיאה בהרשמה' };
    } catch (e) {
      console.warn('Signup request failed', e);
      return { ok: false, error: 'לא ניתן להתחבר לשרת. בדוק חיבור לאינטרנט.' };
    }
  }, []);

  const sendVerificationCode = useCallback(async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return { ok: false, error: 'נא להזין אימייל' };
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      let data: { ok?: boolean; error?: string } = {};
      try {
        const text = await res.text();
        if (text) data = JSON.parse(text);
      } catch {
        if (!res.ok) return { ok: false, error: 'שגיאה בשרת. נסה שוב או בדוק חיבור לאינטרנט.' };
      }
      if (!res.ok) return { ok: false, error: data.error ?? 'שגיאה בשליחת הקוד' };
      return { ok: true };
    } catch (e) {
      console.warn('Send code failed', e);
      return { ok: false, error: 'לא ניתן לשלוח קוד. בדוק חיבור לאינטרנט ונסה שוב.' };
    }
  }, []);

  const checkVerificationCode = useCallback(async (email: string, code: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();
    if (!trimmedEmail || !trimmedCode) return { ok: false, error: 'נא להזין אימייל וקוד' };
    try {
      const res = await fetch('/api/auth/check-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, code: trimmedCode }),
      });
      let data: { ok?: boolean; error?: string } = {};
      try {
        const text = await res.text();
        if (text) data = JSON.parse(text);
      } catch {
        if (!res.ok) return { ok: false, error: 'שגיאה בשרת. נסה שוב או בדוק חיבור לאינטרנט.' };
      }
      if (!res.ok) return { ok: false, error: data.error ?? 'קוד לא תקין או שפג תוקפו' };
      return { ok: !!data.ok };
    } catch (e) {
      console.warn('Check code failed', e);
      return { ok: false, error: 'לא ניתן לאמת. בדוק חיבור לאינטרנט ונסה שוב.' };
    }
  }, []);

  const signupWithEmail = useCallback(async (email: string, code: string, username: string, password: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();
    const trimmedUsername = username.trim();
    if (!trimmedEmail || !trimmedCode) return { ok: false, error: 'נא להזין אימייל וקוד' };
    if (!trimmedUsername || trimmedUsername.length < 2) return { ok: false, error: 'שם המשתמש חייב לפחות 2 תווים' };
    if (!password || password.length < 4) return { ok: false, error: 'הסיסמה חייבת לפחות 4 תווים' };
    try {
      const res = await fetch('/api/auth/signup-with-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, code: trimmedCode, username: trimmedUsername, password }),
      });
      let data: { ok?: boolean; error?: string; user?: { id: string; username: string; email?: string } } = {};
      try {
        const text = await res.text();
        if (text) data = JSON.parse(text);
      } catch {
        if (!res.ok) return { ok: false, error: 'שגיאה בשרת. נסה שוב או בדוק חיבור לאינטרנט.' };
      }
      if (!res.ok) return { ok: false, error: data.error ?? 'שגיאה בהרשמה' };
      if (data.ok && data.user) {
        const current: CurrentUser = { id: data.user.id, username: data.user.username, email: data.user.email };
        setCurrentUser(current);
        setUser(current);
        return { ok: true };
      }
      return { ok: false, error: data.error ?? 'שגיאה בהרשמה' };
    } catch (e) {
      console.warn('Signup with email failed', e);
      return { ok: false, error: 'לא ניתן להתחבר לשרת. בדוק חיבור לאינטרנט ונסה שוב.' };
    }
  }, []);

  const sendResetCode = useCallback(async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return { ok: false, error: 'נא להזין אימייל' };
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, intent: 'reset' }),
      });
      let data: { ok?: boolean; error?: string } = {};
      try {
        const text = await res.text();
        if (text) data = JSON.parse(text);
      } catch {
        if (!res.ok) return { ok: false, error: 'שגיאה בשרת. נסה שוב או בדוק חיבור לאינטרנט.' };
      }
      if (!res.ok) return { ok: false, error: data.error ?? 'שגיאה בשליחת הקוד' };
      return { ok: true };
    } catch (e) {
      console.warn('Send reset code failed', e);
      return { ok: false, error: 'לא ניתן לשלוח קוד. בדוק חיבור לאינטרנט ונסה שוב.' };
    }
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();
    if (!trimmedEmail || !trimmedCode) return { ok: false, error: 'נא להזין אימייל וקוד' };
    if (!newPassword || newPassword.length < 4) return { ok: false, error: 'הסיסמה חייבת לפחות 4 תווים' };
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, code: trimmedCode, newPassword }),
      });
      let data: { ok?: boolean; error?: string } = {};
      try {
        const text = await res.text();
        if (text) data = JSON.parse(text);
      } catch {
        if (!res.ok) return { ok: false, error: 'שגיאה בשרת. נסה שוב או בדוק חיבור לאינטרנט.' };
      }
      if (!res.ok) return { ok: false, error: data.error ?? 'שגיאה באיפוס הסיסמה' };
      return { ok: true };
    } catch (e) {
      console.warn('Reset password failed', e);
      return { ok: false, error: 'לא ניתן לאפס. בדוק חיבור לאינטרנט ונסה שוב.' };
    }
  }, []);

  const sendUsernameToEmail = useCallback(async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return { ok: false, error: 'נא להזין אימייל' };
    try {
      const res = await fetch('/api/auth/send-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      let data: { error?: string } = {};
      try {
        const text = await res.text();
        if (text) data = JSON.parse(text);
      } catch {
        if (!res.ok) return { ok: false, error: 'שגיאה בשרת. נסה שוב או בדוק חיבור לאינטרנט.' };
      }
      if (!res.ok) return { ok: false, error: data.error ?? 'שגיאה בשליחה' };
      return { ok: true };
    } catch (e) {
      console.warn('Send username failed', e);
      return { ok: false, error: 'לא ניתן לשלוח. בדוק חיבור לאינטרנט.' };
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoaded, login, changePassword, signup, sendVerificationCode, checkVerificationCode, signupWithEmail, sendResetCode, resetPassword, sendUsernameToEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
