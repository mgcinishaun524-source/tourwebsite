import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Expand, ZoomIn, ZoomOut } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { gsap, MOTION_EASE, pauseLenis, prefersReducedMotion, resumeLenis } from '../motion/gsapConfig';
import { ResilientImage } from './ResilientImage';

export interface GalleryImageItem {
  src: string;
  alt: string;
  caption?: string;
  location?: string;
}

interface ImageGalleryProps {
  images: GalleryImageItem[];
  columns?: 2 | 3;
}

export function ImageGallery({ images, columns = 3 }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setZoomed(false);
    if (activeIndex !== null) {
      pauseLenis();
    } else {
      resumeLenis();
    }
    return () => resumeLenis();
  }, [activeIndex]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || prefersReducedMotion()) return;

    const mm = gsap.matchMedia();
    mm.add(
      {
        isDesktop: '(min-width: 1024px)',
        isMobile: '(max-width: 1023px)',
      },
      (context) => {
        const isDesktop = context.conditions?.isDesktop ?? true;
        const frames = grid.querySelectorAll<HTMLElement>('[data-gallery-frame]');
        if (!frames.length) return;

        gsap.fromTo(
          frames,
          {
            clipPath: isDesktop ? 'inset(14% 0% 0% 0%)' : 'inset(6% 0% 0% 0%)',
            y: isDesktop ? 24 : 12,
            opacity: 0,
          },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            y: 0,
            opacity: 1,
            duration: isDesktop ? 0.85 : 0.65,
            stagger: 0.08,
            ease: MOTION_EASE.cinema,
            clearProps: 'transform',
            scrollTrigger: {
              trigger: grid,
              start: 'top 84%',
              once: true,
            },
          }
        );
      }
    );

    return () => mm.revert();
  }, [images.length]);

  useEffect(() => {
    if (activeIndex === null) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveIndex(null);
      if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev === null ? 0 : (prev + 1) % images.length));
      }
      if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) =>
          prev === null ? 0 : (prev - 1 + images.length) % images.length
        );
      }
      if (e.key.toLowerCase() === 'z') {
        setZoomed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || activeIndex === null || zoomed) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(deltaX) > 45) {
      if (deltaX < 0) {
        setActiveIndex((activeIndex + 1) % images.length);
      } else {
        setActiveIndex((activeIndex - 1 + images.length) % images.length);
      }
    }
  };

  const gridClass =
    columns === 2
      ? 'grid-cols-1 md:grid-cols-12'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-12';

  const getTileClass = (idx: number) => {
    if (columns === 2) {
      return idx % 2 === 0
        ? 'md:col-span-7 aspect-[16/10]'
        : 'md:col-span-5 aspect-[4/3] md:aspect-[4/3]';
    }
    if (idx === 0) return 'sm:col-span-2 lg:col-span-7 aspect-[16/10]';
    if (idx === 1) return 'lg:col-span-5 aspect-[4/3] lg:aspect-[5/4]';
    if (idx === 2) return 'lg:col-span-4 aspect-[4/3]';
    if (idx === 3) return 'lg:col-span-4 aspect-[4/3]';
    return 'sm:col-span-2 lg:col-span-4 aspect-[4/3]';
  };

  return (
    <>
      <div ref={gridRef} className={`grid ${gridClass} gap-6 lg:gap-7 items-start`}>
        {images.map((item, idx) => (
          <figure
            key={`${item.src}-${idx}`}
            data-gallery-frame
            className={`group flex flex-col gap-2.5 ${getTileClass(idx).replace(/aspect-\[[^\]]+\]/g, '')}`}
          >
            <button
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`Open image lightbox: ${item.alt}`}
              className={`relative w-full block overflow-hidden bg-[#121312] border border-[#E7E4DA] text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9C397] ${
                columns === 2
                  ? idx % 2 === 0
                    ? 'aspect-[16/10]'
                    : 'aspect-[4/3]'
                  : idx === 0
                  ? 'aspect-[16/10]'
                  : idx === 1
                  ? 'aspect-[4/3] lg:aspect-[16/14]'
                  : 'aspect-[4/3]'
              }`}
            >
              <ResilientImage
                src={item.src}
                alt={item.alt}
                className="w-full h-full"
                imgClassName="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
              />
              <span
                aria-hidden="true"
                className="absolute top-3.5 right-3.5 w-8 h-8 bg-[#0D0E0E]/65 backdrop-blur-md border border-[#FFFFFF]/20 text-[#D9C397] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <Expand className="w-3.5 h-3.5 stroke-[1.5]" />
              </span>
            </button>
            <figcaption className="flex items-baseline justify-between gap-3 pt-1 border-t border-[#E7E4DA]/80 text-xs text-[#788078]">
              <span className="truncate font-serif italic text-[#26342D]">
                {item.caption || item.alt}
              </span>
              <span className="text-[11px] uppercase tracking-[0.16em] text-[#244B3A] shrink-0 tabular-nums">
                Pl. 0{idx + 1}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      <AnimatePresence>
        {activeIndex !== null && images[activeIndex] && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 bg-[#0A0B0B]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label="Photo Lightbox"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="absolute top-5 right-5 flex items-center gap-2.5 z-20">
              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                aria-label={zoomed ? 'Zoom out image' : 'Zoom in image'}
                className="h-11 px-4 glass-forest-subtle rounded-full inline-flex items-center gap-2 text-xs text-[#F6F4ED] hover:text-[#D9C397] active:scale-[0.97] transition-all cursor-pointer"
              >
                {zoomed ? (
                  <>
                    <ZoomOut className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
                    <span className="hidden sm:inline">Reset Zoom</span>
                  </>
                ) : (
                  <>
                    <ZoomIn className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
                    <span className="hidden sm:inline">Inspect Zoom</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                aria-label="Close gallery"
                className="w-11 h-11 glass-forest-subtle rounded-full inline-flex items-center justify-center text-[#F6F4ED] hover:text-[#D9C397] active:scale-[0.95] transition-all cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
              </button>
            </div>

            <div className="relative w-full max-w-5xl max-h-[78vh] flex items-center justify-center overflow-auto">
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((activeIndex - 1 + images.length) % images.length)
                  }
                  aria-label="Previous image"
                  className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 glass-forest rounded-full inline-flex items-center justify-center text-[#F6F4ED] hover:text-[#D9C397] active:scale-[0.95] transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
                </button>
              )}

              <AnimatePresence mode="wait">
                <motion.img
                  key={images[activeIndex].src}
                  src={images[activeIndex].src}
                  alt={images[activeIndex].alt}
                  referrerPolicy="no-referrer"
                  onClick={() => setZoomed((z) => !z)}
                  initial={
                    shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className={`max-w-full border border-[#FFFFFF]/15 shadow-2xl transition-transform duration-300 cursor-zoom-in ${
                    zoomed
                      ? 'scale-150 cursor-zoom-out max-h-[75vh] object-contain'
                      : 'max-h-[75vh] w-auto object-contain'
                  }`}
                />
              </AnimatePresence>

              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveIndex((activeIndex + 1) % images.length)}
                  aria-label="Next image"
                  className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 glass-forest rounded-full inline-flex items-center justify-center text-[#F6F4ED] hover:text-[#D9C397] active:scale-[0.95] transition-all cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="mt-5 text-center max-w-2xl text-[#F6F4ED]">
              <p className="text-sm font-serif italic text-[#D9C397]">
                {images[activeIndex].caption || images[activeIndex].alt}
              </p>
              <p className="text-xs text-[#F6F4ED]/60 mt-1 tabular-nums">
                {activeIndex + 1} / {images.length} · Swipe or use arrow keys · Press Z to zoom
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
