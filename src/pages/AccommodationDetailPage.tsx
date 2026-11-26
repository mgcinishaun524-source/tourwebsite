import { useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ACCOMMODATIONS } from '../data/siteData';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EditorialSectionHeader } from '../components/EditorialSectionHeader';
import { EmptyState } from '../components/EmptyState';
import { GlassButton } from '../components/GlassButton';
import { ImageGallery } from '../components/ImageGallery';
import { RelatedContent } from '../components/RelatedContent';
import { ResilientImage } from '../components/ResilientImage';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { SplitTextReveal } from '../components/motion/SplitTextReveal';

export function AccommodationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const item = ACCOMMODATIONS.find((a) => a.slug === slug);

  if (!item) {
    return (
      <div className="pt-36 pb-24 px-6 bg-[#F6F4ED] min-h-[70vh]">
        <EmptyState
          title="Property Listing Not Found"
          description="The requested sample property could not be found."
          actionLabel="View Accommodation"
          actionTo="/accommodation"
        />
      </div>
    );
  }

  const secondaryPhoto = item.gallery[1] ?? item.gallery[0];
  const related = ACCOMMODATIONS.filter((a) => a.slug !== item.slug)
    .slice(0, 3)
    .map((a) => ({
      slug: a.slug,
      title: a.name,
      kicker: `${a.type} · Sample Tier`,
      summary: a.description,
      image: a.image,
      imageAlt: a.imageAlt,
      to: `/accommodation/${a.slug}`,
    }));

  return (
    <div>
      {/* Dual-Plate Architectural Opening */}
      <section className="pt-36 pb-16 lg:pt-44 lg:pb-20 bg-[#102D25] text-[#F6F4ED]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-10">
          <Breadcrumbs
            theme="dark"
            items={[
              { label: 'Accommodation', to: '/accommodation' },
              { label: item.name },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D9C397]">
                <span>{item.type}</span>
                <span aria-hidden="true">·</span>
                <span>{item.location}</span>
              </div>
              <SplitTextReveal
                as="h1"
                mode="words"
                trigger="mount"
                text={item.name}
                className="font-serif text-4xl sm:text-5xl lg:text-[3.75rem] font-normal leading-[1.08]"
              />
            </div>
            <div className="lg:col-span-5">
              <p className="text-base text-[#F6F4ED]/82 leading-relaxed">{item.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            <div className="md:col-span-8 aspect-[16/9] overflow-hidden border border-[#FFFFFF]/14 bg-[#18392F]">
              <ResilientImage
                src={item.image}
                alt={item.imageAlt}
                className="w-full h-full"
                priority
              />
            </div>
            <div className="md:col-span-4 aspect-[4/3] md:aspect-auto overflow-hidden border border-[#FFFFFF]/14 bg-[#18392F]">
              <ResilientImage
                src={secondaryPhoto?.src ?? item.image}
                alt={secondaryPhoto?.alt ?? item.imageAlt}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Architectural Profile & Clean Stay Enquiry */}
      <section className="py-16 lg:py-24 bg-[#F6F4ED]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-7 space-y-12">
            <div className="py-4 border-y border-[#E7E4DA] text-xs text-[#244B3A] leading-relaxed">
              {item.sampleNotice}
            </div>

            <div className="space-y-4">
              <EditorialSectionHeader eyebrow="Architectural Profile" title="Setting & Atmosphere" />
              <p className="text-base sm:text-[1.05rem] text-[#26342D] leading-[1.85] max-w-prose">
                {item.editorialOverview}
              </p>
            </div>

            <div className="space-y-5 pt-8 border-t border-[#E7E4DA]">
              <h2 className="font-serif text-2xl sm:text-3xl text-[#102D25]">
                Sample Facilities &amp; Amenities (Placeholder)
              </h2>
              <ul className="divide-y divide-[#E7E4DA] border-y border-[#E7E4DA]">
                {item.facilitiesPlaceholder.map((fac, idx) => (
                  <li key={idx} className="py-4 flex items-start gap-3 text-sm sm:text-base text-[#26342D]">
                    <span className="text-[#244B3A] font-serif tabular-nums" aria-hidden="true">
                      0{idx + 1}.
                    </span>
                    <span>{fac}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="lg:col-span-5 lg:sticky lg:top-28 bg-[#FFFFFF] border border-[#E7E4DA] p-7 sm:p-9 space-y-6">
            <div>
              <span className="text-xs uppercase tracking-[0.18em] text-[#244B3A] font-semibold">
                Stay Enquiry
              </span>
              <h2 className="font-serif text-2xl text-[#102D25] mt-1">{item.name}</h2>
            </div>

            <dl className="divide-y divide-[#E7E4DA] border-y border-[#E7E4DA] text-sm">
              <div className="py-3.5 flex justify-between gap-4">
                <dt className="text-[#788078]">Category</dt>
                <dd className="text-[#102D25] font-medium text-right">{item.type}</dd>
              </div>
              <div className="py-3.5 flex flex-col gap-1">
                <dt className="text-[#788078]">Location</dt>
                <dd className="text-[#102D25] font-medium">{item.location}</dd>
              </div>
              <div className="py-3.5 flex flex-col gap-1">
                <dt className="text-[#788078]">Rate Guidance</dt>
                <dd className="text-[#102D25] font-medium">{item.pricePlaceholder}</dd>
              </div>
            </dl>

            <div className="space-y-3">
              <GlassButton
                to="/checkout"
                variant="forest"
                className="w-full"
              >
                <span>Check Live Availability &amp; Book</span>
                <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
              </GlassButton>
              <GlassButton
                to={`/book?interest=${encodeURIComponent(`Accommodation: ${item.name}`)}`}
                variant="ivory"
                className="w-full"
              >
                <span>Request Verified Stay Options</span>
                <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
              </GlassButton>
              <WhatsAppButton
                variant="outline"
                className="w-full"
                message={`Hello, I would like to enquire about ${item.type} options similar to ${item.name}.`}
              />
            </div>
          </aside>
        </div>
      </section>

      {item.gallery.length > 0 && (
        <section className="py-16 lg:py-20 bg-[#FFFFFF] border-t border-[#E7E4DA]">
          <div className="mx-auto max-w-[1380px] px-6 sm:px-10">
            <EditorialSectionHeader eyebrow="Gallery" title="Sample Atmosphere" className="mb-10" />
            <ImageGallery images={item.gallery} columns={2} />
          </div>
        </section>
      )}

      <RelatedContent
        eyebrow="Alternative Tiers"
        title="Compare Other Demonstration Stays"
        items={related}
      />
    </div>
  );
}
