import { FormEvent, useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

interface EnquiryFormProps {
  contextTitle?: string;
  subjectPlaceholder?: string;
  submitLabel?: string;
}

export function EnquiryForm({
  contextTitle = 'Send an Enquiry',
  subjectPlaceholder = 'e.g., Airport transfer & private itinerary consultation',
  submitLabel = 'Submit Enquiry',
}: EnquiryFormProps) {
  const shouldReduceMotion = useReducedMotion();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!message.trim()) {
      setError('Please share brief details regarding your enquiry.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="glass-ivory rounded-2xl p-8 border border-[#D9C397]/60"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#102D25] text-[#D9C397] flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-2xl text-[#102D25]">Enquiry Recorded</h3>
            <p className="text-sm text-[#26342D] leading-relaxed">
              Thank you, {name}. Your message has been captured in this preview interface. Please note that submitting an enquiry does not constitute a confirmed reservation; live email dispatch requires connecting your verified backend mail endpoint.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setName('');
                setEmail('');
                setPhone('');
                setSubject('');
                setMessage('');
              }}
              className="mt-3 text-xs uppercase tracking-[0.15em] font-semibold text-[#102D25] underline underline-offset-4 cursor-pointer"
            >
              Send Another Enquiry
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-[#FFFFFF] border border-[#E7E4DA] shadow-[0_20px_50px_-24px_rgba(16,45,37,0.1)] rounded-2xl p-6 sm:p-8 space-y-5"
    >
      <h3 className="font-serif text-2xl text-[#102D25]">{contextTitle}</h3>

      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-[#102D25]/5 border border-[#244B3A]/30 text-xs text-[#102D25]"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="enquiry-name" className="block text-xs font-medium text-[#26342D]">
            Full Name *
          </label>
          <input
            id="enquiry-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full h-11 px-3.5 bg-[#F6F4ED]/65 border border-[#E7E4DA] rounded-xl text-sm text-[#102D25] transition-colors focus:outline-none focus:border-[#102D25] focus:bg-[#FFFFFF]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="enquiry-email" className="block text-xs font-medium text-[#26342D]">
            Email Address *
          </label>
          <input
            id="enquiry-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full h-11 px-3.5 bg-[#F6F4ED]/65 border border-[#E7E4DA] rounded-xl text-sm text-[#102D25] transition-colors focus:outline-none focus:border-[#102D25] focus:bg-[#FFFFFF]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="enquiry-phone" className="block text-xs font-medium text-[#26342D]">
            Phone / WhatsApp (Optional)
          </label>
          <input
            id="enquiry-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+[Country Code] ..."
            className="w-full h-11 px-3.5 bg-[#F6F4ED]/65 border border-[#E7E4DA] rounded-xl text-sm text-[#102D25] transition-colors focus:outline-none focus:border-[#102D25] focus:bg-[#FFFFFF]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="enquiry-subject" className="block text-xs font-medium text-[#26342D]">
            Enquiry Topic
          </label>
          <input
            id="enquiry-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={subjectPlaceholder}
            className="w-full h-11 px-3.5 bg-[#F6F4ED]/65 border border-[#E7E4DA] rounded-xl text-sm text-[#102D25] transition-colors focus:outline-none focus:border-[#102D25] focus:bg-[#FFFFFF]"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="enquiry-message" className="block text-xs font-medium text-[#26342D]">
          Message & Travel Notes *
        </label>
        <textarea
          id="enquiry-message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share preferred dates, party size, or questions..."
          className="w-full p-3.5 bg-[#F6F4ED]/65 border border-[#E7E4DA] rounded-xl text-sm text-[#102D25] transition-colors focus:outline-none focus:border-[#102D25] focus:bg-[#FFFFFF]"
        />
      </div>

      <button
        type="submit"
        className="group w-full sm:w-auto px-7 py-3 bg-[#102D25] text-[#F6F4ED] hover:bg-[#18392F] rounded-full text-sm font-medium tracking-wide inline-flex items-center justify-center gap-2.5 transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.98] cursor-pointer"
      >
        <span>{submitLabel}</span>
        <ArrowRight
          className="w-4 h-4 stroke-[1.5] transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </button>
    </form>
  );
}
