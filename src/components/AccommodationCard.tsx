import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AccommodationItem } from '../data/siteData';
import { ResilientImage } from './ResilientImage';
import { GlassButton } from './GlassButton';

interface AccommodationCardProps {
  accommodation: AccommodationItem;
}

export function AccommodationCard({ accommodation }: AccommodationCardProps) {
  return (
    <article className="group flex flex-col bg-[#FFFFFF] border border-[#E7E4DA] rounded-2xl overflow-hidden shadow-[0_14px_34px_-22px_rgba(16,45,37,0.14)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#D9C397] hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-22px_rgba(16,45,37,0.2)]">
      <Link
        to={`/accommodation/${accommodation.slug}`}
        className="relative block aspect-[16/10] overflow-hidden"
      >
        <ResilientImage
          src={accommodation.image}
          alt={accommodation.imageAlt}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
        />
        <div className="absolute bottom-3.5 left-3.5 right-3.5 glass-light rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-[#102D25]">
          <span className="font-medium truncate">{accommodation.location}</span>
          <span className="text-[#244B3A] font-medium whitespace-nowrap shrink-0">
            {accommodation.type}
          </span>
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-6 sm:p-7">
        <p className="text-[11px] text-[#788078] mb-2">{accommodation.sampleNotice}</p>
        <h3 className="font-serif text-2xl text-[#102D25] leading-snug mb-3">
          <Link
            to={`/accommodation/${accommodation.slug}`}
            className="hover:text-[#244B3A] transition-colors"
          >
            {accommodation.name}
          </Link>
        </h3>
        <p className="text-sm text-[#788078] leading-relaxed mb-5 flex-1">
          {accommodation.description}
        </p>

        <div className="pt-4 border-t border-[#E7E4DA] flex items-center justify-between gap-3">
          <span className="text-xs text-[#26342D]">{accommodation.pricePlaceholder}</span>
          <GlassButton
            to={`/accommodation/${accommodation.slug}`}
            variant="forest"
            className="px-4 py-2 text-xs"
          >
            <span>View Stay</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
          </GlassButton>
        </div>
      </div>
    </article>
  );
}
