'use client';

import { useEffect, useRef, useState } from 'react';
import { Bookmark, Check, FileText, Trash2, X } from 'lucide-react';

const COMMON_NOTES = [
  'המחיר אינו כולל חומרים',
  'ההצעה בתוקף ל-14 יום',
  'כולל מע"מ',
];

type CartNotesEditorProps = {
  notes: string;
  onChange: (value: string) => void;
  savedNotes: string[];
  onSaveTemplate: () => void;
  onApplyTemplate: (note: string) => void;
  onDeleteTemplate: (note: string) => void;
};

export default function CartNotesEditor({
  notes,
  onChange,
  savedNotes,
  onSaveTemplate,
  onApplyTemplate,
  onDeleteTemplate,
}: CartNotesEditorProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmed = notes.trim();
  const alreadySaved = savedNotes.some((n) => n.trim() === trimmed);

  useEffect(() => {
    if (!sheetOpen) return;
    const id = window.setTimeout(() => textareaRef.current?.focus(), 50);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [sheetOpen]);

  useEffect(() => {
    if (!sheetOpen || typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const sync = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardInset(inset);
    };
    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
    };
  }, [sheetOpen]);

  const appendNote = (snippet: string) => {
    const current = notes.trim();
    if (!current) {
      onChange(snippet);
      return;
    }
    if (current.includes(snippet)) return;
    onChange(`${current}\n${snippet}`);
  };

  const suggestionChips = () => (
    <div className="space-y-2">
      {savedNotes.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-slate-500 mb-1.5">ההערות השמורות שלך</p>
          <div className="flex flex-wrap gap-1.5">
            {savedNotes.map((note) => (
              <span
                key={note}
                className="inline-flex items-center gap-1 max-w-full rounded-full bg-blue-50 border border-blue-100"
              >
                <button
                  type="button"
                  onClick={() => onApplyTemplate(note)}
                  className="px-2.5 py-1.5 text-xs font-medium text-blue-800 truncate max-w-[220px]"
                >
                  {note.replace(/\s+/g, ' ')}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTemplate(note)}
                  className="p-1.5 pr-2 text-blue-400 hover:text-red-600 min-h-[32px] min-w-[32px] flex items-center justify-center"
                  aria-label="מחק הערה שמורה"
                >
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="text-[11px] font-bold text-slate-500 mb-1.5">הוספה מהירה</p>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_NOTES.map((note) => (
            <button
              key={note}
              type="button"
              onClick={() => appendNote(note)}
              className="px-2.5 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
            >
              {note}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const saveTemplateButton = () => (
    <button
      type="button"
      onClick={onSaveTemplate}
      disabled={!trimmed || alreadySaved}
      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 disabled:text-slate-400 disabled:cursor-default min-h-[40px]"
    >
      <Bookmark size={14} />
      {alreadySaved ? 'נשמר להצעות הבאות' : 'שמור להצעות הבאות'}
    </button>
  );

  return (
    <>
      <div className="hidden sm:block px-6 py-4 bg-white border-t border-slate-100">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <label htmlFor="notes" className="block text-sm font-bold text-slate-700 text-right">
            הערות להצעה
          </label>
          {saveTemplateButton()}
        </div>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          placeholder="למשל: המחיר לא כולל חומרים, צפי לסיום, תנאי תשלום..."
          rows={4}
          className="w-full min-h-[96px] px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right resize-y text-base"
        />
        <p className="mt-1.5 text-[11px] text-slate-400 text-right">נשמר אוטומטית גם אם תצא מההצעה</p>
        <div className="mt-3">{suggestionChips()}</div>
      </div>

      <div className="sm:hidden px-4 py-3 bg-white border-t border-slate-100">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="w-full text-right rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 min-h-[56px] hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
        >
          <span className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-sm font-bold text-slate-800">הערות להצעה</span>
            <FileText size={18} className="text-slate-400 shrink-0" />
          </span>
          <span className={`block text-sm leading-relaxed line-clamp-2 ${trimmed ? 'text-slate-700' : 'text-slate-400'}`}>
            {trimmed ? notes : 'הוסף הערות — נשמר אוטומטית, גם אם תצא מההצעה'}
          </span>
        </button>
      </div>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:hidden"
          dir="rtl"
          role="presentation"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="bg-white rounded-t-2xl shadow-2xl w-full max-w-lg flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notes-sheet-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              paddingBottom: `max(12px, calc(env(safe-area-inset-bottom) + ${keyboardInset}px))`,
              maxHeight: '92vh',
            }}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 id="notes-sheet-title" className="text-lg font-black text-slate-900">
                הערות להצעה
              </h3>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="p-2 -m-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                aria-label="סגור"
              >
                <X size={22} />
              </button>
            </div>
            <p className="px-4 text-xs text-slate-500 mb-2">
              נשמר אוטומטית. אפשר גם לשמור לשימוש חוזר בהצעות הבאות.
            </p>
            <textarea
              ref={textareaRef}
              value={notes}
              onChange={(e) => onChange(e.target.value)}
              placeholder="למשל: המחיר לא כולל חומרים, צפי לסיום, תנאי תשלום..."
              className="mx-4 min-h-[36vh] px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-base leading-relaxed resize-none"
            />
            <div className="px-4 py-3 overflow-y-auto max-h-[28vh]">{suggestionChips()}</div>
            <div className="px-4 flex flex-col gap-2">
              {saveTemplateButton()}
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700"
              >
                <Check size={18} />
                סיום
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
