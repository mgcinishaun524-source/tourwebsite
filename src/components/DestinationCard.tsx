import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { DestinationItem } from '../data/siteData';
import { ResilientImage } from './ResilientImage';

interface DestinationCardProps {
  destination: DestinationItem;
  large?: boolean;
}

export function DestinationCard({ destination, large = false }: DestinationCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[#FFFFFF]/14 bg-[#121312] shadow-[0_24px_48px_-20px_rgba(0,0,0,0.45)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#D9C397]/60">
      <Link
        to={`/destinations/${destination.slug}`}
        className={`block relative ${large ? 'aspect-[16/9] sm:aspect-[21/10]' : 'aspect-[4/3]'}`}
      >
        <ResilientImage
          src={destination.image}
          alt={destination.imageAlt}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#000000]/65 via-transparent to-transparent"
        />

        <div
          className={`absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6 glass-forest rounded-xl p-5 text-[#F6F4ED] ${
            large ? 'lg:max-w-xl' : ''
          }`}
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#D9C397] mb-1.5">
            {destination.regionTag}
          </p>
          <h3 className="font-serif text-xl sm:text-2xl text-[#F6F4ED] mb-2">
            {destination.name}
          </h3>
          <p className="text-xs sm:text-sm text-[#F6F4ED]/82 leading-relaxed line-clamp-2 mb-3">
            {destination.shortIntro}
          </p>
          <div className="flex items-center justify-between pt-2.5 border-t border-[#FFFFFF]/12 text-xs">
            <span className="text-[#F6F4ED]/68 truncate pr-3">{destination.operationalNote}</span>
            <span className="inline-flex items-center gap-1.5 text-[#D9C397] whitespace-nowrap shrink-0 font-medium">
              <span>Explore</span>
              <ArrowRight
                className="w-3.5 h-3.5 stroke-[1.5] transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
