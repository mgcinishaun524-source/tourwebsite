import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, GripHorizontal, X } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useAnimation,
  useMotionValue,
  useReducedMotion,
} from 'motion/react';
import { IMAGE_ASSETS } from '@/config/brand';

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface UseMediaQueryOptions {
  defaultValue?: boolean;
  initializeWithValue?: boolean;
}

const IS_SERVER = typeof window === 'undefined';

export function useMediaQuery(
  query: string,
  {
    defaultValue = false,
    initializeWithValue = true,
  }: UseMediaQueryOptions = {},
): boolean {
  const getMatches = (q: string): boolean => {
    if (IS_SERVER) return defaultValue;
    return window.matchMedia(q).matches;
  };

  const [matches, setMatches] = useState<boolean>(() => {
    if (initializeWithValue) return getMatches(query);
    return defaultValue;
  });

  useIsomorphicLayoutEffect(() => {
    const matchMedia = window.matchMedia(query);
    const handleChange = () => setMatches(getMatches(query));
    handleChange();
    matchMedia.addEventListener('change', handleChange);
    return () => matchMedia.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

export interface ThreeDCarouselItem {
  title: string;
  category?: string;
  image: string;
  alt: string;
  href?: string;
}

const DEFAULT_ITEMS: ThreeDCarouselItem[] = [
  {
    title: 'Flight of Angels',
    category: 'Scenic Flights',
    image: IMAGE_ASSETS.helicopterFlight,
    alt: 'Helicopter soaring over Transend Tours waterfall mist',
    href: '/experiences/helicopter-flight-over-victoria-falls',
  },
  {
    title: 'Batoka Gorge Rapids',
    category: 'Adventure',
    image: IMAGE_ASSETS.whiteWaterRafting,
    alt: 'White-water rafting in Batoka Gorge rapids',
    href: '/experiences/batoka-gorge-white-water-rafting',
  },
  {
    title: 'Upper Zambezi Sunset',
    category: 'River Cruises',
    image: IMAGE_ASSETS.zambeziCruise,
    alt: 'Luxury sunset river cruise on the Upper Zambezi',
    href: '/experiences/upper-zambezi-sunset-cruise',
  },
  {
    title: 'Savannah Dawn Safari',
    category: 'Safari Adventures',
    image: IMAGE_ASSETS.safariWildlife,
    alt: 'Elephants grazing across Zambezi National Park grasslands',
    href: '/experiences/zambezi-national-park-private-safari',
  },
  {
    title: 'Rainforest Canopy Walk',
    category: 'Nature & Rainforest',
    image: IMAGE_ASSETS.rainforestWalk,
    alt: 'Sunbeams through Transend Tours rainforest canopy',
    href: '/experiences/guided-rainforest-falls-walk',
  },
  {
    title: 'Livingstone Island Rim',
    category: 'Guided Tours',
    image: IMAGE_ASSETS.livingstoneIsland,
    alt: 'Basalt rim overlooking Transend Tours cascade',
    href: '/experiences/livingstone-island-rim-discovery',
  },
  {
    title: 'Heritage Village Courtyard',
    category: 'Cultural Experiences',
    image: IMAGE_ASSETS.culturalVillage,
    alt: 'Traditional Zimbabwean woven crafts and earthen courtyard',
    href: '/experiences/zimbabwean-heritage-village-encounter',
  },
  {
    title: 'Mosi-oa-Tunya Horizon',
    category: 'Destination',
    image: IMAGE_ASSETS.heroFalls,
    alt: 'Transend Tours main waterfall golden hour vista',
    href: '/destinations/victoria-falls',
  },
  {
    title: 'Riverfront Sanctuary',
    category: 'Accommodation',
    image: IMAGE_ASSETS.luxuryLodge,
    alt: 'Riverfront timber lodge terrace overlooking the Zambezi',
    href: '/accommodation',
  },
  {
    title: 'Wilderness Tented Camp',
    category: 'Safaris & Stays',
    image: IMAGE_ASSETS.safariCamp,
    alt: 'Elevated canvas safari suite overlooking savannah',
    href: '/packages',
  },
];

const transition = {
  duration: 0.25,
  ease: [0.32, 0.72, 0, 1] as const,
};

const transitionOverlay = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1] as const,
};

interface CarouselProps {
  handleClick: (item: ThreeDCarouselItem) => void;
  controls: ReturnType<typeof useAnimation>;
  items: ThreeDCarouselItem[];
  isCarouselActive: boolean;
}

const Carousel = memo(
  ({ handleClick, controls, items, isCarouselActive }: CarouselProps) => {
    const isScreenSizeSm = useMediaQuery('(max-width: 640px)');
    const shouldReduceMotion = useReducedMotion();
    const draggedRef = useRef(false);

    const cylinderWidth = isScreenSizeSm ? 1850 : 2800;
    const faceCount = items.length;
    const faceWidth = cylinderWidth / faceCount;
    const radius = cylinderWidth / (2 * Math.PI);
    const rotation = useMotionValue(0);

    return (
      <div
        className="flex h-full items-center justify-center bg-transparent"
        style={{
          perspective: isScreenSizeSm ? '1200px' : '1500px',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        <motion.div
          onPanStart={() => {
            draggedRef.current = false;
            controls.stop();
          }}
          onPan={(_, info) => {
            if (!isCarouselActive) return;
            if (Math.abs(info.offset.x) > 4) {
              draggedRef.current = true;
            }
            rotation.set(rotation.get() + info.delta.x * 0.32);
          }}
          onPanEnd={(_, info) => {
            if (!isCarouselActive || shouldReduceMotion) return;
            controls.start({
              rotateY: rotation.get() + info.velocity.x * 0.045,
              transition: {
                type: 'spring',
                stiffness: 100,
                damping: 30,
                mass: 0.12,
              },
            });
          }}
          className="relative flex h-full origin-center cursor-grab justify-center active:cursor-grabbing select-none touch-pan-y"
          style={{
            rotateY: rotation,
            width: cylinderWidth,
            transformStyle: 'preserve-3d',
          }}
          animate={controls}
        >
          {items.map((item, i) => (
            <motion.div
              key={`${item.title}-${i}`}
              className="absolute flex h-full origin-center items-center justify-center p-2 sm:p-2.5"
              style={{
                width: `${faceWidth}px`,
                transform: `rotateY(${
                  i * (360 / faceCount)
                }deg) translateZ(${radius}px)`,
              }}
              onClick={() => {
                if (draggedRef.current) {
                  draggedRef.current = false;
                  return;
                }
                handleClick(item);
              }}
            >
              <motion.div
                layoutId={`carousel-frame-${item.image}-${i}`}
                className="group relative w-full overflow-hidden rounded-xl border border-[#E7E4DA] bg-[#121312] shadow-[0_18px_38px_-16px_rgba(0,0,0,0.22)] cursor-pointer"
              >
                <motion.img
                  src={item.image}
                  alt={item.alt}
                  draggable={false}
                  referrerPolicy="no-referrer"
                  className="pointer-events-none w-full rounded-xl object-cover aspect-square transition-transform duration-500 group-hover:scale-[1.04]"
                  initial={{ filter: 'blur(3px)' }}
                  animate={{ filter: 'blur(0px)' }}
                  transition={transition}
                />
                <span className="pointer-events-none absolute inset-x-2.5 bottom-2.5 px-2.5 py-1.5 rounded-lg bg-[#0D0E0E]/78 backdrop-blur-sm border border-[#FFFFFF]/15 text-[#F6F4ED] text-[10px] font-medium truncate opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
                  {item.title}
                </span>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  },
);

Carousel.displayName = 'Carousel';

interface ThreeDPhotoCarouselProps {
  items?: ThreeDCarouselItem[];
}

export function ThreeDPhotoCarousel({
  items = DEFAULT_ITEMS,
}: ThreeDPhotoCarouselProps) {
  const [activeItem, setActiveItem] = useState<ThreeDCarouselItem | null>(null);
  const [isCarouselActive, setIsCarouselActive] = useState(true);
  const controls = useAnimation();

  const stableItems = useMemo(() => items, [items]);

  const handleClick = (item: ThreeDCarouselItem) => {
    setActiveItem(item);
    setIsCarouselActive(false);
    controls.stop();
  };

  const handleClose = () => {
    setActiveItem(null);
    setIsCarouselActive(true);
  };

  useEffect(() => {
    if (!activeItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeItem]);

  return (
    <motion.div layout className="relative">
      <AnimatePresence mode="sync">
        {activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-[#0A0B0B]/88 backdrop-blur-xl flex items-center justify-center p-5 sm:p-10"
            transition={transitionOverlay}
            role="dialog"
            aria-modal="true"
            aria-label={activeItem.title}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={transitionOverlay}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full bg-[#FFFFFF] border border-[#E7E4DA] rounded-2xl overflow-hidden shadow-2xl"
            >
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close perspective preview"
                className="absolute top-3.5 right-3.5 z-10 w-10 h-10 rounded-full bg-[#0D0E0E]/75 border border-[#FFFFFF]/20 text-[#F6F4ED] hover:text-[#D9C397] flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4 stroke-[1.75]" aria-hidden="true" />
              </button>

              <div className="aspect-[16/10] w-full bg-[#121312] overflow-hidden">
                <img
                  src={activeItem.image}
                  alt={activeItem.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF]">
                <div>
                  {activeItem.category && (
                    <span className="block text-[11px] uppercase tracking-[0.18em] text-[#244B3A] font-semibold">
                      {activeItem.category}
                    </span>
                  )}
                  <h3 className="font-serif text-2xl text-[#102D25] mt-0.5">
                    {activeItem.title}
                  </h3>
                </div>

                {activeItem.href && (
                  <Link
                    to={activeItem.href}
                    onClick={handleClose}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#102D25] text-[#F6F4ED] hover:bg-[#18392F] text-xs uppercase tracking-[0.14em] font-semibold transition-colors shrink-0"
                  >
                    <span>Explore Experience</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[1.75]" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative h-[430px] sm:h-[540px] w-full overflow-hidden">
        <Carousel
          handleClick={handleClick}
          controls={controls}
          items={stableItems}
          isCarouselActive={isCarouselActive}
        />
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#788078]">
        <GripHorizontal className="w-4 h-4 text-[#244B3A]" aria-hidden="true" />
        <span>Drag horizontally across perspectives · Click any frame to inspect &amp; open</span>
      </div>
    </motion.div>
  );
}
