import { useEffect, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ConversionProvider } from "@/contexts/ConversionContext";
import { AiSessionProvider } from "@/contexts/AiSessionContext";
import { BackgroundJobsProvider } from "@/contexts/BackgroundJobsContext";
import { FavoritesProvider } from "@/hooks/useFavorites";
import CartBar from "@/components/CartBar";
import { AttentionFooterBar } from "@/components/AttentionFooterBar";
import { SystemStatusIndicator } from "@/components/SystemStatusIndicator";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { DefaultRouteSkeleton, RadarSkeleton, CardexSkeleton } from "@/components/RouteSkeletons";
import { loadDynamicEntries } from "@/data/searchData";
import { GlobalThinkingIndicator } from "@/components/vini/GlobalThinkingIndicator";

// Eager (críticos para 1ª pintura)
import ViniHome from "./pages/ViniHome.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import NotFound from "./pages/NotFound.tsx";

// Lazy (split de bundle)
const Landing = lazy(() => import("./pages/Landing.tsx"));
const MeiPanel = lazy(() => import("./pages/MeiPanel.tsx"));
const ClientApp = lazy(() => import("./pages/ClientApp.tsx"));
const ProcessFlows = lazy(() => import("./pages/ProcessFlows.tsx"));
const ServiceManagementDemo = lazy(() => import("./pages/ServiceManagementDemo.tsx"));
const ClientJourneyDemo = lazy(() => import("./pages/ClientJourneyDemo.tsx"));
const MeiManagerDemo = lazy(() => import("./pages/MeiManagerDemo.tsx"));
const DropshippingDemo = lazy(() => import("./pages/DropshippingDemo.tsx"));
const Demos = lazy(() => import("./pages/Demos.tsx"));
const SupportCenterDemo = lazy(() => import("./pages/SupportCenterDemo.tsx"));
const AdminPanel = lazy(() => import("./pages/AdminPanel.tsx"));
const ProviderStorefront = lazy(() => import("./pages/ProviderStorefront.tsx"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage.tsx"));
const ReferralLanding = lazy(() => import("./pages/ReferralLanding.tsx"));
const WalletPage = lazy(() => import("./pages/WalletPage.tsx"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage.tsx"));
const ImportPage = lazy(() => import("./pages/ImportPage.tsx"));
const RadarUrgencyFlow = lazy(() => import("./pages/RadarUrgencyFlow.tsx"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const ForceResetGuard = ({ children }: { children: React.ReactNode }) => {
  const { mustResetPassword, user } = useAuth();
  if (user && mustResetPassword) return <Navigate to="/reset-password" replace />;
  return <>{children}</>;
};

function LazyRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const location = useLocation();
  return (
    <RouteErrorBoundary routeKey={location.pathname}>
      <Suspense fallback={fallback ?? <DefaultRouteSkeleton />}>{children}</Suspense>
    </RouteErrorBoundary>
  );
}

const App = () => {
  useEffect(() => { loadDynamicEntries(); }, []);
  return (
  <ThemeProvider>
  <AuthProvider>
  <CartProvider>
  <FavoritesProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ConversionProvider>
        <AiSessionProvider>
        <BackgroundJobsProvider>
        <CartBar />
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<LazyRoute><ResetPasswordPage /></LazyRoute>} />
          <Route path="/convite/:code" element={<LazyRoute><ReferralLanding /></LazyRoute>} />
          <Route path="/" element={<ForceResetGuard><ViniHome /></ForceResetGuard>} />
          <Route path="/buscar" element={<ForceResetGuard><LazyRoute fallback={<RadarSkeleton />}><Landing /></LazyRoute></ForceResetGuard>} />
          <Route path="/carteira" element={<ForceResetGuard><LazyRoute><WalletPage /></LazyRoute></ForceResetGuard>} />
          <Route path="/assinatura" element={<ForceResetGuard><LazyRoute><SubscriptionPage /></LazyRoute></ForceResetGuard>} />
          <Route path="/importar" element={<ForceResetGuard><LazyRoute><ImportPage /></LazyRoute></ForceResetGuard>} />
          <Route path="/mei" element={<ForceResetGuard><LazyRoute><MeiPanel /></LazyRoute></ForceResetGuard>} />
          <Route path="/client" element={<ForceResetGuard><LazyRoute><ClientApp /></LazyRoute></ForceResetGuard>} />
          <Route path="/processos" element={<ForceResetGuard><LazyRoute><ProcessFlows /></LazyRoute></ForceResetGuard>} />
          <Route path="/gestao" element={<ForceResetGuard><LazyRoute><ServiceManagementDemo /></LazyRoute></ForceResetGuard>} />
          <Route path="/jornada-cliente" element={<ForceResetGuard><LazyRoute><ClientJourneyDemo /></LazyRoute></ForceResetGuard>} />
          <Route path="/mei-acompanhamento" element={<ForceResetGuard><LazyRoute><MeiManagerDemo /></LazyRoute></ForceResetGuard>} />
          <Route path="/dropshipping" element={<ForceResetGuard><LazyRoute><DropshippingDemo /></LazyRoute></ForceResetGuard>} />
          <Route path="/demos" element={<ForceResetGuard><LazyRoute><Demos /></LazyRoute></ForceResetGuard>} />
          <Route path="/central-atendimento" element={<ForceResetGuard><LazyRoute><SupportCenterDemo /></LazyRoute></ForceResetGuard>} />
          <Route path="/admin" element={<AdminRoute><LazyRoute fallback={<CardexSkeleton />}><AdminPanel /></LazyRoute></AdminRoute>} />
          <Route path="/loja/:slug" element={<LazyRoute><ProviderStorefront /></LazyRoute>} />
          <Route path="/radar-urgencia" element={<ForceResetGuard><LazyRoute fallback={<RadarSkeleton />}><RadarUrgencyFlow /></LazyRoute></ForceResetGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AttentionFooterBar />
        <SystemStatusIndicator />
        <GlobalThinkingIndicator />
        </BackgroundJobsProvider>
        </AiSessionProvider>
        </ConversionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </FavoritesProvider>
  </CartProvider>
  </AuthProvider>
  </ThemeProvider>
  );
};

export default App;
