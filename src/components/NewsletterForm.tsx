import { FormEvent, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

interface NewsletterFormProps {
  theme?: 'dark' | 'light';
}

export function NewsletterForm({ theme = 'dark' }: NewsletterFormProps) {
  const shouldReduceMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmitted(true);
    setEmail('');
  };

  const isDark = theme === 'dark';

  if (submitted) {
    return (
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className={`flex items-start gap-3 p-4 rounded-xl border ${
          isDark
            ? 'border-[#D9C397]/40 bg-[#18392F]/80 text-[#F6F4ED]'
            : 'border-[#244B3A]/30 bg-[#FFFFFF] text-[#102D25]'
        }`}
      >
        <Check className="w-4 h-4 text-[#D9C397] shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs leading-relaxed">
          Thank you. Your seasonal dispatch request has been recorded (placeholder form pending newsletter backend integration).
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          placeholder="Your email address"
          className={`flex-1 h-11 px-4 rounded-full text-sm border transition-colors focus:outline-none ${
            isDark
              ? 'bg-[#18392F]/85 border-[#FFFFFF]/18 text-[#F6F4ED] placeholder:text-[#F6F4ED]/50 focus:border-[#D9C397]'
              : 'bg-[#FFFFFF] border-[#E7E4DA] text-[#102D25] placeholder:text-[#788078] focus:border-[#102D25]'
          }`}
        />
        <button
          type="submit"
          className={`group h-11 px-5 rounded-full text-xs uppercase tracking-[0.14em] font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-all duration-200 active:scale-[0.98] cursor-pointer ${
            isDark
              ? 'bg-[#D9C397] text-[#102D25] hover:bg-[#F6F4ED]'
              : 'bg-[#102D25] text-[#F6F4ED] hover:bg-[#18392F]'
          }`}
        >
          <span>Subscribe</span>
          <ArrowRight
            className="w-3.5 h-3.5 stroke-[1.5] transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </button>
      </div>
      {error && (
        <p className={`text-xs px-2 ${isDark ? 'text-[#D9C397]' : 'text-[#244B3A]'}`} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
