import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FloatingAiAvatar } from "@/components/AiAvatarGlobal";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import CartBar from "@/components/CartBar";
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
import WalletPage from "./pages/WalletPage.tsx";
import SubscriptionPage from "./pages/SubscriptionPage.tsx";
import ImportPage from "./pages/ImportPage.tsx";

const queryClient = new QueryClient();

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
        <CartBar />
        <FloatingAiAvatar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/carteira" element={<WalletPage />} />
          <Route path="/importar" element={<ImportPage />} />
          <Route path="/mei" element={<MeiPanel />} />
          <Route path="/client" element={<ClientApp />} />
          <Route path="/processos" element={<ProcessFlows />} />
          <Route path="/gestao" element={<ServiceManagementDemo />} />
          <Route path="/jornada-cliente" element={<ClientJourneyDemo />} />
          <Route path="/mei-acompanhamento" element={<MeiManagerDemo />} />
          <Route path="/dropshipping" element={<DropshippingDemo />} />
          <Route path="/demos" element={<Demos />} />
          <Route path="/central-atendimento" element={<SupportCenterDemo />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/loja/:slug" element={<ProviderStorefront />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </CartProvider>
  </AuthProvider>
  </ThemeProvider>
  );
};

export default App;
