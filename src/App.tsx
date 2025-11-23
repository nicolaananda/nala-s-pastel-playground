import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import BookDetail from "./pages/BookDetail";
import CompetitionNews from "./pages/CompetitionNews";
import CompetitionArticleDetail from "./pages/CompetitionArticleDetail";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/buku/:bookId" element={<BookDetail />} />
        <Route path="/berita-lomba" element={<CompetitionNews />} />
        <Route path="/berita-lomba/:articleId" element={<CompetitionArticleDetail />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
