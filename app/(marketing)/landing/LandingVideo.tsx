'use client';

import { useEffect, useRef } from 'react';

const POSTER = '/landing/step-3-pdf.png';
const SRC = '/landing/demo.mp4';

export function LandingVideo({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      if (mq.matches) {
        video.pause();
        video.removeAttribute('autoplay');
      } else {
        video.setAttribute('autoplay', '');
        void video.play().catch(() => {});
      }
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      poster={POSTER}
      aria-label="הדגמת שימוש באפליקציה"
    >
      <source src={SRC} type="video/mp4" />
    </video>
  );
}
