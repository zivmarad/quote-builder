'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { QuoteBasketProvider } from '../contexts/QuoteBasketContext';

/** מעביר את מזהה המשתמש ל-QuoteBasketProvider כדי שכל משתמש יראה את הסל שלו. */
export default function QuoteBasketWithAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return <QuoteBasketProvider userId={user?.id ?? null}>{children}</QuoteBasketProvider>;
}
