import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { JOURNAL_ARTICLES } from '../data/siteData';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EmptyState } from '../components/EmptyState';
import { GlassButton } from '../components/GlassButton';
import { RelatedContent } from '../components/RelatedContent';
import { MaskRevealImage } from '../components/motion/MaskRevealImage';
import { SplitTextReveal } from '../components/motion/SplitTextReveal';

export function JournalDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const article = JOURNAL_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="pt-36 pb-24 px-6 bg-[#F6F4ED] min-h-[70vh]">
        <EmptyState
          title="Dispatch Not Found"
          description="The requested editorial article could not be located."
          actionLabel="Return to Journal"
          actionTo="/journal"
        />
      </div>
    );
  }

  const related = JOURNAL_ARTICLES.filter((a) => a.slug !== article.slug)
    .slice(0, 3)
    .map((a) => ({
      slug: a.slug,
      title: a.title,
      kicker: `${a.category} · ${a.readTimePlaceholder}`,
      summary: a.excerpt,
      image: a.image,
      imageAlt: a.imageAlt,
      to: `/journal/${a.slug}`,
    }));

  return (
    <div>
      {/* Crisp Centered Periodical Article Header */}
      <article className="bg-[#FFFFFF]">
        <header className="pt-36 pb-12 lg:pt-44 lg:pb-14 bg-[#F6F4ED] text-[#102D25] border-b border-[#E7E4DA]">
          <div className="mx-auto max-w-[960px] px-6 sm:px-10 text-center space-y-6">
            <div className="flex justify-center">
              <Breadcrumbs
                theme="light"
                items={[
                  { label: 'Journal', to: '/journal' },
                  { label: article.category },
                ]}
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#244B3A] font-medium">
              <span className="uppercase tracking-[0.18em]">{article.category}</span>
              <span aria-hidden="true">·</span>
              <span>{article.readTimePlaceholder}</span>
              <span aria-hidden="true">·</span>
              <span>{article.datePlaceholder}</span>
            </div>

            <SplitTextReveal
              as="h1"
              mode="words"
              trigger="mount"
              text={article.title}
              className="font-serif text-3xl sm:text-5xl lg:text-[3.5rem] font-normal leading-[1.1] text-[#102D25]"
            />

            <p className="text-base sm:text-lg text-[#788078] leading-relaxed max-w-2xl mx-auto">
              {article.subtitle}
            </p>

            <p className="text-xs uppercase tracking-[0.16em] text-[#788078] pt-4 border-t border-[#E7E4DA] inline-block px-6">
              {article.authorPlaceholder}
            </p>
          </div>
        </header>

        {/* Feature Photograph Plate */}
        <div className="mx-auto max-w-[1140px] px-6 sm:px-10 pt-10 lg:pt-14">
          <figure className="border border-[#E7E4DA] bg-[#F6F4ED]">
            <div className="aspect-[16/9]">
              <MaskRevealImage
                src={article.image}
                alt={article.imageAlt}
                variant="curtain"
                className="w-full h-full"
                priority
              />
            </div>
            <figcaption className="px-5 py-3 text-xs font-serif italic text-[#788078] border-t border-[#E7E4DA]">
              {article.imageAlt}
            </figcaption>
          </figure>
        </div>

        {/* Reading Canvas */}
        <div className="mx-auto max-w-[1040px] px-6 sm:px-10 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-8 space-y-6 max-w-prose">
            {article.bodyParagraphs.map((paragraph, idx) => (
              <p
                key={idx}
                className={`text-base sm:text-[1.06rem] leading-[1.88] text-[#26342D] ${
                  idx === 0
                    ? 'first-letter:text-5xl first-letter:font-serif first-letter:font-normal first-letter:text-[#102D25] first-letter:float-left first-letter:mr-3 first-letter:mt-1'
                    : ''
                }`}
              >
                {paragraph}
              </p>
            ))}

            <blockquote className="my-10 py-8 border-y border-[#E7E4DA]">
              <p className="font-serif italic text-2xl sm:text-3xl text-[#102D25] leading-snug">
                “{article.pullQuote}”
              </p>
            </blockquote>

            <div className="pt-4">
              <Link
                to="/journal"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold text-[#102D25]"
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
                <span>All Journal Dispatches</span>
              </Link>
            </div>
          </div>

          <aside className="lg:col-span-4 lg:sticky lg:top-28 border-t-2 border-[#102D25] bg-[#F6F4ED] p-6 sm:p-7 space-y-5">
            <span className="block text-xs uppercase tracking-[0.18em] text-[#244B3A] font-semibold">
              From Page to Journey
            </span>
            <h2 className="font-serif text-xl text-[#102D25]">
              Inspired to experience this season first-hand?
            </h2>
            <p className="text-sm text-[#788078] leading-relaxed">
              Share your preferred travel dates and we will tailor an itinerary around water levels and wildlife patterns.
            </p>
            <GlassButton to="/book" variant="forest" className="w-full">
              <span>Plan Your Trip</span>
              <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
            </GlassButton>
          </aside>
        </div>
      </article>

      <RelatedContent
        eyebrow="Further Reading"
        title="More Editorial Dispatches"
        items={related}
      />
    </div>
  );
}
