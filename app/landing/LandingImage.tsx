'use client';

const PLACEHOLDER = '/landing/placeholder.svg';

export function LandingImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        const target = e.currentTarget;
        if (target.src !== PLACEHOLDER) target.src = PLACEHOLDER;
      }}
    />
  );
}
