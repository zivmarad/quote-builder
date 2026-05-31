'use client';

import { useRef, useSyncExternalStore, type RefObject } from 'react';
import { createPortal } from 'react-dom';

type SpotlightOverlayProps = {
  open: boolean;
  targetRef: RefObject<HTMLElement | null>;
  hint: string;
  skipLabel: string;
  onDismiss: () => void;
};

type TooltipPos = {
  top: number;
  left: number;
  width: number;
  placement: 'above' | 'below';
  arrowLeft: number;
};

function computeTooltipPos(rect: DOMRect): TooltipPos {
  const tooltipWidth = Math.min(240, window.innerWidth - 32);
  const centerX = rect.left + rect.width / 2;
  const left = Math.min(
    Math.max(16, centerX - tooltipWidth / 2),
    window.innerWidth - tooltipWidth - 16,
  );
  const spaceBelow = window.innerHeight - rect.bottom;
  const placement = spaceBelow > 120 ? 'below' : 'above';
  const top = placement === 'below' ? rect.bottom + 10 : rect.top - 10;
  const arrowLeft = Math.min(
    Math.max(12, centerX - left),
    tooltipWidth - 12,
  );
  return { top, left, width: tooltipWidth, placement, arrowLeft };
}

function posEqual(a: TooltipPos | null, b: TooltipPos | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.placement === b.placement &&
    a.arrowLeft === b.arrowLeft
  );
}

function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function useTargetTooltipPos(
  targetRef: RefObject<HTMLElement | null>,
  open: boolean,
): TooltipPos | null {
  const cachedRef = useRef<TooltipPos | null>(null);

  return useSyncExternalStore(
    (onStoreChange) => {
      if (!open) return () => {};

      const update = () => onStoreChange();

      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);

      let ro: ResizeObserver | null = null;
      const attachObserver = () => {
        ro?.disconnect();
        ro = targetRef.current ? new ResizeObserver(update) : null;
        if (targetRef.current) {
          ro?.observe(targetRef.current);
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
      const next = computeTooltipPos(targetRef.current.getBoundingClientRect());
      if (posEqual(cachedRef.current, next)) {
        return cachedRef.current;
      }
      cachedRef.current = next;
      return next;
    },
    () => null,
  );
}

export default function SpotlightOverlay({
  open,
  targetRef,
  hint,
  skipLabel,
  onDismiss,
}: SpotlightOverlayProps) {
  const mounted = useIsClient();
  const pos = useTargetTooltipPos(targetRef, open);

  if (!mounted || !open || !pos) return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label={skipLabel}
        className="fixed inset-0 z-[50] bg-slate-900/[0.07] transition-opacity cursor-default"
        onClick={onDismiss}
      />
      <div
        role="dialog"
        aria-live="polite"
        className="spotlight-tooltip fixed z-[55] pointer-events-auto"
        style={{
          top: pos.placement === 'below' ? pos.top : undefined,
          bottom: pos.placement === 'above' ? window.innerHeight - pos.top : undefined,
          left: pos.left,
          width: pos.width,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative rounded-2xl bg-white border border-slate-200/70 px-4 py-3 shadow-xl shadow-slate-900/[0.08] text-right">
          <span
            aria-hidden
            className={`absolute w-2.5 h-2.5 bg-white border-slate-200/70 rotate-45 ${
              pos.placement === 'below'
                ? '-top-[6px] border-t border-l'
                : '-bottom-[6px] border-b border-r'
            }`}
            style={{ left: pos.arrowLeft - 5 }}
          />
          <div className="flex items-center justify-end gap-2 mb-1.5">
            <p className="text-[13px] font-semibold leading-snug text-slate-900">{hint}</p>
            <span aria-hidden className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-blue-500/40 spotlight-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
            </span>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            {skipLabel}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
