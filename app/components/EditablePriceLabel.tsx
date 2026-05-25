'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';

interface EditablePriceLabelProps {
  label: string;
  defaultValue: number;
  onSave: (value: number | '') => void;
  editHint?: string;
}

export default function EditablePriceLabel({ label, defaultValue, onSave, editHint }: EditablePriceLabelProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = useCallback(() => {
    setInput(String(defaultValue));
    setEditing(true);
  }, [defaultValue]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const trimmed = input.trim();
    if (trimmed === '') {
      onSave('');
    } else {
      const n = parseInt(trimmed, 10);
      if (!Number.isNaN(n)) onSave(n);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="inline-flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9-]*"
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/[^\d-]/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="w-20 min-h-[32px] rounded-lg border border-blue-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          dir="ltr"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      title={editHint}
      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 px-2 py-1 rounded-lg transition-colors group"
    >
      <span>{label}</span>
      <Pencil size={10} className="opacity-40 group-hover:opacity-100" aria-hidden />
    </button>
  );
}
