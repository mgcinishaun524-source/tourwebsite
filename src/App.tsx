import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { SmoothScrollProvider } from './motion/SmoothScrollProvider';
import { RouteCurtain } from './motion/RouteCurtain';
import { GlassNavbar } from './components/GlassNavbar';
import { PremiumFooter } from './components/PremiumFooter';
import { ScrollToTop } from './components/ScrollToTop';
import { EmptyState } from './components/EmptyState';
import { AuthProvider } from './context/AuthContext';
import { HomePage } from './pages/HomePage';

const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ExperiencesPage = lazy(() =>
  import('./pages/ExperiencesPage').then((m) => ({ default: m.ExperiencesPage })),
);
const ExperienceDetailPage = lazy(() =>
  import('./pages/ExperienceDetailPage').then((m) => ({ default: m.ExperienceDetailPage })),
);
const PackagesPage = lazy(() =>
  import('./pages/PackagesPage').then((m) => ({ default: m.PackagesPage })),
);
const PackageDetailPage = lazy(() =>
  import('./pages/PackageDetailPage').then((m) => ({ default: m.PackageDetailPage })),
);
const DestinationsPage = lazy(() =>
  import('./pages/DestinationsPage').then((m) => ({ default: m.DestinationsPage })),
);
const DestinationDetailPage = lazy(() =>
  import('./pages/DestinationDetailPage').then((m) => ({ default: m.DestinationDetailPage })),
);
const AccommodationPage = lazy(() =>
  import('./pages/AccommodationPage').then((m) => ({ default: m.AccommodationPage })),
);
const AccommodationDetailPage = lazy(() =>
  import('./pages/AccommodationDetailPage').then((m) => ({ default: m.AccommodationDetailPage })),
);
const TransportPage = lazy(() =>
  import('./pages/TransportPage').then((m) => ({ default: m.TransportPage })),
);
const JournalPage = lazy(() =>
  import('./pages/JournalPage').then((m) => ({ default: m.JournalPage })),
);
const JournalDetailPage = lazy(() =>
  import('./pages/JournalDetailPage').then((m) => ({ default: m.JournalDetailPage })),
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })),
);
const BookTripPage = lazy(() =>
  import('./pages/BookTripPage').then((m) => ({ default: m.BookTripPage })),
);
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const CheckoutPage = lazy(() =>
  import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })),
);
const CustomerPortalPage = lazy(() =>
  import('./pages/CustomerPortalPage').then((m) => ({ default: m.CustomerPortalPage })),
);
const SupplierPortalPage = lazy(() =>
  import('./pages/SupplierPortalPage').then((m) => ({ default: m.SupplierPortalPage })),
);
const AdminPortalPage = lazy(() =>
  import('./pages/AdminPortalPage').then((m) => ({ default: m.AdminPortalPage })),
);

function RouteLoadingFallback() {
  return (
    <div
      aria-busy="true"
      className="min-h-[70vh] bg-[#F6F4ED] flex items-center justify-center px-6 pt-28"
    >
      <div className="text-center space-y-2">
        <span className="block text-[11px] uppercase tracking-[0.24em] text-[#244B3A]">
          Transend Tours
        </span>
        <p className="font-logo text-2xl text-[#102D25]">Loading…</p>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="pt-36 pb-24 px-6 bg-[#F6F4ED] min-h-[70vh]">
      <EmptyState
        title="Page Not Found"
        description="The page you are looking for does not exist or may have moved. Return home to explore Transend Tours experiences."
        actionLabel="Return Home"
        actionTo="/"
      />
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <SmoothScrollProvider>
          <BrowserRouter>
            <ScrollToTop />
            <RouteCurtain />
            <div className="min-h-screen flex flex-col bg-[#F6F4ED] text-[#26342D] overflow-x-clip">
              <GlassNavbar />
              <main className="flex-1">
                <Suspense fallback={<RouteLoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/experiences" element={<ExperiencesPage />} />
                    <Route path="/experiences/:slug" element={<ExperienceDetailPage />} />
                    <Route path="/packages" element={<PackagesPage />} />
                    <Route path="/packages/:slug" element={<PackageDetailPage />} />
                    <Route path="/destinations" element={<DestinationsPage />} />
                    <Route path="/destinations/:slug" element={<DestinationDetailPage />} />
                    <Route path="/accommodation" element={<AccommodationPage />} />
                    <Route path="/accommodation/:slug" element={<AccommodationDetailPage />} />
                    <Route path="/transport" element={<TransportPage />} />
                    <Route path="/journal" element={<JournalPage />} />
                    <Route path="/journal/:slug" element={<JournalDetailPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/book" element={<BookTripPage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/checkout/return" element={<CheckoutPage />} />
                    <Route path="/portal/customer" element={<CustomerPortalPage />} />
                    <Route path="/portal/supplier" element={<SupplierPortalPage />} />
                    <Route path="/portal/admin" element={<AdminPortalPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </main>
              <PremiumFooter />
            </div>
          </BrowserRouter>
        </SmoothScrollProvider>
      </AuthProvider>
    </MotionConfig>
  );
}
