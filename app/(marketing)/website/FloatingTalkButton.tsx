'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';

export default function FloatingTalkButton({ href }: { href: string }) {
  const [visible, setVisible] = useState(false);
  const [lift, setLift] = useState(0);

  useEffect(() => {
    const ctas = Array.from(document.querySelectorAll<HTMLElement>('[data-contact-cta]'));
    const footer = document.querySelector('footer');
    const onScreen = new Map<HTMLElement, boolean>();
    ctas.forEach((node) => onScreen.set(node, false));

    const place = () => {
      const ctaVisible = Array.from(onScreen.values()).some(Boolean);
      setVisible(!ctaVisible);
      if (!footer) {
        setLift(0);
        return;
      }
      const overlap = window.innerHeight - footer.getBoundingClientRect().top;
      setLift(overlap > 0 ? overlap + 12 : 0);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target instanceof HTMLElement) onScreen.set(entry.target, entry.isIntersecting);
        });
        place();
      },
      { threshold: 0.2 },
    );
    ctas.forEach((node) => observer.observe(node));

    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
    place();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', place);
      window.removeEventListener('resize', place);
    };
  }, []);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed left-4 z-30 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#128C7E] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(18,140,126,0.35)] transition duration-300 hover:bg-[#0e7569] motion-reduce:transition-none sm:left-16 sm:px-5 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
      style={{ bottom: `calc(1.25rem + ${lift}px + env(safe-area-inset-bottom))` }}
    >
      <MessageCircle size={18} aria-hidden />
      מתאים לי, בוא נדבר
    </a>
  );
}
