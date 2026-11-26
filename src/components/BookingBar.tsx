import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Compass,
  MapPin,
  Users,
  ArrowRight,
  ChevronDown,
  Check,
  Minus,
  Plus,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { DESTINATIONS_QUICK_LIST, EXPERIENCE_CATEGORIES } from '../data/siteData';

interface BookingBarProps {
  variant?: 'hero' | 'section';
}

type OpenMenu = 'destination' | 'interest' | 'travellers' | null;

export function BookingBar({ variant = 'hero' }: BookingBarProps) {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLFormElement>(null);

  const [destination, setDestination] = useState(DESTINATIONS_QUICK_LIST[0].slug);
  const [interest, setInterest] = useState<string>('Guided Tours');
  const [preferredDate, setPreferredDate] = useState('');
  const [travellersCount, setTravellersCount] = useState<number>(2);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const selectedDestinationName =
    DESTINATIONS_QUICK_LIST.find((d) => d.slug === destination)?.name ||
    DESTINATIONS_QUICK_LIST[0].name;

  const experienceOptions = [...EXPERIENCE_CATEGORIES, 'Full Curated Package'];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setOpenMenu(null);
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (interest) params.set('interest', interest);
    if (preferredDate) params.set('date', preferredDate);
    params.set('travellers', travellersCount >= 8 ? '8+' : String(travellersCount));
    navigate(`/book?${params.toString()}`);
  };

  const popoverPosition =
    variant === 'hero'
      ? 'lg:bottom-full lg:top-auto lg:mb-3 top-full mt-2'
      : 'top-full mt-2';

  const popoverAnimation = shouldReduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: variant === 'hero' ? 6 : -6, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: variant === 'hero' ? 4 : -4, scale: 0.98 },
      };

  return (
    <form
      ref={containerRef}
      onSubmit={handleSubmit}
      aria-label="Trip Enquiry Builder"
      className={`relative z-30 w-full rounded-2xl p-4 sm:p-5 lg:p-5 ${
        variant === 'hero' ? 'glass-light text-[#102D25]' : 'glass-ivory text-[#102D25]'
      }`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-3.5 items-end">
        {/* Destination Liquid Popover */}
        <div className="relative lg:col-span-3 flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] font-semibold text-[#244B3A] px-1">
            <MapPin className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
            <span>Destination</span>
          </span>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={openMenu === 'destination'}
            onClick={() =>
              setOpenMenu((prev) => (prev === 'destination' ? null : 'destination'))
            }
            className={`w-full h-11 px-3.5 bg-[#FFFFFF]/82 hover:bg-[#FFFFFF] border rounded-xl text-sm text-[#102D25] flex items-center justify-between gap-2 text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102D25]/30 ${
              openMenu === 'destination' ? 'border-[#102D25] bg-[#FFFFFF]' : 'border-[#E7E4DA]'
            }`}
          >
            <span className="truncate font-medium">{selectedDestinationName}</span>
            <ChevronDown
              className={`w-4 h-4 text-[#244B3A] shrink-0 transition-transform duration-200 ${
                openMenu === 'destination' ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          <AnimatePresence>
            {openMenu === 'destination' && (
              <motion.div
                {...popoverAnimation}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                role="listbox"
                aria-label="Select destination"
                className={`absolute left-0 right-0 z-50 ${popoverPosition} bg-[#F6F4ED]/95 backdrop-blur-2xl border border-[#FFFFFF]/85 shadow-[0_24px_48px_-14px_rgba(16,45,37,0.28)] rounded-2xl p-1.5 max-h-64 overflow-y-auto`}
              >
                {DESTINATIONS_QUICK_LIST.map((dest) => {
                  const active = dest.slug === destination;
                  return (
                    <button
                      key={dest.slug}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        setDestination(dest.slug);
                        setOpenMenu(null);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl text-left text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#102D25] text-[#F6F4ED] font-medium'
                          : 'text-[#102D25] hover:bg-[#102D25]/8'
                      }`}
                    >
                      <span className="truncate">{dest.name}</span>
                      {active && <Check className="w-3.5 h-3.5 text-[#D9C397] shrink-0" aria-hidden="true" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Experience Focus Liquid Popover */}
        <div className="relative lg:col-span-3 flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] font-semibold text-[#244B3A] px-1">
            <Compass className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
            <span>Experience Focus</span>
          </span>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={openMenu === 'interest'}
            onClick={() =>
              setOpenMenu((prev) => (prev === 'interest' ? null : 'interest'))
            }
            className={`w-full h-11 px-3.5 bg-[#FFFFFF]/82 hover:bg-[#FFFFFF] border rounded-xl text-sm text-[#102D25] flex items-center justify-between gap-2 text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102D25]/30 ${
              openMenu === 'interest' ? 'border-[#102D25] bg-[#FFFFFF]' : 'border-[#E7E4DA]'
            }`}
          >
            <span className="truncate font-medium">{interest}</span>
            <ChevronDown
              className={`w-4 h-4 text-[#244B3A] shrink-0 transition-transform duration-200 ${
                openMenu === 'interest' ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          <AnimatePresence>
            {openMenu === 'interest' && (
              <motion.div
                {...popoverAnimation}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                role="listbox"
                aria-label="Select experience focus"
                className={`absolute left-0 right-0 z-50 ${popoverPosition} bg-[#F6F4ED]/95 backdrop-blur-2xl border border-[#FFFFFF]/85 shadow-[0_24px_48px_-14px_rgba(16,45,37,0.28)] rounded-2xl p-1.5 max-h-64 overflow-y-auto`}
              >
                {experienceOptions.map((cat) => {
                  const active = cat === interest;
                  return (
                    <button
                      key={cat}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        setInterest(cat);
                        setOpenMenu(null);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl text-left text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#102D25] text-[#F6F4ED] font-medium'
                          : 'text-[#102D25] hover:bg-[#102D25]/8'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      {active && <Check className="w-3.5 h-3.5 text-[#D9C397] shrink-0" aria-hidden="true" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preferred Date */}
        <div className="lg:col-span-2 flex flex-col gap-1.5">
          <label
            htmlFor="booking-date"
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] font-semibold text-[#244B3A] px-1"
          >
            <Calendar className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
            <span>Preferred Date</span>
          </label>
          <input
            id="booking-date"
            type="date"
            value={preferredDate}
            onFocus={() => setOpenMenu(null)}
            onChange={(e) => setPreferredDate(e.target.value)}
            className="w-full h-11 px-3.5 bg-[#FFFFFF]/82 hover:bg-[#FFFFFF] border border-[#E7E4DA] rounded-xl text-sm text-[#102D25] font-medium transition-colors focus:outline-none focus:border-[#102D25] focus:bg-[#FFFFFF]"
          />
        </div>

        {/* Travellers Stepper Popover */}
        <div className="relative lg:col-span-2 flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] font-semibold text-[#244B3A] px-1">
            <Users className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
            <span>Travellers</span>
          </span>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={openMenu === 'travellers'}
            onClick={() =>
              setOpenMenu((prev) => (prev === 'travellers' ? null : 'travellers'))
            }
            className={`w-full h-11 px-3.5 bg-[#FFFFFF]/82 hover:bg-[#FFFFFF] border rounded-xl text-sm text-[#102D25] flex items-center justify-between gap-2 text-left tabular-nums transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102D25]/30 ${
              openMenu === 'travellers' ? 'border-[#102D25] bg-[#FFFFFF]' : 'border-[#E7E4DA]'
            }`}
          >
            <span className="font-medium truncate">
              {travellersCount >= 8 ? '8+' : travellersCount}{' '}
              {travellersCount === 1 ? 'Traveller' : 'Travellers'}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[#244B3A] shrink-0 transition-transform duration-200 ${
                openMenu === 'travellers' ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          <AnimatePresence>
            {openMenu === 'travellers' && (
              <motion.div
                {...popoverAnimation}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className={`absolute left-0 right-0 sm:min-w-[220px] z-50 ${popoverPosition} bg-[#F6F4ED]/95 backdrop-blur-2xl border border-[#FFFFFF]/85 shadow-[0_24px_48px_-14px_rgba(16,45,37,0.28)] rounded-2xl p-4 space-y-3`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#102D25]">Party Size</p>
                    <p className="text-[11px] text-[#788078]">Select total guests</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Decrease travellers"
                      onClick={() => setTravellersCount((c) => Math.max(1, c - 1))}
                      disabled={travellersCount <= 1}
                      className="w-8 h-8 rounded-full border border-[#E7E4DA] bg-[#FFFFFF] text-[#102D25] flex items-center justify-center hover:border-[#102D25] active:scale-[0.95] disabled:opacity-40 cursor-pointer transition-all"
                    >
                      <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold text-[#102D25] tabular-nums">
                      {travellersCount >= 8 ? '8+' : travellersCount}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase travellers"
                      onClick={() => setTravellersCount((c) => Math.min(8, c + 1))}
                      disabled={travellersCount >= 8}
                      className="w-8 h-8 rounded-full border border-[#E7E4DA] bg-[#FFFFFF] text-[#102D25] flex items-center justify-center hover:border-[#102D25] active:scale-[0.95] disabled:opacity-40 cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenMenu(null)}
                  className="w-full py-2 rounded-xl bg-[#102D25] text-[#F6F4ED] text-xs font-medium cursor-pointer hover:bg-[#18392F] transition-colors"
                >
                  Apply
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit CTA */}
        <div className="sm:col-span-2 lg:col-span-2">
          <button
            type="submit"
            className="group w-full h-11 px-5 bg-[#102D25] text-[#F6F4ED] hover:bg-[#18392F] border border-[#102D25] hover:border-[#D9C397]/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_24px_-10px_rgba(16,45,37,0.45)] rounded-xl text-sm font-medium tracking-wide inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[1px] active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9C397]"
          >
            <span>Begin Enquiry</span>
            <ArrowRight
              className="w-4 h-4 stroke-[1.5] transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </form>
  );
}
