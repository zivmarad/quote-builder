'use client';

const PLACEHOLDER = '/landing/placeholder.svg';

export function LandingImage({
  src,
  alt,
  className,
  loading,
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={(e) => {
        const target = e.currentTarget;
        if (target.src !== PLACEHOLDER) target.src = PLACEHOLDER;
      }}
    />
  );
}
