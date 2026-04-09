import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FloatingAiAvatar } from "@/components/AiAvatarGlobal";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ConversionProvider } from "@/contexts/ConversionContext";
import CartBar from "@/components/CartBar";
import { AttentionFooterBar } from "@/components/AttentionFooterBar";
import { loadDynamicEntries } from "@/data/searchData";
import Landing from "./pages/Landing.tsx";
import MeiPanel from "./pages/MeiPanel.tsx";
import ClientApp from "./pages/ClientApp.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProcessFlows from "./pages/ProcessFlows.tsx";
import ServiceManagementDemo from "./pages/ServiceManagementDemo.tsx";
import ClientJourneyDemo from "./pages/ClientJourneyDemo.tsx";
import MeiManagerDemo from "./pages/MeiManagerDemo.tsx";
import DropshippingDemo from "./pages/DropshippingDemo.tsx";
import Demos from "./pages/Demos.tsx";
import SupportCenterDemo from "./pages/SupportCenterDemo.tsx";
import AdminPanel from "./pages/AdminPanel.tsx";
import ProviderStorefront from "./pages/ProviderStorefront.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";
import ReferralLanding from "./pages/ReferralLanding.tsx";
import WalletPage from "./pages/WalletPage.tsx";
import SubscriptionPage from "./pages/SubscriptionPage.tsx";
import ImportPage from "./pages/ImportPage.tsx";

const queryClient = new QueryClient();

const MasterRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isMaster } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isMaster) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const ForceResetGuard = ({ children }: { children: React.ReactNode }) => {
  const { mustResetPassword, user } = useAuth();
  if (user && mustResetPassword) return <Navigate to="/reset-password" replace />;
  return <>{children}</>;
};

const App = () => {
  useEffect(() => { loadDynamicEntries(); }, []);
  return (
  <ThemeProvider>
  <AuthProvider>
  <CartProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ConversionProvider>
        <CartBar />
        <FloatingAiAvatar />
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/convite/:code" element={<ReferralLanding />} />
          <Route path="/" element={<ForceResetGuard><Landing /></ForceResetGuard>} />
          <Route path="/carteira" element={<ForceResetGuard><WalletPage /></ForceResetGuard>} />
          <Route path="/assinatura" element={<ForceResetGuard><SubscriptionPage /></ForceResetGuard>} />
          <Route path="/importar" element={<ForceResetGuard><ImportPage /></ForceResetGuard>} />
          <Route path="/mei" element={<ForceResetGuard><MeiPanel /></ForceResetGuard>} />
          <Route path="/client" element={<ForceResetGuard><ClientApp /></ForceResetGuard>} />
          <Route path="/processos" element={<ForceResetGuard><ProcessFlows /></ForceResetGuard>} />
          <Route path="/gestao" element={<ForceResetGuard><ServiceManagementDemo /></ForceResetGuard>} />
          <Route path="/jornada-cliente" element={<ForceResetGuard><ClientJourneyDemo /></ForceResetGuard>} />
          <Route path="/mei-acompanhamento" element={<ForceResetGuard><MeiManagerDemo /></ForceResetGuard>} />
          <Route path="/dropshipping" element={<ForceResetGuard><DropshippingDemo /></ForceResetGuard>} />
          <Route path="/demos" element={<ForceResetGuard><Demos /></ForceResetGuard>} />
          <Route path="/central-atendimento" element={<ForceResetGuard><SupportCenterDemo /></ForceResetGuard>} />
          <Route path="/admin" element={<MasterRoute><AdminPanel /></MasterRoute>} />
          <Route path="/loja/:slug" element={<ForceResetGuard><ProviderStorefront /></ForceResetGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AttentionFooterBar />
        </ConversionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </CartProvider>
  </AuthProvider>
  </ThemeProvider>
  );
};

export default App;
