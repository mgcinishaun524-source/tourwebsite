interface EditorialSectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  theme?: 'light' | 'dark';
  variant?: 'stacked' | 'broadsheet' | 'monograph';
  indexNumber?: string;
  className?: string;
}

export function EditorialSectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  theme = 'light',
  variant = 'stacked',
  indexNumber,
  className = '',
}: EditorialSectionHeaderProps) {
  const isDark = theme === 'dark';

  if (variant === 'broadsheet') {
    return (
      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-end pb-8 border-b ${
          isDark ? 'border-[#FFFFFF]/14' : 'border-[#E7E4DA]'
        } ${className}`}
      >
        <div className="lg:col-span-7 space-y-3">
          {eyebrow && (
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.22em] font-medium">
              {indexNumber && (
                <span className={isDark ? 'text-[#D9C397]/70 tabular-nums' : 'text-[#788078] tabular-nums'}>
                  {indexNumber}
                </span>
              )}
              <span className={isDark ? 'text-[#D9C397]' : 'text-[#244B3A]'}>{eyebrow}</span>
            </div>
          )}
          <h2
            className={`font-logo text-3xl sm:text-4xl lg:text-[2.85rem] font-normal leading-[1.12] tracking-[0.015em] ${
              isDark ? 'text-[#F6F4ED]' : 'text-[#102D25]'
            }`}
          >
            {title}
          </h2>
        </div>
        {subtitle && (
          <div className="lg:col-span-5">
            <p
              className={`text-sm sm:text-base leading-relaxed max-w-md lg:ml-auto ${
                isDark ? 'text-[#F6F4ED]/78' : 'text-[#788078]'
              }`}
            >
              {subtitle}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'monograph') {
    return (
      <div className={`text-center max-w-3xl mx-auto space-y-4 ${className}`}>
        {eyebrow && (
          <div className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.24em] font-medium">
            <span className={`h-px w-6 ${isDark ? 'bg-[#D9C397]/50' : 'bg-[#D9C397]'}`} aria-hidden="true" />
            <span className={isDark ? 'text-[#D9C397]' : 'text-[#244B3A]'}>{eyebrow}</span>
            <span className={`h-px w-6 ${isDark ? 'bg-[#D9C397]/50' : 'bg-[#D9C397]'}`} aria-hidden="true" />
          </div>
        )}
        <h2
          className={`font-logo text-3xl sm:text-5xl font-normal leading-[1.1] tracking-[0.015em] ${
            isDark ? 'text-[#F6F4ED]' : 'text-[#102D25]'
          }`}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className={`text-base sm:text-lg leading-relaxed max-w-2xl mx-auto ${
              isDark ? 'text-[#F6F4ED]/78' : 'text-[#788078]'
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  const alignClasses = align === 'center' ? 'text-center mx-auto items-center' : 'text-left items-start';

  return (
    <div className={`flex flex-col max-w-2xl ${alignClasses} ${className}`}>
      {eyebrow && (
        <span
          className={`text-xs uppercase tracking-[0.2em] font-medium mb-3 ${
            isDark ? 'text-[#D9C397]' : 'text-[#244B3A]'
          }`}
        >
          {indexNumber ? `${indexNumber} · ` : ''}
          {eyebrow}
        </span>
      )}
      <h2
        className={`font-logo text-3xl sm:text-4xl lg:text-[2.65rem] font-normal leading-[1.16] tracking-[0.015em] ${
          isDark ? 'text-[#F6F4ED]' : 'text-[#102D25]'
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 text-base sm:text-[1.05rem] leading-relaxed max-w-xl ${
            isDark ? 'text-[#F6F4ED]/80' : 'text-[#788078]'
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
