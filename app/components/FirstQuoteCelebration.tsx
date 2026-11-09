'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CONTRACTOR_LANDING_PATH } from '@/lib/contractor-landing';
import {
  dismissLandingOfferPrompt,
  FIRST_QUOTE_CELEBRATION_EVENT,
  landingOfferPromptPending,
} from '@/lib/landing-offer-prompt';

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
};

const COLORS = ['#fbbf24', '#fde68a', '#93c5fd', '#ffffff', '#fb7185', '#6ee7b7'];

function Fireworks({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let frame = 0;
    let running = true;
    let raf = 0;
    const sparks: Spark[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const burst = (x: number, y: number) => {
      const count = 42;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
        const speed = 2.2 + Math.random() * 3.4;
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          max: 46 + Math.random() * 28,
          color: COLORS[i % COLORS.length],
          size: 1.6 + Math.random() * 1.8,
        });
      }
    };

    const tick = () => {
      if (!running) return;
      frame += 1;
      if (frame === 8 || frame === 36 || frame === 68) {
        burst(
          canvas.width * (0.28 + Math.random() * 0.44),
          canvas.height * (0.18 + Math.random() * 0.28),
        );
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        spark.life += 1;
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.vy += 0.045;
        spark.vx *= 0.985;
        const fade = 1 - spark.life / spark.max;
        if (fade <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = fade;
        ctx.fillStyle = spark.color;
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (frame < 160 || sparks.length > 0) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [active]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[230]" aria-hidden />;
}

export default function FirstQuoteCelebration() {
  const [open, setOpen] = useState(false);
  const preview = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('celebrate') === '1') {
      preview.current = true;
      setOpen(true);
      return;
    }
    const openIfPending = () => {
      if (landingOfferPromptPending()) setOpen(true);
    };
    openIfPending();
    window.addEventListener(FIRST_QUOTE_CELEBRATION_EVENT, openIfPending);
    return () => window.removeEventListener(FIRST_QUOTE_CELEBRATION_EVENT, openIfPending);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => {
    if (!preview.current) dismissLandingOfferPrompt();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4" dir="rtl">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/55"
        aria-label="סגור"
        onClick={close}
      />
      <Fireworks active={open} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-quote-title"
        className="relative z-[240] w-full max-w-md rounded-3xl bg-white px-6 py-7 shadow-2xl"
      >
        <button
          type="button"
          onClick={close}
          aria-label="סגור"
          className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            ×
          </span>
        </button>
        <h2 id="first-quote-title" className="text-2xl font-black text-slate-900 leading-snug pl-8">
          מזל טוב על הצעת המחיר הראשונה! 🎉
        </h2>
        <p className="mt-3 text-slate-600 leading-relaxed">
          הצעת המחיר הראשונה שלך מוכנה לשליחה. עכשיו אפשר לקחת את העסק שלך צעד קדימה.
        </p>
        <p className="mt-4 font-semibold text-slate-800 leading-relaxed">
          רוצה שגם הלקוחות שלך יוכלו למצוא אותך בקלות?
        </p>
        <p className="mt-2 text-slate-600 leading-relaxed">
          אפשר לבנות לך דף נחיתה מקצועי לעסק, עם פירוט השירותים, תמונות עבודות, המלצות וכפתור ישיר
          ליצירת קשר בוואטסאפ.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href={CONTRACTOR_LANDING_PATH}
            onClick={close}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#2563eb] py-3.5 font-bold text-white hover:bg-[#1d4ed8] transition-colors"
          >
            <span aria-hidden="true">←</span>
            לפרטים נוספים על בניית דף נחיתה לעסק
          </Link>
          <button
            type="button"
            onClick={close}
            className="w-full rounded-xl border border-slate-200 py-3.5 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            הבנתי תודה
          </button>
        </div>
      </div>
    </div>
  );
}
