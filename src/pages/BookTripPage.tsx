import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ACCOMMODATION_CATEGORIES,
  DESTINATIONS,
  EXPERIENCES,
  PACKAGES,
  TRANSPORT_SERVICES,
} from '../data/siteData';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { GlassButton } from '../components/GlassButton';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { SplitTextReveal } from '../components/motion/SplitTextReveal';

const STEP_LABELS = [
  'Destination',
  'Experience or Package',
  'Travel Date',
  'Travellers',
  'Accommodation',
  'Transport',
  'Contact Details',
  'Additional Requests',
  'Review Enquiry',
  'Submit',
];

interface TripEnquiryData {
  destination: string;
  experienceOrPackage: string;
  preferredDate: string;
  flexibleDates: boolean;
  adults: number;
  children: number;
  accommodationPreference: string;
  transportPreference: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  additionalRequests: string;
  acknowledgeEnquiryOnly: boolean;
}

export function BookTripPage() {
  const [searchParams] = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [error, setError] = useState('');
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const [form, setForm] = useState<TripEnquiryData>({
    destination: DESTINATIONS[0].name,
    experienceOrPackage: PACKAGES[0].name,
    preferredDate: '',
    flexibleDates: false,
    adults: 2,
    children: 0,
    accommodationPreference: ACCOMMODATION_CATEGORIES[0],
    transportPreference: TRANSPORT_SERVICES[0].name,
    fullName: '',
    email: '',
    phone: '',
    country: '',
    additionalRequests: '',
    acknowledgeEnquiryOnly: true,
  });

  useEffect(() => {
    const destParam = searchParams.get('destination');
    const interestParam = searchParams.get('interest');
    const dateParam = searchParams.get('date');
    const travellersParam = searchParams.get('travellers');

    setForm((prev) => {
      const next = { ...prev };
      if (destParam) {
        const matched = DESTINATIONS.find(
          (d) => d.slug === destParam || d.name.toLowerCase() === destParam.toLowerCase()
        );
        if (matched) next.destination = matched.name;
      }
      if (interestParam) {
        next.experienceOrPackage = interestParam;
      }
      if (dateParam) {
        next.preferredDate = dateParam;
      }
      if (travellersParam) {
        const parsed = parseInt(travellersParam, 10);
        if (!Number.isNaN(parsed) && parsed > 0) {
          next.adults = parsed;
        }
      }
      return next;
    });
  }, [searchParams]);

  const isCustomInterest = useMemo(() => {
    if (!form.experienceOrPackage) return false;
    const inPackages = PACKAGES.some((p) => p.name === form.experienceOrPackage);
    const inExperiences = EXPERIENCES.some((e) => e.name === form.experienceOrPackage);
    return (
      !inPackages &&
      !inExperiences &&
      form.experienceOrPackage !== 'Bespoke Multi-Activity Consultation'
    );
  }, [form.experienceOrPackage]);

  const validateCurrentStep = (): boolean => {
    setError('');
    if (step === 1 && !form.destination) {
      setError('Please select your primary destination.');
      return false;
    }
    if (step === 2 && !form.experienceOrPackage) {
      setError('Please choose an experience, package, or custom itinerary option.');
      return false;
    }
    if (step === 3 && !form.preferredDate && !form.flexibleDates) {
      setError('Please choose a preferred arrival date or indicate flexible travel dates.');
      return false;
    }
    if (step === 4 && form.adults < 1) {
      setError('At least one adult traveller is required.');
      return false;
    }
    if (step === 7) {
      if (!form.fullName.trim()) {
        setError('Please provide your full name.');
        return false;
      }
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        setError('Please provide a valid email address.');
        return false;
      }
    }
    if (step === 10 && !form.acknowledgeEnquiryOnly) {
      setError(
        'Please acknowledge that this submission is an enquiry request rather than a confirmed reservation.'
      );
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setDirection(1);
    setStep((prev) => Math.min(10, prev + 1));
  };

  const handleBack = () => {
    setError('');
    setDirection(-1);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = () => {
    if (!validateCurrentStep()) return;
    const referenceCode = `VF-ENQ-${Math.floor(100000 + Math.random() * 900000)}`;
    setSubmittedRef(referenceCode);
  };

  const progressPercent = (step / 10) * 100;

  return (
    <div>
      {/* Compact Architectural Forest Header */}
      <section className="pt-32 pb-12 lg:pt-40 lg:pb-14 bg-[#102D25] text-[#F6F4ED] border-b border-[#FFFFFF]/10">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-5">
          <Breadcrumbs theme="dark" items={[{ label: 'Plan Your Trip' }]} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-7 space-y-3">
              <span className="block text-xs uppercase tracking-[0.22em] text-[#D9C397]">
                Bespoke Travel Enquiry
              </span>
              <SplitTextReveal
                as="h1"
                mode="words"
                trigger="mount"
                text="Design Your Transend Tours Journey"
                className="font-serif text-4xl sm:text-5xl font-normal leading-[1.08]"
              />
            </div>
            <div className="lg:col-span-5">
              <p className="text-sm text-[#F6F4ED]/80 leading-relaxed">
                Complete the ten-step itinerary brief below. This is an enquiry workflow—no payment is taken and availability or rates are confirmed only once our travel desk reviews your request.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Step Form + Live Summary Dossier Rail */}
      <section className="py-14 lg:py-20 bg-[#F6F4ED] min-h-[60vh]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10">
          {submittedRef ? (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-3xl mx-auto bg-[#FFFFFF] border border-[#E7E4DA] p-8 sm:p-12 space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#102D25] text-[#D9C397] flex items-center justify-center shrink-0">
                  <Check className="w-6 h-6 stroke-[1.5]" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#244B3A] font-semibold">
                    Enquiry Reference · {submittedRef}
                  </p>
                  <h2 className="font-serif text-3xl text-[#102D25]">
                    Your Travel Enquiry Has Been Prepared
                  </h2>
                  <p className="text-sm sm:text-base text-[#26342D] leading-relaxed">
                    Thank you, {form.fullName}. Your preferences have been recorded in this interactive preview. Please note that submitting an enquiry does not constitute a confirmed reservation. Live email/CRM delivery requires connecting your production booking backend.
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-[#E7E4DA] text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-[#788078]">Destination</dt>
                  <dd className="font-medium text-[#102D25] mt-1">{form.destination}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-[#788078]">Focus</dt>
                  <dd className="font-medium text-[#102D25] mt-1">{form.experienceOrPackage}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-[#788078]">Date</dt>
                  <dd className="font-medium text-[#102D25] mt-1">
                    {form.preferredDate || 'Flexible Travel Dates'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-[#788078]">Party</dt>
                  <dd className="font-medium text-[#102D25] mt-1 tabular-nums">
                    {form.adults} Adult(s){form.children > 0 ? `, ${form.children} Child(ren)` : ''}
                  </dd>
                </div>
              </dl>

              <div className="pt-6 border-t border-[#E7E4DA] flex flex-wrap items-center gap-4">
                <GlassButton to="/" variant="forest">
                  Return Home
                </GlassButton>
                <WhatsAppButton
                  variant="outline"
                  message={`Hello, I submitted enquiry ${submittedRef} for ${form.destination} (${form.experienceOrPackage}) for ${form.adults} adult(s).`}
                />
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              {/* Main 10-Step Composer */}
              <div className="lg:col-span-8 bg-[#FFFFFF] border border-[#E7E4DA] p-6 sm:p-10 space-y-8">
                {/* Progress Indicator */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="uppercase tracking-[0.16em] text-[#244B3A] font-semibold tabular-nums">
                      Step {String(step).padStart(2, '0')} of 10 — {STEP_LABELS[step - 1]}
                    </span>
                    <span className="text-[#788078] tabular-nums">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-1 w-full bg-[#E7E4DA] overflow-hidden">
                    <motion.div
                      className="h-full bg-[#102D25]"
                      initial={false}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ type: 'spring', stiffness: 280, damping: 32 }}
                    />
                  </div>
                  <div className="hidden md:grid grid-cols-10 gap-1.5 pt-1">
                    {STEP_LABELS.map((label, idx) => {
                      const stepNum = idx + 1;
                      const active = stepNum === step;
                      const completed = stepNum < step;
                      return (
                        <button
                          key={label}
                          type="button"
                          disabled={stepNum > step}
                          onClick={() => {
                            if (stepNum <= step) {
                              setError('');
                              setDirection(-1);
                              setStep(stepNum);
                            }
                          }}
                          title={label}
                          className={`text-[11px] py-1.5 text-center border-b-2 transition-all ${
                            active
                              ? 'border-[#102D25] text-[#102D25] font-semibold bg-[#F6F4ED]'
                              : completed
                              ? 'border-[#D9C397] text-[#244B3A] hover:bg-[#F6F4ED]/50 cursor-pointer'
                              : 'border-transparent text-[#788078]/60 cursor-not-allowed'
                          }`}
                        >
                          {String(stepNum).padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="p-4 bg-[#102D25]/5 border border-[#244B3A]/30 text-sm text-[#102D25]"
                  >
                    {error}
                  </div>
                )}

                <div className="min-h-[260px] overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={step}
                      initial={
                        shouldReduceMotion
                          ? { opacity: 1 }
                          : { opacity: 0, x: direction * 18 }
                      }
                      animate={{ opacity: 1, x: 0 }}
                      exit={
                        shouldReduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, x: direction * -14 }
                      }
                      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {step === 1 && (
                        <div className="space-y-5">
                          <h2 className="font-serif text-2xl sm:text-3xl text-[#102D25]">
                            1. Where would you like to focus your journey?
                          </h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {DESTINATIONS.map((dest) => {
                              const selected = form.destination === dest.name;
                              return (
                                <button
                                  key={dest.slug}
                                  type="button"
                                  onClick={() => setForm({ ...form, destination: dest.name })}
                                  className={`text-left p-5 border transition-all duration-200 cursor-pointer ${
                                    selected
                                      ? 'bg-[#102D25] text-[#F6F4ED] border-[#102D25]'
                                      : 'bg-[#F6F4ED]/65 text-[#102D25] border-[#E7E4DA] hover:border-[#102D25] hover:bg-[#F6F4ED]'
                                  }`}
                                >
                                  <span className="block text-[11px] uppercase tracking-[0.15em] opacity-75 mb-1">
                                    {dest.regionTag}
                                  </span>
                                  <span className="block font-serif text-xl">{dest.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {step === 2 && (
                        <div className="space-y-5">
                          <h2 className="font-serif text-2xl sm:text-3xl text-[#102D25]">
                            2. Select an experience or travel package
                          </h2>
                          <div className="space-y-4">
                            <div>
                              <label
                                htmlFor="step2-select"
                                className="block text-xs uppercase tracking-[0.14em] text-[#788078] mb-2"
                              >
                                Primary Experience or Package Focus
                              </label>
                              <select
                                id="step2-select"
                                value={form.experienceOrPackage}
                                onChange={(e) =>
                                  setForm({ ...form, experienceOrPackage: e.target.value })
                                }
                                className="w-full h-12 px-4 bg-[#F6F4ED]/65 border border-[#E7E4DA] text-sm text-[#102D25] focus:outline-none focus:border-[#102D25]"
                              >
                                {isCustomInterest && (
                                  <optgroup label="Selected Focus">
                                    <option value={form.experienceOrPackage}>
                                      {form.experienceOrPackage}
                                    </option>
                                  </optgroup>
                                )}
                                <optgroup label="Travel Packages">
                                  {PACKAGES.map((p) => (
                                    <option key={p.slug} value={p.name}>
                                      {p.name} ({p.duration})
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="Individual Experiences">
                                  {EXPERIENCES.map((e) => (
                                    <option key={e.slug} value={e.name}>
                                      {e.name} — {e.category}
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="Custom Planning">
                                  <option value="Bespoke Multi-Activity Consultation">
                                    Bespoke Multi-Activity Consultation
                                  </option>
                                </optgroup>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {step === 3 && (
                        <div className="space-y-5">
                          <h2 className="font-serif text-2xl sm:text-3xl text-[#102D25]">
                            3. Select your preferred travel date
                          </h2>
                          <div className="max-w-md space-y-4">
                            <div>
                              <label
                                htmlFor="step3-date"
                                className="block text-xs uppercase tracking-[0.14em] text-[#788078] mb-2"
                              >
                                Preferred Arrival Date
                              </label>
                              <input
                                id="step3-date"
                                type="date"
                                value={form.preferredDate}
                                onChange={(e) =>
                                  setForm({ ...form, preferredDate: e.target.value })
                                }
                                className="w-full h-12 px-4 bg-[#F6F4ED]/65 border border-[#E7E4DA] text-sm text-[#102D25] focus:outline-none focus:border-[#102D25]"
                              />
                            </div>
                            <label className="flex items-center gap-3 text-sm text-[#26342D] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={form.flexibleDates}
                                onChange={(e) =>
                                  setForm({ ...form, flexibleDates: e.target.checked })
                                }
                                className="w-4 h-4 accent-[#102D25]"
                              />
                              <span>My travel dates are flexible within the season</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {step === 4 && (
                        <div className="space-y-5">
                          <h2 className="font-serif text-2xl sm:text-3xl text-[#102D25]">
                            4. Number of travellers
                          </h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg">
                            <div className="space-y-2">
                              <label
                                htmlFor="step4-adults"
                                className="block text-xs uppercase tracking-[0.14em] text-[#788078]"
                              >
                                Adults (18+)
                              </label>
                              <input
                                id="step4-adults"
                                type="number"
                                min={1}
                                max={30}
                                value={form.adults}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    adults: Math.max(1, Number(e.target.value)),
                                  })
                                }
                                className="w-full h-12 px-4 bg-[#F6F4ED]/65 border border-[#E7E4DA] text-sm text-[#102D25] tabular-nums focus:outline-none focus:border-[#102D25]"
                              />
                            </div>
                            <div className="space-y-2">
                              <label
                                htmlFor="step4-children"
                                className="block text-xs uppercase tracking-[0.14em] text-[#788078]"
                              >
                                Children (Under 18)
                              </label>
                              <input
                                id="step4-children"
                                type="number"
                                min={0}
                                max={20}
                                value={form.children}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    children: Math.max(0, Number(e.target.value)),
                                  })
                                }
                                className="w-full h-12 px-4 bg-[#F6F4ED]/65 border border-[#E7E4DA] text-sm text-[#102D25] tabular-nums focus:outline-none focus:border-[#102D25]"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {step === 5 && (
                        <div className="space-y-5">
                          <h2 className="font-serif text-2xl sm:text-3xl text-[#102D25]">
                            5. Accommodation preferences
                          </h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              ...ACCOMMODATION_CATEGORIES,
                              'No Accommodation Required (Activities Only)',
                            ].map((pref) => {
                              const selected = form.accommodationPreference === pref;
                              return (
                                <button
                                  key={pref}
                                  type="button"
                                  onClick={() =>
                                    setForm({ ...form, accommodationPreference: pref })
                                  }
                                  className={`text-left p-4 border text-sm transition-all duration-200 cursor-pointer ${
                                    selected
                                      ? 'bg-[#102D25] text-[#F6F4ED] border-[#102D25]'
                                      : 'bg-[#F6F4ED]/65 text-[#102D25] border-[#E7E4DA] hover:border-[#102D25] hover:bg-[#F6F4ED]'
                                  }`}
                                >
                                  {pref}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {step === 6 && (
                        <div className="space-y-5">
                          <h2 className="font-serif text-2xl sm:text-3xl text-[#102D25]">
                            6. Transport &amp; transfer preferences
                          </h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              ...TRANSPORT_SERVICES.map((t) => t.name),
                              'No Transport Required',
                            ].map((pref) => {
                              const selected = form.transportPreference === pref;
                              return (
                                <button
                                  key={pref}
                                  type="button"
                                  onClick={() =>
                                    setForm({ ...form, transportPreference: pref })
                                  }
                                  className={`text-left p-4 border text-sm transition-all duration-200 cursor-pointer ${
                                    selected
                                      ? 'bg-[#102D25] text-[#F6F4ED] border-[#102D25]'
                                      : 'bg-[#F6F4ED]/65 text-[#102D25] border-[#E7E4DA] hover:border-[#102D25] hover:bg-[#F6F4ED]'
                                  }`}
                                >
                                  {pref}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {step === 7 && (
                        <div className="space-y-5">
                          <h2 className="font-serif text-2xl sm:text-3xl text-[#102D25]">
                            7. Traveller contact details
                          </h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label
                                htmlFor="step7-name"
                                className="block text-xs font-medium text-[#26342D]"
                              >
                                Full Name *
                              </label>
                              <input
                                id="step7-name"
                                type="text"
                                value={form.fullName}
                                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                placeholder="Primary traveller full name"
                                className="w-full h-11 px-3.5 bg-[#F6F4ED]/65 border border-[#E7E4DA] text-sm text-[#102D25] focus:outline-none focus:border-[#102D25]"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label
                                htmlFor="step7-email"
                                className="block text-xs font-medium text-[#26342D]"
                              >
                                Email Address *
                              </label>
                              <input
                                id="step7-email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="name@example.com"
                                className="w-full h-11 px-3.5 bg-[#F6F4ED]/65 border border-[#E7E4DA] text-sm text-[#102D25] focus:outline-none focus:border-[#102D25]"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label
                                htmlFor="step7-phone"
                                className="block text-xs font-medium text-[#26342D]"
                              >
                                Phone / WhatsApp Number
                              </label>
                              <input
                                id="step7-phone"
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                placeholder="+[Country Code] ..."
                                className="w-full h-11 px-3.5 bg-[#F6F4ED]/65 border border-[#E7E4DA] text-sm text-[#102D25] focus:outline-none focus:border-[#102D25]"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label
                                htmlFor="step7-country"
                                className="block text-xs font-medium text-[#26342D]"
                              >
                                Country of Residence
                              </label>
                              <input
                                id="step7-country"
                                type="text"
                                value={form.country}
                                onChange={(e) => setForm({ ...form, country: e.target.value })}
                                placeholder="e.g., United Kingdom, Zimbabwe, USA"
                                className="w-full h-11 px-3.5 bg-[#F6F4ED]/65 border border-[#E7E4DA] text-sm text-[#102D25] focus:outline-none focus:border-[#102D25]"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {step === 8 && (
                        <div className="space-y-5">
                          <h2 className="font-serif text-2xl sm:text-3xl text-[#102D25]">
                            8. Additional requests &amp; notes
                          </h2>
                          <div className="space-y-2">
                            <label htmlFor="step8-notes" className="block text-xs text-[#788078]">
                              Dietary preferences, special celebrations, photography interests, or mobility considerations
                            </label>
                            <textarea
                              id="step8-notes"
                              rows={5}
                              value={form.additionalRequests}
                              onChange={(e) =>
                                setForm({ ...form, additionalRequests: e.target.value })
                              }
                              placeholder="Share any context that helps us craft your proposal..."
                              className="w-full p-4 bg-[#F6F4ED]/65 border border-[#E7E4DA] text-sm text-[#102D25] focus:outline-none focus:border-[#102D25]"
                            />
                          </div>
                        </div>
                      )}

                      {step === 9 && (
                        <div className="space-y-5">
                          <h2 className="font-serif text-2xl sm:text-3xl text-[#102D25]">
                            9. Review your itinerary enquiry
                          </h2>
                          <dl className="divide-y divide-[#E7E4DA] border-y border-[#E7E4DA] text-sm">
                            <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <dt className="text-[#788078]">Destination</dt>
                              <dd className="sm:col-span-2 font-medium text-[#102D25]">
                                {form.destination}
                              </dd>
                            </div>
                            <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <dt className="text-[#788078]">Experience / Package</dt>
                              <dd className="sm:col-span-2 font-medium text-[#102D25]">
                                {form.experienceOrPackage}
                              </dd>
                            </div>
                            <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <dt className="text-[#788078]">Preferred Date</dt>
                              <dd className="sm:col-span-2 font-medium text-[#102D25]">
                                {form.preferredDate || 'Not specified'}{' '}
                                {form.flexibleDates ? '(Flexible)' : ''}
                              </dd>
                            </div>
                            <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <dt className="text-[#788078]">Travellers</dt>
                              <dd className="sm:col-span-2 font-medium text-[#102D25] tabular-nums">
                                {form.adults} Adult(s), {form.children} Child(ren)
                              </dd>
                            </div>
                            <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <dt className="text-[#788078]">Accommodation Preference</dt>
                              <dd className="sm:col-span-2 font-medium text-[#102D25]">
                                {form.accommodationPreference}
                              </dd>
                            </div>
                            <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <dt className="text-[#788078]">Transport Preference</dt>
                              <dd className="sm:col-span-2 font-medium text-[#102D25]">
                                {form.transportPreference}
                              </dd>
                            </div>
                            <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <dt className="text-[#788078]">Primary Contact</dt>
                              <dd className="sm:col-span-2 font-medium text-[#102D25]">
                                {form.fullName} · {form.email}
                                {form.phone ? ` · ${form.phone}` : ''}
                              </dd>
                            </div>
                            {form.additionalRequests && (
                              <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <dt className="text-[#788078]">Additional Requests</dt>
                                <dd className="sm:col-span-2 text-[#26342D]">
                                  {form.additionalRequests}
                                </dd>
                              </div>
                            )}
                          </dl>
                        </div>
                      )}

                      {step === 10 && (
                        <div className="space-y-6">
                          <h2 className="font-serif text-2xl sm:text-3xl text-[#102D25]">
                            10. Submit your enquiry
                          </h2>
                          <div className="p-6 bg-[#F6F4ED] border border-[#E7E4DA] space-y-4">
                            <p className="text-sm text-[#26342D] leading-relaxed">
                              Submitting this form sends a consultation brief to our travel desk. No reservations are confirmed automatically, and no payment is processed at this stage.
                            </p>
                            <label className="flex items-start gap-3 text-sm text-[#102D25] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={form.acknowledgeEnquiryOnly}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    acknowledgeEnquiryOnly: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 mt-0.5 accent-[#102D25]"
                              />
                              <span>
                                I understand this is an enquiry request subject to availability and confirmed partner rates.
                              </span>
                            </label>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation Buttons */}
                <div className="pt-6 border-t border-[#E7E4DA] flex items-center justify-between gap-4">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#E7E4DA] hover:border-[#102D25] rounded-full text-sm text-[#102D25] active:scale-[0.98] cursor-pointer transition-all"
                    >
                      <ArrowLeft className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
                      <span>Previous Step</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {step < 10 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="group inline-flex items-center gap-2 px-6 py-2.5 bg-[#102D25] text-[#F6F4ED] hover:bg-[#18392F] rounded-full text-sm font-medium active:scale-[0.98] cursor-pointer transition-all"
                    >
                      <span>Continue</span>
                      <ArrowRight
                        className="w-4 h-4 stroke-[1.5] transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="inline-flex items-center gap-2 px-7 py-3 bg-[#102D25] text-[#F6F4ED] hover:bg-[#18392F] border border-[#D9C397]/50 rounded-full text-sm font-medium active:scale-[0.98] cursor-pointer transition-all"
                    >
                      <span>Submit Trip Enquiry</span>
                      <Check className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              {/* Live Itinerary Dossier Rail */}
              <aside className="lg:col-span-4 lg:sticky lg:top-28 bg-[#102D25] text-[#F6F4ED] p-7 space-y-6">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#D9C397]">
                    Live Enquiry Brief
                  </span>
                  <h3 className="font-serif text-2xl text-[#F6F4ED] mt-1">
                    Current Selections
                  </h3>
                </div>

                <dl className="divide-y divide-[#FFFFFF]/12 border-y border-[#FFFFFF]/12 text-xs">
                  <div className="py-3 flex justify-between gap-4">
                    <dt className="text-[#F6F4ED]/65 uppercase tracking-[0.12em]">Territory</dt>
                    <dd className="text-[#F6F4ED] font-medium text-right">{form.destination}</dd>
                  </div>
                  <div className="py-3 flex justify-between gap-4">
                    <dt className="text-[#F6F4ED]/65 uppercase tracking-[0.12em]">Focus</dt>
                    <dd className="text-[#F6F4ED] font-medium text-right">{form.experienceOrPackage}</dd>
                  </div>
                  <div className="py-3 flex justify-between gap-4">
                    <dt className="text-[#F6F4ED]/65 uppercase tracking-[0.12em]">Dates</dt>
                    <dd className="text-[#F6F4ED] font-medium text-right">
                      {form.preferredDate || (form.flexibleDates ? 'Flexible Dates' : 'Pending')}
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between gap-4">
                    <dt className="text-[#F6F4ED]/65 uppercase tracking-[0.12em]">Travellers</dt>
                    <dd className="text-[#F6F4ED] font-medium text-right tabular-nums">
                      {form.adults} Adult{form.adults === 1 ? '' : 's'}
                      {form.children > 0 ? ` · ${form.children} Child` : ''}
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between gap-4">
                    <dt className="text-[#F6F4ED]/65 uppercase tracking-[0.12em]">Stay Tier</dt>
                    <dd className="text-[#F6F4ED] font-medium text-right">
                      {form.accommodationPreference}
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between gap-4">
                    <dt className="text-[#F6F4ED]/65 uppercase tracking-[0.12em]">Mobility</dt>
                    <dd className="text-[#F6F4ED] font-medium text-right">
                      {form.transportPreference}
                    </dd>
                  </div>
                </dl>

                <WhatsAppButton
                  variant="glass"
                  className="w-full"
                  message={`Hello, I am planning a Transend Tours trip to ${form.destination} (${form.experienceOrPackage}).`}
                />
              </aside>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
