import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ExperienceItem } from '../data/siteData';
import { ResilientImage } from './ResilientImage';

interface ExperienceCardProps {
  experience: ExperienceItem;
  featured?: boolean;
}

export function ExperienceCard({ experience, featured = false }: ExperienceCardProps) {
  return (
    <article
      className={`group flex flex-col bg-[#FFFFFF] border border-[#E7E4DA] rounded-2xl overflow-hidden shadow-[0_14px_34px_-22px_rgba(16,45,37,0.14)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#D9C397] hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-22px_rgba(16,45,37,0.2)] ${
        featured ? 'lg:flex-row lg:items-stretch' : ''
      }`}
    >
      <Link
        to={`/experiences/${experience.slug}`}
        className={`relative block overflow-hidden ${
          featured
            ? 'aspect-[16/10] lg:aspect-auto lg:w-[56%] lg:min-h-[380px] shrink-0'
            : 'aspect-[4/3]'
        }`}
      >
        <ResilientImage
          src={experience.image}
          alt={experience.imageAlt}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
        />
        <div className="absolute bottom-3.5 left-3.5 right-3.5 glass-light rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-[#102D25]">
          <span className="text-xs tracking-wide font-medium truncate">{experience.locationLabel}</span>
          <span className="text-[11px] text-[#244B3A] font-semibold whitespace-nowrap shrink-0">
            Explore
          </span>
        </div>
      </Link>

      <div className={`flex flex-col flex-1 ${featured ? 'p-7 sm:p-9 justify-between' : 'p-6'}`}>
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#788078] mb-3">
            <span className="text-[#244B3A] font-medium">{experience.category}</span>
            <span aria-hidden="true">·</span>
            <span>{experience.durationPlaceholder}</span>
          </div>

          <h3
            className={`font-serif text-[#102D25] leading-snug mb-3 ${
              featured ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
            }`}
          >
            <Link
              to={`/experiences/${experience.slug}`}
              className="hover:text-[#244B3A] transition-colors"
            >
              {experience.name}
            </Link>
          </h3>

          <p className="text-sm sm:text-[0.94rem] text-[#788078] leading-relaxed mb-6">
            {experience.shortDescription}
          </p>
        </div>

        <div className="pt-4 border-t border-[#E7E4DA] flex items-center justify-between gap-4">
          <Link
            to={`/experiences/${experience.slug}`}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-semibold text-[#102D25] hover:text-[#244B3A] transition-colors"
          >
            <span>Discover More</span>
            <ArrowRight
              className="w-3.5 h-3.5 stroke-[1.5] transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
          <Link
            to={`/book?interest=${encodeURIComponent(experience.name)}`}
            className="text-xs text-[#788078] hover:text-[#102D25] transition-colors whitespace-nowrap"
          >
            Enquire
          </Link>
        </div>
      </div>
    </article>
  );
}
