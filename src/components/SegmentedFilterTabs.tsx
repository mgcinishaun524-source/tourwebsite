import { motion, useReducedMotion } from 'motion/react';

export interface FilterTabOption {
  value: string;
  label: string;
}

interface SegmentedFilterTabsProps {
  options: FilterTabOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  layoutId: string;
}

export function SegmentedFilterTabs({
  options,
  value,
  onChange,
  ariaLabel,
  layoutId,
}: SegmentedFilterTabsProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="overflow-x-auto no-scrollbar -mx-2 px-2 py-1">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="inline-flex items-center gap-1 p-1.5 rounded-full glass-ivory border border-[#E7E4DA]"
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onChange(option.value)}
              className={`relative px-4 py-2 rounded-full text-xs font-medium tracking-wide whitespace-nowrap shrink-0 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9C397] ${
                isSelected ? 'text-[#F6F4ED]' : 'text-[#26342D] hover:text-[#102D25]'
              }`}
            >
              {isSelected && (
                <motion.span
                  layoutId={shouldReduceMotion ? undefined : layoutId}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-full bg-[#102D25] shadow-[0_6px_16px_-6px_rgba(16,45,37,0.45)]"
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
