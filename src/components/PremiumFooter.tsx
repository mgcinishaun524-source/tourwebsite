import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brand';
import { NewsletterForm } from './NewsletterForm';
import { WhatsAppButton } from './WhatsAppButton';

export function PremiumFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#102D25] text-[#F6F4ED] border-t border-[#FFFFFF]/10">
      <div className="mx-auto max-w-[1380px] px-6 sm:px-10 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-14 border-b border-[#FFFFFF]/12">
          <div className="lg:col-span-4 space-y-5">
            <Link
              to="/"
              className="inline-block font-logo text-2xl sm:text-3xl tracking-[0.03em] leading-none text-[#F6F4ED] hover:text-[#D9C397] transition-colors"
            >
              {BRAND_CONFIG.brandName}
            </Link>
            <p className="text-sm text-[#D9C397] tracking-wide font-serif italic">
              {BRAND_CONFIG.tagline}
            </p>
            <p className="text-sm text-[#F6F4ED]/75 leading-relaxed max-w-sm">
              {BRAND_CONFIG.heroIntro}
            </p>
            <div className="pt-2">
              <WhatsAppButton variant="glass" />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-lg tracking-[0.02em] text-[#D9C397] font-normal mb-4">
              Explore
            </h3>
            <ul className="space-y-2.5 text-sm text-[#F6F4ED]/80">
              <li>
                <Link to="/experiences" className="hover:text-[#D9C397] transition-colors">
                  Experiences
                </Link>
              </li>
              <li>
                <Link to="/packages" className="hover:text-[#D9C397] transition-colors">
                  Travel Packages
                </Link>
              </li>
              <li>
                <Link to="/destinations" className="hover:text-[#D9C397] transition-colors">
                  Destinations
                </Link>
              </li>
              <li>
                <Link to="/accommodation" className="hover:text-[#D9C397] transition-colors">
                  Accommodation
                </Link>
              </li>
              <li>
                <Link to="/transport" className="hover:text-[#D9C397] transition-colors">
                  Transport & Transfers
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-lg tracking-[0.02em] text-[#D9C397] font-normal mb-4">
              Portals &amp; Desk
            </h3>
            <ul className="space-y-2.5 text-sm text-[#F6F4ED]/80">
              <li>
                <Link to="/checkout" className="hover:text-[#D9C397] transition-colors">
                  Live Checkout
                </Link>
              </li>
              <li>
                <Link to="/portal/customer" className="hover:text-[#D9C397] transition-colors">
                  Traveller Portal
                </Link>
              </li>
              <li>
                <Link to="/portal/supplier" className="hover:text-[#D9C397] transition-colors">
                  Supplier Portal
                </Link>
              </li>
              <li>
                <Link to="/portal/admin" className="hover:text-[#D9C397] transition-colors">
                  Admin &amp; Finance
                </Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-[#D9C397] transition-colors">
                  Bespoke Trip Brief
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#D9C397] transition-colors">
                  Contact &amp; FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div>
              <h3 className="text-lg tracking-[0.02em] text-[#D9C397] font-normal mb-3">
                Seasonal Dispatches
              </h3>
              <p className="text-sm text-[#F6F4ED]/75 mb-4 leading-relaxed">
                Receive water-level notes, safari seasonal guidance, and curated itinerary inspiration.
              </p>
              <NewsletterForm theme="dark" />
            </div>

            <div className="space-y-2 pt-2 text-xs text-[#F6F4ED]/75">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-[#D9C397] shrink-0 mt-0.5 stroke-[1.5]" aria-hidden="true" />
                <span>{BRAND_CONFIG.location.addressPlaceholder}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-[#D9C397] shrink-0 stroke-[1.5]" aria-hidden="true" />
                <span>{BRAND_CONFIG.contact.emailPlaceholder}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-[#D9C397] shrink-0 stroke-[1.5]" aria-hidden="true" />
                <span>{BRAND_CONFIG.contact.phonePlaceholder}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-[#F6F4ED]/60">
          <div className="space-y-1 max-w-3xl">
            <p>
              © {year} {BRAND_CONFIG.legalEntityName} · Public Brand: {BRAND_CONFIG.brandName}.
            </p>
            <p className="text-[11px] text-[#F6F4ED]/50 leading-relaxed">
              {BRAND_CONFIG.disclaimer}
            </p>
          </div>
          <div className="flex items-center gap-5 shrink-0">
            {BRAND_CONFIG.social.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="hover:text-[#D9C397] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
