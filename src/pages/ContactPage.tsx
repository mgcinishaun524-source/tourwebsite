import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { BRAND_CONFIG } from '../config/brand';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EditorialSectionHeader } from '../components/EditorialSectionHeader';
import { EnquiryForm } from '../components/EnquiryForm';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { SplitTextReveal } from '../components/motion/SplitTextReveal';

const FAQS = [
  {
    q: 'Are rates and availability confirmed automatically when I submit an enquiry?',
    a: 'No. Submitting an enquiry through this website initiates a personal itinerary consultation. Availability, lodge allocations, and seasonal pricing are verified directly with suppliers before any booking confirmation is issued.',
  },
  {
    q: 'Can you customise packages around specific arrival dates or family group sizes?',
    a: 'Yes. Every published package serves as a flexible sample framework and can be adjusted for solo travellers, couples, private families, or small groups.',
  },
  {
    q: 'When is the best season to visit Transend Tours?',
    a: 'Transend Tours journeys are rewarding year-round. High-water months (typically February to May) deliver dramatic spray and full-width thunder, whereas lower-water months (August to November) offer clearest views of the rock face and seasonal gorge activities.',
  },
  {
    q: 'Where will final contact details and company registration information appear?',
    a: 'All contact channels, legal company details, and office addresses are centralised in our site configuration and marked clearly as placeholders until supplied by the client.',
  },
];

export function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div>
      {/* Minimal Architectural Ivory Opening (Distinct from dark photo heroes) */}
      <section className="pt-36 pb-14 lg:pt-44 lg:pb-20 bg-[#F6F4ED] text-[#102D25] border-b border-[#E7E4DA]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-6">
          <Breadcrumbs theme="light" items={[{ label: 'Contact' }]} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7 space-y-4">
              <span className="block text-xs uppercase tracking-[0.22em] text-[#244B3A] font-semibold">
                Transend Tours Desk · Direct Correspondence
              </span>
              <SplitTextReveal
                as="h1"
                mode="words"
                trigger="mount"
                text="Begin a Conversation"
                className="font-serif text-4xl sm:text-6xl lg:text-[4.25rem] font-normal leading-[1.06]"
              />
            </div>
            <div className="lg:col-span-5">
              <p className="text-sm sm:text-base text-[#788078] leading-relaxed">
                Reach out with dates, itinerary questions, or transport requests. All contact lines below are configurable placeholders ready for final business activation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Channels Ledger + Direct Form */}
      <section className="py-16 lg:py-24 bg-[#FFFFFF]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5 space-y-8">
            <EditorialSectionHeader
              eyebrow="Configurable Channels"
              title="Transend Tours Desk"
              subtitle="Direct channels are stored in centralized brand configuration constants."
            />

            <div className="divide-y divide-[#E7E4DA] border-y border-[#E7E4DA] text-sm">
              <div className="py-4 flex items-start gap-3.5">
                <Mail className="w-4 h-4 text-[#244B3A] shrink-0 mt-1 stroke-[1.5]" aria-hidden="true" />
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[#788078]">Email</p>
                  <p className="text-[#102D25] font-medium mt-0.5">
                    {BRAND_CONFIG.contact.emailPlaceholder}
                  </p>
                </div>
              </div>

              <div className="py-4 flex items-start gap-3.5">
                <Phone className="w-4 h-4 text-[#244B3A] shrink-0 mt-1 stroke-[1.5]" aria-hidden="true" />
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[#788078]">Telephone</p>
                  <p className="text-[#102D25] font-medium mt-0.5">
                    {BRAND_CONFIG.contact.phonePlaceholder}
                  </p>
                </div>
              </div>

              <div className="py-4 flex items-start gap-3.5">
                <MapPin className="w-4 h-4 text-[#244B3A] shrink-0 mt-1 stroke-[1.5]" aria-hidden="true" />
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[#788078]">Location</p>
                  <p className="text-[#102D25] font-medium mt-0.5">
                    {BRAND_CONFIG.location.addressPlaceholder}
                  </p>
                </div>
              </div>

              <div className="py-4 flex items-start gap-3.5">
                <Clock className="w-4 h-4 text-[#244B3A] shrink-0 mt-1 stroke-[1.5]" aria-hidden="true" />
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[#788078]">Desk Hours</p>
                  <p className="text-[#102D25] font-medium mt-0.5">
                    {BRAND_CONFIG.contact.officeHoursPlaceholder}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <WhatsAppButton variant="forest" className="w-full" />
              <div className="flex flex-wrap items-center gap-6 text-xs text-[#244B3A] pt-1">
                {BRAND_CONFIG.social.map((item) => (
                  <a key={item.label} href={item.href} className="hover:underline">
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <EnquiryForm
              contextTitle="General & Itinerary Enquiry"
              subjectPlaceholder="e.g., 4-night Transend Tours trip in September"
              submitLabel="Send Message"
            />
          </div>
        </div>
      </section>

      {/* Hairline FAQ */}
      <section className="py-16 lg:py-24 bg-[#F6F4ED] border-t border-[#E7E4DA]">
        <div className="mx-auto max-w-[1040px] px-6 sm:px-10 space-y-10">
          <EditorialSectionHeader
            eyebrow="Frequently Asked Questions"
            title="Clarity Before You Travel"
          />

          <div className="divide-y divide-[#E7E4DA] border-y border-[#E7E4DA]">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="py-5">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left cursor-pointer py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9C397]"
                  >
                    <span className="font-serif text-lg sm:text-xl text-[#102D25]">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#244B3A] shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] stroke-[1.5] ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={
                          shouldReduceMotion ? { opacity: 1 } : { height: 0, opacity: 0 }
                        }
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={
                          shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }
                        }
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pt-3 text-sm sm:text-base text-[#788078] leading-relaxed max-w-3xl">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
