import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PackageItem } from '../data/siteData';
import { ResilientImage } from './ResilientImage';
import { GlassButton } from './GlassButton';

interface PackageCardProps {
  pkg: PackageItem;
  featured?: boolean;
}

export function PackageCard({ pkg, featured = false }: PackageCardProps) {
  return (
    <article
      className={`group flex flex-col bg-[#FFFFFF] border border-[#E7E4DA] rounded-2xl overflow-hidden shadow-[0_14px_34px_-22px_rgba(16,45,37,0.14)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#D9C397] hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-22px_rgba(16,45,37,0.2)] ${
        featured ? 'lg:flex-row lg:items-stretch' : ''
      }`}
    >
      <Link
        to={`/packages/${pkg.slug}`}
        className={`relative block overflow-hidden ${
          featured
            ? 'aspect-[16/10] lg:aspect-auto lg:w-[50%] lg:min-h-[380px] shrink-0'
            : 'aspect-[16/10]'
        }`}
      >
        <ResilientImage
          src={pkg.image}
          alt={pkg.imageAlt}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
        />
        <div className="absolute bottom-4 left-4 right-4 glass-light rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#244B3A] font-semibold">
              {pkg.category}
            </p>
            <p className="text-xs text-[#102D25] font-medium truncate mt-0.5">{pkg.duration}</p>
          </div>
          <span className="text-xs font-medium text-[#102D25] whitespace-nowrap shrink-0">
            View Itinerary
          </span>
        </div>
      </Link>

      <div className={`flex flex-col flex-1 ${featured ? 'p-7 sm:p-9' : 'p-6 sm:p-7'}`}>
        <h3
          className={`font-serif text-[#102D25] leading-snug mb-3 ${
            featured ? 'text-2xl sm:text-3xl' : 'text-2xl'
          }`}
        >
          <Link to={`/packages/${pkg.slug}`} className="hover:text-[#244B3A] transition-colors">
            {pkg.name}
          </Link>
        </h3>

        <p className="text-sm text-[#788078] leading-relaxed mb-5">{pkg.overview}</p>

        <ul className="space-y-2 border-t border-[#E7E4DA] pt-4 mb-6 text-xs text-[#26342D] flex-1">
          {pkg.highlights.slice(0, featured ? 4 : 3).map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
              <span className="text-[#D9C397] font-serif mt-0.5" aria-hidden="true">
                —
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="pt-4 border-t border-[#E7E4DA] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#788078]">
            <span className="block text-[11px] uppercase tracking-[0.14em] text-[#244B3A]">
              Indicative Rate
            </span>
            <span className="text-[#102D25] font-medium">{pkg.pricePlaceholder}</span>
          </div>
          <div className="flex items-center gap-2">
            <GlassButton
              to={`/packages/${pkg.slug}`}
              variant="ivory"
              className="px-4 py-2 text-xs"
            >
              Details
            </GlassButton>
            <GlassButton
              to={`/book?interest=${encodeURIComponent(pkg.name)}`}
              variant="forest"
              className="px-4 py-2 text-xs"
            >
              <span>Enquire</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
            </GlassButton>
          </div>
        </div>
      </div>
    </article>
  );
}
