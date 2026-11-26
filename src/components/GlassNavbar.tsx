import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { BRAND_CONFIG } from '../config/brand';
import { GlassButton } from './GlassButton';
import { MobileNavigation } from './MobileNavigation';

const DISCOVER_SUBLINKS = [
  { label: 'About Us', to: '/about', description: 'Our philosophy, values & destination approach' },
  { label: 'Transport & Transfers', to: '/transport', description: 'Airport meet-and-greet, private 4x4 & chauffeur mobility' },
  { label: 'Live Checkout & Split Pay', to: '/checkout', description: 'Reserve verified slots & pay securely via Pesepay split checkout' },
  { label: 'Traveller Portal', to: '/portal/customer', description: 'Manage bookings, payment receipts, cancellations & refunds' },
  { label: 'Supplier Portal', to: '/portal/supplier', description: 'Onboarding, KYC documents, inventory & settlement tracker' },
  { label: 'Admin & Finance Desk', to: '/portal/admin', description: 'RBAC governance, approvals, ledger & reconciliation' },
];

const PRIMARY_LINKS = [
  { label: 'Safari Operators', to: '/operators' },
  { label: 'Experiences', to: '/experiences' },
  { label: 'Packages', to: '/packages' },
  { label: 'Destinations', to: '/destinations' },
  { label: 'Accommodation', to: '/accommodation' },
  { label: 'Journal', to: '/journal' },
  { label: 'Contact', to: '/contact' },
];

export function GlassNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 36);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setDiscoverOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDiscoverOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDiscoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const isDiscoverActive =
    location.pathname === '/about' ||
    location.pathname === '/transport' ||
    location.pathname.startsWith('/portal') ||
    location.pathname === '/checkout';

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          scrolled ? 'py-2.5 px-4 sm:px-6 lg:px-8' : 'py-4 px-4 sm:px-8 lg:px-10'
        }`}
      >
        <div
          className={`mx-auto max-w-[1380px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center justify-between gap-4 lg:gap-8 ${
            scrolled
              ? 'glass-forest rounded-2xl xl:rounded-full px-5 sm:px-6 py-2.5 text-[#F6F4ED]'
              : 'glass-nav rounded-2xl xl:rounded-full px-5 sm:px-7 py-3 text-[#F6F4ED]'
          }`}
        >
          {/* Zone 1: Single-element Brand Wordmark */}
          <Link
            to="/"
            className="font-logo text-xl sm:text-2xl tracking-[0.03em] leading-none text-[#F6F4ED] hover:text-[#D9C397] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9C397] rounded-full px-1.5 py-0.5"
          >
            {BRAND_CONFIG.brandName}
          </Link>

          {/* Zone 2: Primary Desktop Navigation */}
          <nav
            aria-label="Primary Navigation"
            className="hidden xl:flex items-center gap-2 text-[13px] font-medium tracking-wide"
          >
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setDiscoverOpen((prev) => !prev)}
                aria-expanded={discoverOpen}
                aria-haspopup="true"
                className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9C397] ${
                  isDiscoverActive || discoverOpen
                    ? 'text-[#D9C397] bg-[#FFFFFF]/10'
                    : 'text-[#F6F4ED]/90 hover:text-[#F6F4ED] hover:bg-[#FFFFFF]/8'
                }`}
              >
                <span>Discover</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    discoverOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              <AnimatePresence>
                {discoverOpen && (
                  <motion.div
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 top-full mt-3 w-80 glass-forest rounded-2xl p-2 origin-top-left"
                  >
                    {DISCOVER_SUBLINKS.map((item) => {
                      const active = location.pathname === item.to;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`block px-4 py-3 rounded-xl transition-colors ${
                            active
                              ? 'bg-[#FFFFFF]/14 text-[#D9C397]'
                              : 'text-[#F6F4ED] hover:bg-[#FFFFFF]/10'
                          }`}
                        >
                          <span className="block text-sm font-medium">{item.label}</span>
                          <span className="block text-xs text-[#F6F4ED]/70 mt-0.5 leading-snug">
                            {item.description}
                          </span>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {PRIMARY_LINKS.map((link) => {
              const active =
                location.pathname === link.to ||
                (link.to !== '/' && location.pathname.startsWith(`${link.to}/`));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative px-3.5 py-2 rounded-full whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9C397] ${
                    active
                      ? 'text-[#D9C397]'
                      : 'text-[#F6F4ED]/88 hover:text-[#F6F4ED]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId={shouldReduceMotion ? undefined : 'nav-active-pill'}
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-full bg-[#FFFFFF]/12 border border-[#FFFFFF]/15"
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Sign In + Single Primary Action & Mobile Toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/auth"
              className="hidden sm:inline-flex items-center px-3.5 py-2 rounded-full text-xs uppercase tracking-[0.12em] text-[#F6F4ED]/90 hover:text-[#D9C397] hover:bg-[#FFFFFF]/8 transition-colors whitespace-nowrap"
            >
              Sign In
            </Link>
            <div className="hidden sm:block">
              <GlassButton
                to="/checkout"
                variant="ivory"
                className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em]"
              >
                Book Now
              </GlassButton>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="xl:hidden inline-flex items-center justify-center w-10 h-10 rounded-full text-[#F6F4ED] hover:bg-[#FFFFFF]/12 active:scale-[0.96] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9C397]"
            >
              <Menu className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <MobileNavigation open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
