import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MagneticButton } from './motion/MagneticButton';

type GlassButtonVariant = 'forest' | 'ivory' | 'glass-light' | 'glass-dark' | 'gold-outline';

interface GlassButtonProps {
  children: ReactNode;
  to?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: GlassButtonVariant;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  magnetic?: boolean;
}

const variantStyles: Record<GlassButtonVariant, string> = {
  forest:
    'bg-[#102D25] text-[#F6F4ED] border border-[#102D25] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_24px_-10px_rgba(16,45,37,0.5)] hover:bg-[#18392F] hover:border-[#D9C397]/55',
  ivory:
    'bg-[#F6F4ED] text-[#102D25] border border-[#E7E4DA] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_24px_-12px_rgba(16,45,37,0.18)] hover:bg-[#FFFFFF] hover:border-[#D9C397]',
  'glass-light':
    'glass-light text-[#102D25] hover:bg-[#FFFFFF]/85 hover:border-[#D9C397]',
  'glass-dark':
    'glass-forest-subtle text-[#F6F4ED] hover:bg-[#191B1A]/85 hover:border-[#D9C397]/60',
  'gold-outline':
    'bg-[#0D0E0E]/30 backdrop-blur-md text-[#D9C397] border border-[#D9C397]/55 shadow-[inset_0_1px_0_rgba(217,195,151,0.18)] hover:bg-[#D9C397]/15 hover:border-[#D9C397]',
};

export function GlassButton({
  children,
  to,
  onClick,
  type = 'button',
  variant = 'forest',
  className = '',
  disabled = false,
  ariaLabel,
  magnetic = true,
}: GlassButtonProps) {
  const baseClasses = `group inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full text-sm font-medium tracking-wide whitespace-nowrap shrink-0 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[1px] active:scale-[0.98] active:translate-y-0 [&_svg]:transition-transform [&_svg]:duration-200 group-hover:[&_svg]:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9C397] focus-visible:ring-offset-2 focus-visible:ring-offset-[#102D25] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 ${variantStyles[variant]} ${className}`;

  const content = to ? (
    <Link to={to} className={baseClasses} aria-label={ariaLabel}>
      {children}
    </Link>
  ) : (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );

  const shouldMagnetize = magnetic && !disabled && !className.includes('w-full');

  return shouldMagnetize ? <MagneticButton>{content}</MagneticButton> : content;
}
