import { useCallback, useLayoutEffect, useRef } from 'react';
import { Flip, gsap, MOTION_EASE, ScrollTrigger, prefersReducedMotion } from '../motion/gsapConfig';

export function useFlipFilter(dependencyKey: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);

  const captureFlipState = useCallback(() => {
    if (prefersReducedMotion() || !containerRef.current) return;
    const items = containerRef.current.querySelectorAll('[data-flip-item]');
    if (items.length > 0) {
      flipStateRef.current = Flip.getState(items);
    }
  }, []);

  useLayoutEffect(() => {
    const state = flipStateRef.current;
    const container = containerRef.current;
    if (!state || !container || prefersReducedMotion()) {
      flipStateRef.current = null;
      return;
    }

    flipStateRef.current = null;

    const items = container.querySelectorAll('[data-flip-item]');
    if (!items.length) return;

    Flip.from(state, {
      targets: items,
      duration: 0.52,
      stagger: 0.035,
      ease: MOTION_EASE.cinema,
      scale: false,
      simple: true,
      onEnter: (elements) =>
        gsap.fromTo(
          elements,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.42, stagger: 0.03, ease: MOTION_EASE.cinema }
        ),
      onComplete: () => {
        ScrollTrigger.refresh();
      },
    });
  }, [dependencyKey]);

  return { containerRef, captureFlipState };
}
