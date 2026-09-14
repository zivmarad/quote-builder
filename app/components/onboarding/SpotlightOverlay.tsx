'use client';

import { useEffect, useRef, useSyncExternalStore, type RefObject } from 'react';
import { createPortal } from 'react-dom';

type SpotlightOverlayProps = {
  open: boolean;
  targetRef: RefObject<HTMLElement | null>;
  title: string;
  body?: string;
  skipLabel: string;
  step?: number;
  totalSteps?: number;
  onDismiss: () => void;
};

type HoleRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
};

type TooltipPos = {
  top: number;
  left: number;
  width: number;
  placement: 'above' | 'below';
};

type SpotlightLayout = {
  hole: HoleRect;
  tooltip: TooltipPos;
};

const PAD = 8;
const TOOLTIP_GAP = 14;

function computeLayout(el: HTMLElement): SpotlightLayout {
  const rect = el.getBoundingClientRect();
  const hole: HoleRect = {
    top: Math.max(8, rect.top - PAD),
    left: Math.max(8, rect.left - PAD),
    width: Math.min(window.innerWidth - 16, rect.width + PAD * 2),
    height: rect.height + PAD * 2,
    radius: Math.min(22, Math.max(12, parseFloat(getComputedStyle(el).borderRadius) || 16)),
  };

  const tooltipWidth = Math.min(320, window.innerWidth - 32);
  const spaceBelow = window.innerHeight - hole.top - hole.height;
  const placement: 'above' | 'below' = spaceBelow > 150 ? 'below' : 'above';
  const centerX = hole.left + hole.width / 2;
  const left = Math.min(
    Math.max(16, centerX - tooltipWidth / 2),
    window.innerWidth - tooltipWidth - 16,
  );
  const top =
    placement === 'below' ? hole.top + hole.height + TOOLTIP_GAP : hole.top - TOOLTIP_GAP;

  return { hole, tooltip: { top, left, width: tooltipWidth, placement } };
}

function layoutEqual(a: SpotlightLayout | null, b: SpotlightLayout | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.hole.top === b.hole.top &&
    a.hole.left === b.hole.left &&
    a.hole.width === b.hole.width &&
    a.hole.height === b.hole.height &&
    a.tooltip.top === b.tooltip.top &&
    a.tooltip.left === b.tooltip.left &&
    a.tooltip.placement === b.tooltip.placement
  );
}

function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function useSpotlightLayout(
  targetRef: RefObject<HTMLElement | null>,
  open: boolean,
): SpotlightLayout | null {
  const cachedRef = useRef<SpotlightLayout | null>(null);

  return useSyncExternalStore(
    (onStoreChange) => {
      if (!open) return () => {};

      const update = () => onStoreChange();
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);

      let ro: ResizeObserver | null = null;
      const attachObserver = () => {
        ro?.disconnect();
        if (targetRef.current) {
          ro = new ResizeObserver(update);
          ro.observe(targetRef.current);
          update();
        }
      };
      const raf = requestAnimationFrame(attachObserver);

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', update);
        window.removeEventListener('scroll', update, true);
        ro?.disconnect();
      };
    },
    () => {
      if (!open || !targetRef.current) {
        cachedRef.current = null;
        return null;
      }
      const next = computeLayout(targetRef.current);
      if (layoutEqual(cachedRef.current, next)) return cachedRef.current;
      cachedRef.current = next;
      return next;
    },
    () => null,
  );
}

export default function SpotlightOverlay({
  open,
  targetRef,
  title,
  body,
  skipLabel,
  step,
  totalSteps = 4,
  onDismiss,
}: SpotlightOverlayProps) {
  const mounted = useIsClient();
  const layout = useSpotlightLayout(targetRef, open);

  useEffect(() => {
    if (!open) return;
    const el = targetRef.current;
    if (!el) return;
    const id = window.setTimeout(() => {
      el.scrollIntoView({ block: 'center', behavior: 'smooth', inline: 'nearest' });
    }, 80);
    return () => window.clearTimeout(id);
  }, [open, targetRef]);

  if (!mounted || !open || !layout) return null;

  const { hole, tooltip } = layout;

  return createPortal(
    <>
      <div
        aria-hidden
        className="spotlight-hole pointer-events-none fixed z-[50]"
        style={{
          top: hole.top,
          left: hole.left,
          width: hole.width,
          height: hole.height,
          borderRadius: hole.radius,
          boxShadow: '0 0 0 9999px rgb(15 23 42 / 0.52)',
        }}
      />
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="spotlight-title"
        className="spotlight-tooltip fixed z-[55] pointer-events-auto"
        style={{
          top: tooltip.placement === 'below' ? tooltip.top : undefined,
          bottom:
            tooltip.placement === 'above' ? window.innerHeight - tooltip.top : undefined,
          left: tooltip.left,
          width: tooltip.width,
        }}
      >
        <div className="rounded-2xl bg-white px-4 py-3.5 shadow-2xl shadow-slate-900/25 ring-1 ring-slate-900/10 text-right">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 id="spotlight-title" className="text-[15px] font-black text-slate-900 leading-snug">
              {title}
            </h3>
            {step != null && (
              <span className="shrink-0 text-[11px] font-bold tabular-nums text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                {step}/{totalSteps}
              </span>
            )}
          </div>
          {body && <p className="text-[13px] text-slate-600 leading-relaxed mb-3">{body}</p>}
          <button
            type="button"
            onClick={onDismiss}
            className="text-[12px] font-medium text-slate-400 hover:text-slate-700 transition-colors"
          >
            {skipLabel}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
