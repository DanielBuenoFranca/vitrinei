import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing.tsx";
import MeiPanel from "./pages/MeiPanel.tsx";
import ClientApp from "./pages/ClientApp.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProcessFlows from "./pages/ProcessFlows.tsx";
import ServiceManagementDemo from "./pages/ServiceManagementDemo.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/mei" element={<MeiPanel />} />
          <Route path="/client" element={<ClientApp />} />
          <Route path="/processos" element={<ProcessFlows />} />
          <Route path="/gestao" element={<ServiceManagementDemo />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
