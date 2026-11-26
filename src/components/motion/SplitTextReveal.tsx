import { useEffect, useRef } from 'react';
import { gsap, MOTION_EASE, prefersReducedMotion } from '../../motion/gsapConfig';

interface SplitTextRevealProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  mode?: 'words' | 'chars';
  trigger?: 'mount' | 'scroll';
  delay?: number;
  stagger?: number;
  className?: string;
}

export function SplitTextReveal({
  text,
  as: Tag = 'h2',
  mode = 'words',
  trigger = 'scroll',
  delay = 0,
  stagger = 0.04,
  className = '',
}: SplitTextRevealProps) {
  const containerRef = useRef<HTMLElement | null>(null);

  const tokens = mode === 'chars' ? text.split('') : text.split(' ');

  useEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const targets = el.querySelectorAll<HTMLElement>('[data-split-token]');
      if (!targets.length) return;

      const fromVars: gsap.TweenVars = {
        yPercent: 115,
        opacity: 0,
      };

      const toVars: gsap.TweenVars = {
        yPercent: 0,
        opacity: 1,
        duration: mode === 'chars' ? 0.6 : 0.8,
        stagger: mode === 'chars' ? stagger * 0.45 : stagger,
        delay,
        ease: MOTION_EASE.cinema,
        clearProps: 'transform',
      };

      if (trigger === 'scroll') {
        toVars.scrollTrigger = {
          trigger: el,
          start: 'top 86%',
          once: true,
        };
      }

      gsap.fromTo(targets, fromVars, toVars);
    }, el);

    return () => ctx.revert();
  }, [text, mode, trigger, delay, stagger]);

  return (
    <Tag
      ref={containerRef as React.RefObject<never>}
      aria-label={text}
      className={className}
    >
      {tokens.map((token, idx) => (
        <span
          key={`${token}-${idx}`}
          aria-hidden="true"
          className="inline-block overflow-hidden align-bottom pb-[0.06em] -mb-[0.06em]"
        >
          <span data-split-token className="inline-block will-change-transform">
            {token === ' ' ? '\u00A0' : token}
          </span>
          {mode === 'words' && idx < tokens.length - 1 ? '\u00A0' : null}
        </span>
      ))}
    </Tag>
  );
}
