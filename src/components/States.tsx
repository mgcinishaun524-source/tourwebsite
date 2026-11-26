import { Compass } from 'lucide-react';
import { GlassButton } from './GlassButton';

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = 'Preparing curated collection…' }: LoadingStateProps) {
  return (
    <div
      className="min-h-[40vh] flex flex-col items-center justify-center px-6 py-20 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="w-10 h-10 border border-[#E7E4DA] border-t-[#102D25] rounded-full animate-spin mb-5" />
      <p className="font-serif text-lg text-[#102D25]">{label}</p>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onReset?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
  onReset,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-[#E7E4DA] bg-[#FFFFFF]/80 backdrop-blur-md px-8 py-16 text-center max-w-xl mx-auto shadow-[0_14px_34px_-22px_rgba(16,45,37,0.12)]">
      <Compass className="w-7 h-7 text-[#244B3A] mx-auto mb-4 stroke-[1.25]" aria-hidden="true" />
      <h3 className="font-serif text-2xl text-[#102D25] mb-3">{title}</h3>
      <p className="text-sm text-[#788078] leading-relaxed mb-6">{description}</p>
      {onReset && (
        <GlassButton variant="forest" onClick={onReset}>
          {actionLabel || 'Show All Collection'}
        </GlassButton>
      )}
      {!onReset && actionTo && (
        <GlassButton variant="forest" to={actionTo}>
          {actionLabel || 'Return'}
        </GlassButton>
      )}
    </div>
  );
}
