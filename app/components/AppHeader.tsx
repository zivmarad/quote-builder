'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { User, LogIn, UserPlus, LogOut } from 'lucide-react';

export default function AppHeader() {
  const { user, isLoaded, logout } = useAuth();

  return (
    <header
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100"
      style={{ paddingTop: 'var(--safe-area-inset-top)' }}
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 min-h-[52px] sm:min-h-0">
        <Link
          href="/"
          className="font-black text-slate-900 text-base sm:text-lg md:text-xl truncate max-w-[140px] sm:max-w-none"
        >
          בונה הצעות מחיר
        </Link>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Link
            href="/profile"
            className="flex items-center justify-center gap-1.5 sm:gap-2 text-slate-600 hover:text-slate-900 font-medium text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] sm:min-w-0"
            aria-label="איזור אישי"
          >
            <User size={20} className="shrink-0" />
            <span className="hidden sm:inline">איזור אישי</span>
          </Link>
          {isLoaded &&
            (user ? (
              <>
                <span className="text-slate-500 text-xs sm:text-sm hidden md:inline truncate max-w-[100px]">
                  שלום, {user.username}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center justify-center gap-1.5 text-slate-600 hover:text-red-600 font-medium text-xs sm:text-sm px-2.5 sm:px-3 py-2.5 sm:py-2 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] sm:min-w-0"
                  aria-label="התנתק"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">התנתק</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium text-xs sm:text-sm px-2.5 sm:px-3 py-2.5 sm:py-2 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] sm:min-w-0"
                  aria-label="התחבר"
                >
                  <LogIn size={18} />
                  <span className="hidden sm:inline">התחבר</span>
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center justify-center gap-1.5 bg-blue-600 text-white font-bold text-xs sm:text-sm px-2.5 sm:px-3 py-2.5 sm:py-2 rounded-xl hover:bg-blue-700 transition-colors min-h-[44px] min-w-[44px] sm:min-w-0"
                  aria-label="הרשם"
                >
                  <UserPlus size={18} />
                  <span className="hidden sm:inline">הרשם</span>
                </Link>
              </>
            ))}
        </div>
      </div>
    </header>
  );
}
