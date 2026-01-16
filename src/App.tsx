import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const Index = lazy(() => import("./pages/Index"));
const BookDetail = lazy(() => import("./pages/BookDetail"));
const CompetitionNews = lazy(() => import("./pages/CompetitionNews"));
const CompetitionArticleDetail = lazy(() => import("./pages/CompetitionArticleDetail"));
const GraspGuidePremium = lazy(() => import("./pages/GraspGuidePremium"));
const SketchPurchase = lazy(() => import("./pages/SketchPurchase"));
const SketchPremium = lazy(() => import("./pages/SketchPremium"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageFallback = (
  <div className="min-h-screen flex items-center justify-center text-muted-foreground">
    Memuat halaman...
  </div>
);

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Suspense fallback={PageFallback}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/buku/:bookId" element={<BookDetail />} />
          <Route path="/berita-lomba" element={<CompetitionNews />} />
          <Route path="/berita-lomba/:articleId" element={<CompetitionArticleDetail />} />
          <Route path="/grasp-guide-premium" element={<GraspGuidePremium />} />
          <Route path="/sketch-purchase" element={<SketchPurchase />} />
          <Route path="/sketch-premium" element={<SketchPremium />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
