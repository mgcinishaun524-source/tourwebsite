import { IMAGE_ASSETS } from '../config/brand';
import { TRANSPORT_SERVICES } from '../data/siteData';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EditorialSectionHeader } from '../components/EditorialSectionHeader';
import { EnquiryForm } from '../components/EnquiryForm';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { MaskRevealImage } from '../components/motion/MaskRevealImage';
import { SplitTextReveal } from '../components/motion/SplitTextReveal';

const CORRIDOR_AIRFIELDS = [
  { code: 'VFA', name: 'Transend Tours Hub Airport (VFA), Zimbabwe', note: 'Primary hub · ~25 min road transfer to town & lodges' },
  { code: 'LVI', name: 'Harry Mwanga Nkumbula, Livingstone', note: 'Cross-border gateway · Bridge & customs assistance' },
  { code: 'BBK', name: 'Kasane Airport, Botswana', note: 'Chobe confluence · Kazungula road corridor transfers' },
];

export function TransportPage() {
  return (
    <div>
      {/* Precision Ground Logistics Opening with Airfield Corridor Strip */}
      <section className="pt-36 pb-16 lg:pt-44 lg:pb-20 bg-[#102D25] text-[#F6F4ED]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-7 space-y-5">
              <Breadcrumbs theme="dark" items={[{ label: 'Transport & Transfers' }]} />
              <span className="block text-xs uppercase tracking-[0.22em] text-[#D9C397]">
                Seamless Ground Mobility
              </span>
              <SplitTextReveal
                as="h1"
                mode="words"
                trigger="mount"
                text="Airport Transfers, Chauffeurs & Ground Logistics"
                className="font-serif text-4xl sm:text-5xl lg:text-[3.75rem] font-normal leading-[1.08]"
              />
              <p className="text-base text-[#F6F4ED]/82 leading-relaxed max-w-2xl">
                Coordinated arrivals, private transfers, scheduled shuttles, and vehicle rental assistance arranged through vetted, licensed regional transport partners.
              </p>
            </div>

            <div className="lg:col-span-5 aspect-[16/10] overflow-hidden border border-[#FFFFFF]/14 bg-[#18392F]">
              <MaskRevealImage
                src={IMAGE_ASSETS.luxuryTransfer}
                alt="Dark forest green 4x4 safari cruiser waiting on a sunrise bush track"
                variant="curtain"
                priority
                className="w-full h-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-[#FFFFFF]/14 pt-8 gap-8">
            {CORRIDOR_AIRFIELDS.map((hub) => (
              <div key={hub.code} className="space-y-1.5">
                <span className="block font-serif text-2xl text-[#D9C397]">{hub.code}</span>
                <p className="text-sm font-medium text-[#F6F4ED]">{hub.name}</p>
                <p className="text-xs text-[#F6F4ED]/68 leading-relaxed">{hub.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Precision Horizontal Transport Services Ledger */}
      <section className="py-16 lg:py-24 bg-[#F6F4ED]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-14">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#E7E4DA]">
            <EditorialSectionHeader
              eyebrow="Transport Services"
              title="Punctual Connections Across Airfields, Lodges & Borders"
            />
            <p className="text-xs text-[#788078] max-w-md leading-relaxed">
              Transparency notice: All transfers and vehicle hires are coordinated with licensed third-party transport operators; no fleet ownership or independent operating licences are claimed prior to formal verification.
            </p>
          </div>

          <div className="divide-y divide-[#E7E4DA] border-b border-[#E7E4DA]">
            {TRANSPORT_SERVICES.map((service, idx) => (
              <article
                key={service.id}
                className="group py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
              >
                <div className="lg:col-span-5 aspect-[16/10] overflow-hidden border border-[#E7E4DA] bg-[#102D25]">
                  <MaskRevealImage
                    src={service.image}
                    alt={service.imageAlt}
                    variant={idx % 2 === 0 ? 'curtain' : 'diagonal'}
                    className="w-full h-full"
                  />
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <span className="block text-xs uppercase tracking-[0.18em] text-[#244B3A] font-semibold tabular-nums">
                    0{idx + 1} · {service.category}
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#102D25]">
                    {service.name}
                  </h2>
                  <p className="text-base text-[#26342D] leading-relaxed max-w-2xl">
                    {service.summary}
                  </p>
                  <p className="text-sm text-[#788078] leading-relaxed max-w-2xl">
                    {service.details}
                  </p>

                  <div className="pt-4 border-t border-[#E7E4DA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="text-[#102D25] font-medium">
                      Capacity: {service.capacityPlaceholder}
                    </span>
                    <span className="text-[#788078]">{service.operationalNote}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Transport Enquiry Form */}
      <section className="py-16 lg:py-24 bg-[#FFFFFF] border-t border-[#E7E4DA]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-6">
            <EditorialSectionHeader
              eyebrow="Transfer Coordination"
              title="Request a Ground Transport Quote"
              subtitle="Share your flight arrival airport (VFA, LVI, or BBK), passenger count, and drop-off lodge for coordinated scheduling."
            />
            <WhatsAppButton
              variant="forest"
              message="Hello, I would like to enquire about airport transfers or private ground transport with Transend Tours."
            />
          </div>

          <div className="lg:col-span-7">
            <EnquiryForm
              contextTitle="Transport & Transfer Enquiry"
              subjectPlaceholder="e.g., VFA Airport to Zambezi Lodge · 4 Guests"
              submitLabel="Submit Transport Enquiry"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
