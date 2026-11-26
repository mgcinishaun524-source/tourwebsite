import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getLenisInstance, ScrollTrigger } from '../motion/gsapConfig';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const lenis = getLenisInstance();
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
    ScrollTrigger.refresh();
  }, [pathname]);

  return null;
}
