import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { BRAND_CONFIG } from '../config/brand';
import { pauseLenis, resumeLenis } from '../motion/gsapConfig';
import { GlassButton } from './GlassButton';

interface MobileNavigationProps {
  open: boolean;
  onClose: () => void;
}

const MOBILE_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Experiences', to: '/experiences' },
  { label: 'Travel Packages', to: '/packages' },
  { label: 'Destinations', to: '/destinations' },
  { label: 'Accommodation', to: '/accommodation' },
  { label: 'Transport & Transfers', to: '/transport' },
  { label: 'Live Checkout', to: '/checkout' },
  { label: 'Traveller Portal', to: '/portal/customer' },
  { label: 'Supplier Portal', to: '/portal/supplier' },
  { label: 'Admin & Finance Desk', to: '/portal/admin' },
  { label: 'Sign In & Security', to: '/auth' },
];

export function MobileNavigation({ open, onClose }: MobileNavigationProps) {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      pauseLenis();
    } else {
      document.body.style.overflow = '';
      resumeLenis();
    }
    return () => {
      document.body.style.overflow = '';
      resumeLenis();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 bg-[#0D0F0E]/95 backdrop-blur-2xl flex flex-col justify-between p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          <div className="flex items-center justify-between border-b border-[#FFFFFF]/12 pb-4">
            <Link
              to="/"
              onClick={onClose}
              className="font-logo text-2xl tracking-[0.03em] leading-none text-[#F6F4ED] whitespace-nowrap"
            >
              {BRAND_CONFIG.brandName}
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="w-11 h-11 rounded-full glass-forest-subtle inline-flex items-center justify-center text-[#F6F4ED] hover:text-[#D9C397] active:scale-[0.95] transition-all cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Mobile Menu" className="my-6 flex flex-col gap-1.5">
            {MOBILE_LINKS.map((item, idx) => {
              const active =
                location.pathname === item.to ||
                (item.to !== '/' && location.pathname.startsWith(`${item.to}/`));
              return (
                <motion.div
                  key={item.to}
                  initial={shouldReduceMotion ? undefined : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.26,
                    delay: shouldReduceMotion ? 0 : idx * 0.025,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    to={item.to}
                    onClick={onClose}
                    className={`flex items-center justify-between px-4 py-3.5 min-h-[48px] rounded-xl font-logo text-2xl sm:text-3xl tracking-[0.02em] transition-colors ${
                      active
                        ? 'bg-[#FFFFFF]/12 text-[#D9C397] border border-[#D9C397]/25'
                        : 'text-[#F6F4ED] hover:bg-[#FFFFFF]/8 hover:text-[#D9C397]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-4 h-4 opacity-60 stroke-[1.5]" aria-hidden="true" />
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <div className="pt-5 border-t border-[#FFFFFF]/12 space-y-4">
            <GlassButton to="/checkout" variant="ivory" className="w-full py-3.5">
              Live Checkout &amp; Reserve
            </GlassButton>
            <p className="text-xs text-[#F6F4ED]/65 text-center leading-relaxed">
              {BRAND_CONFIG.legalEntityName} · {BRAND_CONFIG.location.city}, {BRAND_CONFIG.location.country}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
