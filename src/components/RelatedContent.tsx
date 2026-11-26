import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ResilientImage } from './ResilientImage';
import { EditorialSectionHeader } from './EditorialSectionHeader';

export interface RelatedItem {
  slug: string;
  title: string;
  kicker: string;
  summary: string;
  image: string;
  imageAlt: string;
  to: string;
}

interface RelatedContentProps {
  eyebrow?: string;
  title?: string;
  items: RelatedItem[];
}

export function RelatedContent({
  eyebrow = 'Continue Exploring',
  title = 'Curated Pairings Nearby',
  items,
}: RelatedContentProps) {
  if (!items.length) return null;

  return (
    <section className="py-16 lg:py-24 bg-[#F6F4ED] border-t border-[#E7E4DA]">
      <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-10">
        <EditorialSectionHeader
          variant="broadsheet"
          eyebrow={eyebrow}
          title={title}
        />

        <div className="divide-y divide-[#E7E4DA] border-b border-[#E7E4DA]">
          {items.map((item, idx) => (
            <article
              key={item.slug}
              className="group py-7 lg:py-8 grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-center"
            >
              <div className="md:col-span-1 text-xs uppercase tracking-[0.18em] text-[#788078] tabular-nums">
                0{idx + 1}
              </div>

              <Link
                to={item.to}
                className="md:col-span-3 block aspect-[16/10] overflow-hidden border border-[#E7E4DA] bg-[#102D25]"
              >
                <ResilientImage
                  src={item.image}
                  alt={item.imageAlt}
                  className="w-full h-full"
                  imgClassName="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />
              </Link>

              <div className="md:col-span-6 space-y-2">
                <span className="block text-[11px] uppercase tracking-[0.18em] text-[#244B3A] font-medium">
                  {item.kicker}
                </span>
                <h3 className="font-serif text-2xl text-[#102D25] leading-snug">
                  <Link to={item.to} className="hover:text-[#244B3A] transition-colors">
                    {item.title}
                  </Link>
                </h3>
                <p className="text-sm text-[#788078] leading-relaxed line-clamp-2">
                  {item.summary}
                </p>
              </div>

              <div className="md:col-span-2 flex md:justify-end">
                <Link
                  to={item.to}
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold text-[#102D25] group-hover:text-[#244B3A] whitespace-nowrap"
                >
                  <span>Explore</span>
                  <ArrowRight
                    className="w-3.5 h-3.5 stroke-[1.5] transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
