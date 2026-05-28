'use client';

import { useLayoutEffect, useSyncExternalStore, type RefObject } from 'react';
import { createPortal } from 'react-dom';

type SpotlightOverlayProps = {
  open: boolean;
  targetRef: RefObject<HTMLElement | null>;
  hint: string;
  skipLabel: string;
  onSkip: () => void;
};

type TooltipPos = { top: number; left: number; width: number; placement: 'above' | 'below' };

function computeTooltipPos(rect: DOMRect): TooltipPos {
  const tooltipWidth = Math.min(288, window.innerWidth - 32);
  const centerX = rect.left + rect.width / 2;
  const left = Math.min(
    Math.max(16, centerX - tooltipWidth / 2),
    window.innerWidth - tooltipWidth - 16,
  );
  const spaceBelow = window.innerHeight - rect.bottom;
  const placement = spaceBelow > 140 ? 'below' : 'above';
  const top = placement === 'below' ? rect.bottom + 12 : rect.top - 12;
  return { top, left, width: tooltipWidth, placement };
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
  return useSyncExternalStore(
    (onStoreChange) => {
      if (!open) return () => {};

      const update = () => onStoreChange();

      update();
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);

      let ro: ResizeObserver | null = null;
      const attachObserver = () => {
        ro?.disconnect();
        ro = targetRef.current ? new ResizeObserver(update) : null;
        if (targetRef.current) ro?.observe(targetRef.current);
      };

      attachObserver();
      const raf = requestAnimationFrame(attachObserver);

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', update);
        window.removeEventListener('scroll', update, true);
        ro?.disconnect();
      };
    },
    () => {
      if (!open || !targetRef.current) return null;
      return computeTooltipPos(targetRef.current.getBoundingClientRect());
    },
    () => null,
  );
}

export default function SpotlightOverlay({
  open,
  targetRef,
  hint,
  skipLabel,
  onSkip,
}: SpotlightOverlayProps) {
  const mounted = useIsClient();
  const pos = useTargetTooltipPos(targetRef, open);

  useLayoutEffect(() => {
    if (!open) {
      document.body.classList.remove('spotlight-onboarding-active');
      return;
    }

    document.body.classList.add('spotlight-onboarding-active');
    return () => document.body.classList.remove('spotlight-onboarding-active');
  }, [open]);

  if (!mounted || !open || !pos) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[50] bg-slate-900/30 backdrop-blur-[2px] pointer-events-none transition-opacity"
        aria-hidden
      />
      <div
        role="dialog"
        aria-live="polite"
        className="spotlight-tooltip fixed z-[55] rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-900/10 p-4 text-right pointer-events-auto"
        style={{
          top: pos.placement === 'below' ? pos.top : undefined,
          bottom: pos.placement === 'above' ? window.innerHeight - pos.top : undefined,
          left: pos.left,
          width: pos.width,
        }}
      >
        <p className="text-sm font-semibold text-slate-800 leading-relaxed">{hint}</p>
        <button
          type="button"
          onClick={onSkip}
          className="mt-3 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
        >
          {skipLabel}
        </button>
      </div>
    </>,
    document.body,
  );
}
