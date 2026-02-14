'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** מודל אישור מחיקה/פעולה – עיצוב אחיד בכל האפליקציה */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'אישור',
  cancelLabel = 'ביטול',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-right" dir="rtl">
        <div className="flex items-start gap-4">
          <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${danger ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
            <AlertTriangle size={26} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="confirm-title" className="text-lg font-bold text-slate-900 mb-1">{title}</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => { onConfirm(); onCancel(); }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-white transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
