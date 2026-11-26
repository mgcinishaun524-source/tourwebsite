import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

const PLACEHOLDER_REFLECTIONS = [
  {
    index: '01',
    slot: 'Verified Guest Reflection Slot 01',
    quote:
      '[Client-supplied guest reflection placeholder — reserved for verified post-travel correspondence following your inaugural Transend Tours journeys.]',
    attribution: '[Guest Name & Origin Placeholder]',
    journey: '[Itinerary Title Placeholder]',
  },
  {
    index: '02',
    slot: 'Verified Guest Reflection Slot 02',
    quote:
      '[Client-supplied guest reflection placeholder — reserved for authenticated family or private group feedback once operations commence.]',
    attribution: '[Guest Name & Origin Placeholder]',
    journey: '[Itinerary Title Placeholder]',
  },
  {
    index: '03',
    slot: 'Verified Guest Reflection Slot 03',
    quote:
      '[Client-supplied guest reflection placeholder — reserved for verified safari and Zambezi river experience testimonials.]',
    attribution: '[Guest Name & Origin Placeholder]',
    journey: '[Itinerary Title Placeholder]',
  },
];

export function TestimonialSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const active = PLACEHOLDER_REFLECTIONS[activeIndex];

  return (
    <section
      aria-label="Guest Correspondence"
      className="py-20 lg:py-28 bg-[#F6F4ED] border-t border-[#E7E4DA]"
    >
      <div className="mx-auto max-w-[1380px] px-6 sm:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Ledger Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <span className="block text-xs uppercase tracking-[0.22em] text-[#244B3A] font-medium mb-3">
                Guest Correspondence
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#102D25] leading-tight">
                Reflections from the River &amp; Gorge
              </h2>
              <p className="mt-3 text-sm text-[#788078] leading-relaxed">
                Dedicated editorial reader prepared for verified guest correspondence. No fabricated reviews or ratings are displayed.
              </p>
            </div>

            <div className="divide-y divide-[#E7E4DA] border-y border-[#E7E4DA]" role="tablist" aria-label="Guest reflection slots">
              {PLACEHOLDER_REFLECTIONS.map((item, idx) => {
                const selected = idx === activeIndex;
                return (
                  <button
                    key={item.index}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveIndex(idx)}
                    className={`w-full py-3.5 flex items-center justify-between gap-4 text-left transition-colors cursor-pointer ${
                      selected ? 'text-[#102D25]' : 'text-[#788078] hover:text-[#102D25]'
                    }`}
                  >
                    <span className="text-xs uppercase tracking-[0.16em] font-medium">
                      {item.index} · Correspondence Slot
                    </span>
                    <span
                      className={`h-px transition-all duration-300 ${
                        selected ? 'w-10 bg-[#102D25]' : 'w-4 bg-[#E7E4DA]'
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Monumental Single-Folio Reader */}
          <div className="lg:col-span-8 lg:pl-10 lg:border-l border-[#E7E4DA]">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={active.index}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[#244B3A] font-medium">
                  <span>{active.slot}</span>
                  <span className="tabular-nums text-[#788078]">
                    {active.index} / 0{PLACEHOLDER_REFLECTIONS.length}
                  </span>
                </div>

                <p className="font-serif italic text-2xl sm:text-3xl lg:text-[2.1rem] text-[#102D25] leading-[1.38] tracking-tight">
                  “{active.quote}”
                </p>

                <footer className="pt-6 border-t border-[#E7E4DA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-[#102D25] uppercase tracking-[0.14em]">
                    {active.attribution}
                  </span>
                  <span className="text-[#788078]">{active.journey}</span>
                </footer>
              </motion.blockquote>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
