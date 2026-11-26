import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ACCOMMODATIONS } from '../../data/siteData';
import { GlassButton } from '../GlassButton';
import { ResilientImage } from '../ResilientImage';

export function AccommodationLookbook() {
  const sanctuaries = ACCOMMODATIONS.slice(0, 4);
  const [activeIdx, setActiveIdx] = useState(0);
  const active = sanctuaries[activeIdx] ?? sanctuaries[0];

  return (
    <section
      aria-label="Chapter Six: Accommodation & Sanctuaries"
      className="py-20 lg:py-28 bg-[#102D25] text-[#F6F4ED] border-y border-[#FFFFFF]/10"
    >
      <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#FFFFFF]/14">
          <div className="max-w-2xl space-y-3">
            <span className="block text-xs uppercase tracking-[0.22em] text-[#D9C397] font-medium">
              Section 06 · Hospitality &amp; Sanctuaries
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal leading-[1.1] text-[#F6F4ED]">
              Architectural Calm Beside the River
            </h2>
            <p className="text-sm sm:text-base text-[#F6F4ED]/78 leading-relaxed max-w-xl">
              Representative lodge, tented camp, and heritage residence tiers illustrating the sanctuary standard arranged upon verified partner confirmation.
            </p>
          </div>

          <GlassButton to="/accommodation" variant="gold-outline">
            <span>All Demonstration Stays</span>
            <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
          </GlassButton>
        </div>

        {/* Interactive Sanctuary Selector Ribbon */}
        <div
          role="tablist"
          aria-label="Accommodation sanctuary tiers"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#FFFFFF]/14 divide-y sm:divide-y-0 sm:divide-x divide-[#FFFFFF]/14"
        >
          {sanctuaries.map((item, idx) => {
            const selected = idx === activeIdx;
            return (
              <button
                key={item.slug}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveIdx(idx)}
                className={`p-5 text-left transition-colors duration-200 cursor-pointer ${
                  selected
                    ? 'bg-[#18392F] text-[#F6F4ED]'
                    : 'bg-transparent text-[#F6F4ED]/65 hover:bg-[#FFFFFF]/5 hover:text-[#F6F4ED]'
                }`}
              >
                <span className="block text-[11px] uppercase tracking-[0.18em] text-[#D9C397] mb-1.5 tabular-nums">
                  0{idx + 1} · {item.type}
                </span>
                <span className="block font-logo text-xl text-[#F6F4ED] leading-snug tracking-[0.02em]">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Expansive Architectural Lookbook Frame */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <Link
            to={`/accommodation/${active.slug}`}
            className="lg:col-span-8 block border border-[#FFFFFF]/14 group bg-[#121312]"
          >
            <div className="aspect-[16/10] lg:aspect-[16/9] overflow-hidden">
              <ResilientImage
                key={active.image}
                src={active.image}
                alt={active.imageAlt}
                className="w-full h-full"
                imgClassName="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
              />
            </div>
            <div className="px-5 py-3.5 border-t border-[#FFFFFF]/12 bg-[#102D25] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#F6F4ED]">
              <span className="uppercase tracking-[0.18em] text-[#D9C397]">
                {active.location}
              </span>
              <span className="text-[#F6F4ED]/75">{active.sampleNotice}</span>
            </div>
          </Link>

          <div className="lg:col-span-4 flex flex-col justify-between py-2 space-y-6">
            <div className="space-y-4">
              <span className="block text-[11px] uppercase tracking-[0.2em] text-[#D9C397]">
                Architectural Profile
              </span>
              <h3 className="font-serif text-3xl text-[#F6F4ED] leading-snug">
                {active.name}
              </h3>
              <p className="text-sm sm:text-base text-[#F6F4ED]/80 leading-relaxed">
                {active.editorialOverview}
              </p>

              <ul className="space-y-2.5 pt-4 border-t border-[#FFFFFF]/12 text-xs text-[#F6F4ED]/75">
                {active.facilitiesPlaceholder.map((fac, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-[#D9C397]" aria-hidden="true">
                      —
                    </span>
                    <span>{fac}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-5 border-t border-[#FFFFFF]/12 space-y-4">
              <p className="text-xs text-[#D9C397]">{active.pricePlaceholder}</p>
              <div className="flex flex-wrap items-center gap-3">
                <GlassButton to={`/accommodation/${active.slug}`} variant="ivory">
                  <span>View Sanctuary</span>
                  <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
                </GlassButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
