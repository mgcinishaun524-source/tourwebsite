import { MessageCircle } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brand';

interface WhatsAppButtonProps {
  message?: string;
  label?: string;
  variant?: 'forest' | 'glass' | 'outline';
  className?: string;
}

export function WhatsAppButton({
  message = 'Hello, I would like to enquire about planning a Transend Tours journey.',
  label = 'Enquire via WhatsApp',
  variant = 'forest',
  className = '',
}: WhatsAppButtonProps) {
  const encodedMessage = encodeURIComponent(message);
  const href = `https://wa.me/${BRAND_CONFIG.contact.whatsappNumberPlaceholder}?text=${encodedMessage}`;

  const styleMap = {
    forest:
      'bg-[#18392F] text-[#F6F4ED] border border-[#244B3A] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-[#102D25] hover:border-[#D9C397]/60',
    glass:
      'glass-light text-[#102D25] hover:bg-[#FFFFFF]/90 hover:border-[#D9C397]',
    outline:
      'bg-transparent text-[#102D25] border border-[#E7E4DA] hover:border-[#102D25] hover:bg-[#FFFFFF]/60',
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-full text-sm font-medium tracking-wide whitespace-nowrap shrink-0 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[1px] active:scale-[0.98] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9C397] ${styleMap[variant]} ${className}`}
    >
      <MessageCircle className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
      <span>{label}</span>
    </a>
  );
}
