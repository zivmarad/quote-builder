import type { ReactNode } from 'react';

export function PhoneMockup({
  children,
  className = 'w-[280px] sm:w-[320px]',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[9/19] rounded-[2.5rem] border-[10px] border-slate-800 shadow-2xl bg-slate-900 overflow-hidden ${className}`}
    >
      <div className="absolute top-0 left-0 right-0 h-6 bg-slate-800 rounded-b-xl z-10 pointer-events-none" />
      <div className="absolute inset-0 pt-6 overflow-hidden bg-white">{children}</div>
    </div>
  );
}
