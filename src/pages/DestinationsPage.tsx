import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { BRAND_CONFIG, IMAGE_ASSETS } from '../config/brand';
import { DESTINATIONS } from '../data/siteData';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EditorialSectionHeader } from '../components/EditorialSectionHeader';
import { GlassButton } from '../components/GlassButton';
import { ResilientImage } from '../components/ResilientImage';
import { MaskRevealImage } from '../components/motion/MaskRevealImage';
import { SplitTextReveal } from '../components/motion/SplitTextReveal';

export function DestinationsPage() {
  const [primaryHub, ...otherTerritories] = DESTINATIONS;

  return (
    <div>
      {/* Geographic Coordinate Horizon Header */}
      <section className="pt-36 pb-16 lg:pt-44 lg:pb-24 bg-[#102D25] text-[#F6F4ED] border-b border-[#FFFFFF]/10">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Breadcrumbs theme="dark" items={[{ label: 'Destinations' }]} />
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D9C397] tabular-nums">
              <MapPin className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
              <span>{BRAND_CONFIG.location.coordinatesLabel} · Kavango–Zambezi Basin</span>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <SplitTextReveal
                as="h1"
                mode="words"
                trigger="mount"
                text="Transend Tours & The Zambezi Corridor"
                className="font-serif text-4xl sm:text-6xl lg:text-[4.25rem] font-normal leading-[1.06]"
              />
            </div>
            <div className="lg:col-span-4">
              <p className="text-sm sm:text-base text-[#F6F4ED]/80 leading-relaxed">
                Discover Transend Tours, the Upper and Lower Zambezi River, Livingstone, nearby safari territories, and optional regional connections subject to confirmed local partner operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Hub Panoramic Monograph */}
      {primaryHub && (
        <section className="py-16 lg:py-24 bg-[#F6F4ED] border-b border-[#E7E4DA]">
          <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-10">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[#244B3A] font-semibold">
              <span>01 · Primary Destination Hub</span>
              <span>{primaryHub.regionTag}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
              <Link
                to={`/destinations/${primaryHub.slug}`}
                className="lg:col-span-8 block aspect-[16/9] overflow-hidden border border-[#E7E4DA] bg-[#102D25] group"
              >
                <MaskRevealImage
                  src={primaryHub.image}
                  alt={primaryHub.imageAlt}
                  variant="curtain"
                  priority
                  className="w-full h-full"
                  imgClassName="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </Link>

              <div className="lg:col-span-4 space-y-5">
                <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#102D25]">
                  <Link
                    to={`/destinations/${primaryHub.slug}`}
                    className="hover:text-[#244B3A] transition-colors"
                  >
                    {primaryHub.name}
                  </Link>
                </h2>
                <p className="text-sm sm:text-base text-[#26342D] leading-relaxed">
                  {primaryHub.shortIntro}
                </p>
                <div className="pt-4 border-t border-[#E7E4DA] space-y-2 text-xs text-[#788078]">
                  <p>{primaryHub.bestTimePlaceholder}</p>
                  <p>{primaryHub.operationalNote}</p>
                </div>
                <GlassButton to={`/destinations/${primaryHub.slug}`} variant="forest">
                  <span>Explore Primary Hub</span>
                  <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
                </GlassButton>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Alternating Surrounding Corridor Territories */}
      <section className="py-16 lg:py-24 bg-[#FFFFFF]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-16 lg:space-y-24">
          <EditorialSectionHeader
            variant="broadsheet"
            eyebrow="Regional Geography"
            title="Territories Shaped by the River"
            subtitle="From serene Upper Zambezi palm islands to cross-border gorge viewpoints and wildlife sanctuaries."
          />

          <div className="space-y-16 lg:space-y-20">
            {otherTerritories.map((dest, idx) => {
              const reverse = idx % 2 === 1;
              return (
                <article
                  key={dest.slug}
                  className="group grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pb-14 border-b border-[#E7E4DA] last:border-b-0 last:pb-0"
                >
                  <Link
                    to={`/destinations/${dest.slug}`}
                    className={`lg:col-span-6 block aspect-[16/10] overflow-hidden border border-[#E7E4DA] bg-[#102D25] ${
                      reverse ? 'lg:order-2' : ''
                    }`}
                  >
                    <ResilientImage
                      src={dest.image}
                      alt={dest.imageAlt}
                      className="w-full h-full"
                      imgClassName="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                    />
                  </Link>

                  <div className={`lg:col-span-6 space-y-5 ${reverse ? 'lg:order-1' : ''}`}>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[#244B3A] font-semibold">
                      <span className="tabular-nums">0{idx + 2}</span>
                      <span aria-hidden="true">·</span>
                      <span>{dest.regionTag}</span>
                    </div>

                    <h3 className="font-serif text-3xl text-[#102D25] leading-snug">
                      <Link
                        to={`/destinations/${dest.slug}`}
                        className="hover:text-[#244B3A] transition-colors"
                      >
                        {dest.name}
                      </Link>
                    </h3>

                    <p className="text-sm sm:text-base text-[#26342D] leading-relaxed max-w-xl">
                      {dest.overview}
                    </p>

                    <div className="pt-4 border-t border-[#E7E4DA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <span className="text-xs text-[#788078] max-w-sm">
                        {dest.operationalNote}
                      </span>
                      <Link
                        to={`/destinations/${dest.slug}`}
                        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold text-[#102D25] hover:text-[#244B3A] shrink-0"
                      >
                        <span>Explore Territory</span>
                        <ArrowRight
                          className="w-3.5 h-3.5 stroke-[1.5] transition-transform duration-200 group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Geographic Advice Band */}
      <section className="py-16 lg:py-20 bg-[#F6F4ED] border-t border-[#E7E4DA]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-4 aspect-[4/3] overflow-hidden border border-[#E7E4DA]">
            <ResilientImage
              src={IMAGE_ASSETS.livingstoneIsland}
              alt="Aerial view of the basalt threshold of Transend Tours"
              className="w-full h-full"
            />
          </div>
          <div className="lg:col-span-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:pl-6">
            <EditorialSectionHeader
              eyebrow="Route Planning"
              title="Unsure How Many Nights to Spend in Each Area?"
              subtitle="Share your travel window and we will recommend an unhurried geographic sequence across riverfront and bush."
            />
            <GlassButton to="/book" variant="forest">
              <span>Request Advice</span>
              <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
            </GlassButton>
          </div>
        </div>
      </section>
    </div>
  );
}
