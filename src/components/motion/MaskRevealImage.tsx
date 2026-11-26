import { useEffect, useRef } from 'react';
import { gsap, MOTION_EASE, prefersReducedMotion } from '../../motion/gsapConfig';
import { ResilientImage } from '../ResilientImage';

export type MaskVariant = 'curtain' | 'circle' | 'diagonal' | 'iris';

interface MaskRevealImageProps {
  src: string;
  alt: string;
  variant?: MaskVariant;
  scrub?: boolean;
  radius?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}

function buildPresets(radius: string): Record<MaskVariant, { from: string; to: string }> {
  return {
    curtain: {
      from: `inset(100% 0% 0% 0% round ${radius})`,
      to: `inset(0% 0% 0% 0% round ${radius})`,
    },
    circle: {
      from: 'circle(12% at 50% 55%)',
      to: 'circle(85% at 50% 50%)',
    },
    diagonal: {
      from: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
      to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    },
    iris: {
      from: `inset(14% 12% 14% 12% round ${radius})`,
      to: `inset(0% 0% 0% 0% round ${radius})`,
    },
  };
}

export function MaskRevealImage({
  src,
  alt,
  variant = 'curtain',
  scrub = false,
  radius = '0px',
  className = '',
  imgClassName = 'w-full h-full object-cover',
  priority = false,
}: MaskRevealImageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const media = mediaRef.current;
    if (!wrapper || !media || prefersReducedMotion()) return;

    const presets = buildPresets(radius);
    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: '(min-width: 1024px)',
        isMobile: '(max-width: 1023px)',
      },
      (context) => {
        const isDesktop = context.conditions?.isDesktop ?? true;
        const preset = isDesktop ? presets[variant] : presets.curtain;
        const useScrub = isDesktop && scrub;

        gsap.set(wrapper, { clipPath: preset.from });
        gsap.set(media, { scale: isDesktop ? 1.12 : 1.06 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrapper,
            start: useScrub ? 'top 88%' : 'top 84%',
            end: useScrub ? 'top 25%' : undefined,
            scrub: useScrub ? 0.9 : false,
            once: !useScrub,
          },
        });

        tl.to(wrapper, {
          clipPath: preset.to,
          duration: useScrub ? 1 : 1.05,
          ease: useScrub ? 'none' : MOTION_EASE.cinema,
        }).to(
          media,
          {
            scale: 1,
            duration: useScrub ? 1 : 1.25,
            ease: useScrub ? 'none' : MOTION_EASE.cinema,
          },
          0
        );
      }
    );

    return () => mm.revert();
  }, [variant, scrub, radius]);

  return (
    <div ref={wrapperRef} className={`cinema-clip overflow-hidden ${className}`}>
      <div ref={mediaRef} className="w-full h-full will-change-transform">
        <ResilientImage
          src={src}
          alt={alt}
          className="w-full h-full"
          imgClassName={imgClassName}
          priority={priority}
        />
      </div>
    </div>
  );
}
