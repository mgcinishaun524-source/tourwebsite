import { ReactNode, useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../motion/gsapConfig';

interface PerspectiveCardProps {
  children: ReactNode;
  maxTilt?: number;
  className?: string;
}

export function PerspectiveCard({
  children,
  maxTilt = 3.2,
  className = '',
}: PerspectiveCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const rxTo = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    const ryTo = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' });

    gsap.set(el, { transformPerspective: 1100, transformStyle: 'preserve-3d' });

    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;
      rxTo(-normY * maxTilt * 2);
      ryTo(normX * maxTilt * 2);
    };

    const onMouseLeave = () => {
      rxTo(0);
      ryTo(0);
    };

    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
      gsap.set(el, { clearProps: 'transform' });
    };
  }, [maxTilt]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
