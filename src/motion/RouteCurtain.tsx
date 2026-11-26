import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap, ScrollTrigger, prefersReducedMotion } from './gsapConfig';

export function RouteCurtain() {
  const { pathname } = useLocation();
  const isInitialMount = useRef(true);
  const curtainRef = useRef<HTMLDivElement>(null);
  const accentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const refreshTimer = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 180);

    if (prefersReducedMotion() || !curtainRef.current || !accentRef.current) {
      return () => window.clearTimeout(refreshTimer);
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.set(curtainRef.current, {
        autoAlpha: 1,
        clipPath: 'inset(0% 0% 0% 0%)',
      })
        .set(accentRef.current, {
          scaleX: 0,
          opacity: 1,
        })
        .to(accentRef.current, {
          scaleX: 1,
          duration: 0.24,
          ease: 'power2.out',
        })
        .to(
          curtainRef.current,
          {
            clipPath: 'inset(0% 0% 100% 0%)',
            duration: 0.56,
            ease: 'expo.inOut',
          },
          '-=0.06'
        )
        .set(curtainRef.current, { autoAlpha: 0 });
    });

    return () => {
      window.clearTimeout(refreshTimer);
      ctx.revert();
    };
  }, [pathname]);

  return (
    <div
      ref={curtainRef}
      aria-hidden="true"
      className="fixed inset-0 z-[60] pointer-events-none bg-[#102D25] opacity-0 invisible flex items-center justify-center"
    >
      <div className="w-48 flex flex-col items-center gap-3">
        <span className="font-logo text-2xl leading-none text-[#D9C397]">
          Transend Tours
        </span>
        <div
          ref={accentRef}
          className="h-px w-full bg-[#D9C397] origin-left"
        />
      </div>
    </div>
  );
}
