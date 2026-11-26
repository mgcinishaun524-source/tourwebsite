import { useState } from 'react';
import { Mountain } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  imgClassName = 'w-full h-full object-cover',
  priority = false,
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-gradient-to-br from-[#141615] via-[#1C1E1D] to-[#242725] text-[#F6F4ED] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Mountain className="w-7 h-7 text-[#D9C397] mb-3 stroke-[1.25]" aria-hidden="true" />
        <span className="font-serif text-sm tracking-wide text-[#F6F4ED]/90 max-w-xs">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#E7E4DA]/35 ${className}`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        onError={() => setHasError(true)}
        className={imgClassName}
      />
    </div>
  );
}
