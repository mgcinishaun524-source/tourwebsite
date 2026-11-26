import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WorksWheelItem {
  /** Project or destination name. Shown beside the front card and in the index. */
  title: string;
  /** Cover art. Any src an <img> takes. */
  image: string;
  /** Accessible alternative text for the cover image. */
  alt?: string;
  /** Where the card links to. Omit for a wheel that only browses. */
  href?: string;
}

export interface WorksWheelProps
  extends Omit<React.ComponentPropsWithoutRef<'section'>, 'children'> {
  items: WorksWheelItem[];
  /** Sits in the middle of the ring. @default "The Zambezi" */
  label?: string;
  /** Label on the card's hover/active affordance. Omit to drop it. @default "Explore" */
  action?: string;
  /** Optional external scroll-driven turn ref (0 = ring, 1 = drum item 0 .. count = last).
      When supplied, wheel events pass straight through to Lenis/ScrollTrigger with zero conflict. */
  controlledTurnRef?: React.MutableRefObject<number>;
  /** Optional callback fired when user clicks an index item while externally scroll-driven. */
  onSelectIndex?: (index: number) => void;
}

/* Proportions tuned for commanding, gallery-scale full-viewport photography */
const CARD_H = 0.65;
const CARD_MAX_W_DESKTOP = 0.56;
const CARD_MAX_W_MOBILE = 0.88;
const CARD_RATIO = 1.48;
const STEP = 34;
const DRUM = 1.48;
const LENS = 2.35;
const RING_R = 0.58;
const BOW = 1.28;
const CULL = 1.65;

const WHEEL_UNITS = 850;
const DRAG_UNITS = 420;
const SETTLE = 140;
const EASE = 0.24;

export function computeWorksWheelCardSize(w: number, h: number) {
  const isNarrow = w > 0 && w < 768;
  const maxWRatio = isNarrow ? CARD_MAX_W_MOBILE : CARD_MAX_W_DESKTOP;
  const hRatio = isNarrow ? 0.56 : CARD_H;
  const cardW = Math.min(h * hRatio * CARD_RATIO, w * maxWRatio);
  const cardH = cardW / CARD_RATIO;
  return { cardW, cardH };
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Stage = { w: number; h: number };

const rad = (deg: number) => (deg * Math.PI) / 180;

const bowAt = (drumDeg: number, bow: number) =>
  -bow * (1 - Math.cos(rad(drumDeg)));

function place(
  ringDeg: number,
  drumDeg: number,
  ringR: number,
  drumR: number,
  bow: number,
  m: number,
) {
  return (
    `translateX(${m * bowAt(drumDeg, bow)}px)` +
    ` rotateZ(${(1 - m) * ringDeg}deg) translateY(${-(1 - m) * ringR}px)` +
    ` rotateX(${m * drumDeg}deg) translateZ(${m * drumR}px)`
  );
}

export function WorksWheel({
  items,
  label = 'The Zambezi',
  action = 'Explore',
  controlledTurnRef,
  onSelectIndex,
  className,
  ...props
}: WorksWheelProps) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const wheelRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLElement | null)[]>([]);
  const labelRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLDivElement>(null);

  const turn = React.useRef(0);
  const target = React.useRef(0);
  const [active, setActive] = React.useState(0);
  const [stage, setStage] = React.useState<Stage>({ w: 0, h: 0 });

  const count = items.length;
  const last = Math.max(count - 1, 0);

  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const read = () => setReduced(query.matches);
    read();
    query.addEventListener('change', read);
    return () => query.removeEventListener('change', read);
  }, []);

  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const read = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const metrics = React.useMemo(() => {
    const { w, h } = stage;
    const { cardW, cardH } = computeWorksWheelCardSize(w, h);
    const drumR = cardH * DRUM;
    const ringR = cardH * RING_R;
    const ringScale = count
      ? clamp((((2 * Math.PI * ringR) / count) * 0.92) / (cardW || 1), 0.34, 1)
      : 1;
    return {
      cardW,
      cardH,
      ringR,
      ringScale,
      drumR,
      bow: cardH * BOW,
      depth: cardH * LENS,
      title: clamp(cardH * 0.092, 24, 48),
      index: clamp(cardH * 0.032, 12, 15),
    };
  }, [stage, count]);

  React.useEffect(() => {
    if (!stage.h) return;
    let frame = 0;
    const { ringR, ringScale, drumR, bow } = metrics;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      if (controlledTurnRef) {
        target.current = controlledTurnRef.current;
      }

      const gap = target.current - turn.current;
      if (Math.abs(gap) < 0.0005) turn.current = target.current;
      else turn.current += gap * (reduced ? 1 : EASE);

      const t = turn.current;
      const m = clamp(t, 0, 1);
      const pos = Math.max(0, t - 1);

      if (wheelRef.current) {
        wheelRef.current.style.transform = `translateZ(${-m * drumR}px)`;
      }

      for (let i = 0; i < count; i++) {
        const d = i - pos;
        const drumDeg = d * STEP;
        const card = cardRefs.current[i];
        if (card) {
          card.style.transform = place(
            d * (360 / count),
            drumDeg,
            ringR,
            drumR,
            bow,
            m,
          );
          card.style.opacity = m > 0.5 && Math.abs(d) > CULL ? '0' : '1';
          card.style.zIndex = String(Math.round(100 - Math.abs(d) * 2));
        }
        const face = card?.firstElementChild as HTMLElement | null;
        if (face) face.style.transform = `scale(${lerp(ringScale, 1, m)})`;
      }

      if (labelRef.current) labelRef.current.style.opacity = String(1 - m);
      if (titleRef.current) titleRef.current.style.opacity = String(m);
      const near = clamp(Math.round(pos), 0, last);
      setActive((prev) => (prev === near ? prev : near));
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [metrics, stage.h, count, last, reduced, controlledTurnRef]);

  const to = React.useCallback(
    (next: number) => {
      target.current = clamp(next, 0, last + 1);
    },
    [last],
  );

  // Only intercept wheel when running in standalone interactive mode (uncontrolled)
  React.useEffect(() => {
    if (controlledTurnRef) return;
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      const next = target.current + event.deltaY / WHEEL_UNITS;
      if (next > 0 && next < last + 1) {
        event.preventDefault();
        event.stopPropagation();
      }
      to(next);
      window.clearTimeout(settling.current);
      settling.current = window.setTimeout(
        () => to(Math.round(target.current)),
        SETTLE,
      );
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      window.clearTimeout(settling.current);
    };
  }, [to, last, controlledTurnRef]);

  const drag = React.useRef<number | null>(null);
  const settling = React.useRef(0);

  return (
    <section
      aria-label={label}
      className={cn(
        'bg-background text-foreground relative h-full w-full overflow-hidden select-none',
        className,
      )}
      {...props}
    >
      <div
        ref={stageRef}
        tabIndex={0}
        role="listbox"
        aria-label={label}
        aria-activedescendant={`works-wheel-${active}`}
        className="focus-visible:outline-foreground absolute inset-0 cursor-grab touch-pan-y outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 active:cursor-grabbing"
        style={{ perspective: `${metrics.depth}px` }}
        onPointerDown={
          controlledTurnRef
            ? undefined
            : (event) => {
                drag.current = event.clientY;
                event.currentTarget.setPointerCapture(event.pointerId);
              }
        }
        onPointerMove={
          controlledTurnRef
            ? undefined
            : (event) => {
                if (drag.current === null) return;
                to(target.current + (drag.current - event.clientY) / DRAG_UNITS);
                drag.current = event.clientY;
              }
        }
        onPointerUp={
          controlledTurnRef
            ? undefined
            : () => {
                drag.current = null;
                if (target.current > 1) to(Math.round(target.current));
              }
        }
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            if (onSelectIndex) onSelectIndex(clamp(active + 1, 0, last));
            else to(Math.round(target.current) + 1);
          } else if (event.key === 'ArrowUp') {
            if (onSelectIndex) onSelectIndex(clamp(active - 1, 0, last));
            else to(Math.round(target.current) - 1);
          } else {
            return;
          }
          event.preventDefault();
        }}
      >
        <div
          ref={wheelRef}
          className="absolute top-1/2 lg:top-[53%] left-1/2 [transform-style:preserve-3d]"
        >
          {items.map((item, i) => {
            const isInternal = Boolean(item.href && item.href.startsWith('/'));
            const isFront = i === active;
            const cardInner = (
              <span className="bg-muted shadow-foreground/15 relative block size-full overflow-hidden rounded-xl border border-[#FFFFFF]/20 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.65)]">
                <img
                  src={item.image}
                  alt={item.alt || item.title}
                  loading="eager"
                  draggable={false}
                  referrerPolicy="no-referrer"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                {action && item.href ? (
                  <span
                    className={cn(
                      'bg-[#0D0E0E]/78 text-[#F6F4ED] border border-[#FFFFFF]/20 pointer-events-none absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium backdrop-blur-md transition-all duration-200',
                      isFront
                        ? 'opacity-95 translate-y-0 group-hover:bg-[#D9C397] group-hover:text-[#102D25]'
                        : 'opacity-0 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100',
                    )}
                  >
                    <ArrowUpRight className="size-3.5 stroke-[1.75]" aria-hidden="true" />
                    {action}
                  </span>
                ) : null}
              </span>
            );

            const commonProps = {
              id: `works-wheel-${i}`,
              role: 'option',
              'aria-selected': isFront,
              className: 'group absolute [backface-visibility:hidden]',
              style: {
                width: metrics.cardW,
                height: metrics.cardH,
                marginLeft: -metrics.cardW / 2,
                marginTop: -metrics.cardH / 2,
              },
            } as const;

            if (isInternal && item.href) {
              return (
                <Link
                  key={item.title}
                  to={item.href}
                  ref={(node) => {
                    cardRefs.current[i] = node;
                  }}
                  {...commonProps}
                >
                  {cardInner}
                </Link>
              );
            }

            if (item.href) {
              return (
                <a
                  key={item.title}
                  href={item.href}
                  ref={(node) => {
                    cardRefs.current[i] = node;
                  }}
                  {...commonProps}
                >
                  {cardInner}
                </a>
              );
            }

            return (
              <div
                key={item.title}
                ref={(node) => {
                  cardRefs.current[i] = node;
                }}
                {...commonProps}
              >
                {cardInner}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ring center label */}
      <div
        ref={labelRef}
        className="pointer-events-none absolute inset-0 grid place-items-center font-logo font-normal tracking-[0.02em] text-center px-6"
        style={{ fontSize: metrics.title }}
      >
        {label}
      </div>

      {/* Front-card large editorial title */}
      <div
        ref={titleRef}
        className="pointer-events-none absolute bottom-7 left-6 sm:left-8 lg:top-[53%] lg:bottom-auto lg:left-7 xl:left-10 lg:-translate-y-1/2 font-logo font-normal tracking-[0.02em] opacity-0 max-w-[46vw] lg:max-w-[18vw] leading-[1.06]"
        style={{ fontSize: metrics.title }}
      >
        <span className="block text-[11px] uppercase tracking-[0.22em] text-[#D9C397] mb-2 font-sans">
          0{active + 1} / 0{count}
        </span>
        {items[active]?.title}
      </div>

      {/* Interactive right-hand index */}
      <ol
        className="text-muted-foreground absolute bottom-7 right-6 sm:right-8 lg:top-[53%] lg:bottom-auto lg:-translate-y-1/2 text-right leading-[1.9] z-20"
        style={{ fontSize: metrics.index }}
      >
        {items.map((item, i) => (
          <li key={item.title}>
            <button
              type="button"
              onClick={() => {
                if (onSelectIndex) onSelectIndex(i);
                else to(i + 1);
              }}
              className={cn(
                'focus-visible:outline-foreground cursor-pointer transition-colors outline-none focus-visible:outline-1 hover:text-[#F6F4ED] px-1',
                i === active && 'text-[#D9C397] font-semibold',
              )}
            >
              {item.title}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default WorksWheel;
