import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const Index = lazy(() => import("./pages/Index.tsx"));
const Create = lazy(() => import("./pages/Create.tsx"));
const ProgramView = lazy(() => import("./pages/ProgramView.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Admin = lazy(() => import("./pages/Admin"));
const PaymentReturn = lazy(() => import("./pages/PaymentReturn"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center text-whisper">
              Loading…
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/create" element={<Create />} />
            <Route path="/payment/return" element={<PaymentReturn />} />
            <Route path="/program/:id" element={<ProgramView />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;