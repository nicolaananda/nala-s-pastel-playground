import { lazy, Suspense } from "react";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";

// Lazy load below-the-fold components for better initial load
const BestSellerBooks = lazy(() => import("@/components/BestSellerBooks"));
const ArtClasses = lazy(() => import("@/components/ArtClasses"));
const FreeWorksheet = lazy(() => import("@/components/FreeWorksheet"));
const GraspGuide = lazy(() => import("@/components/GraspGuide"));

// Simple loading placeholder
const SectionLoader = () => (
  <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
    <div className="container mx-auto max-w-6xl">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4"></div>
        <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
      </div>
    </div>
  </div>
);

const Index = () => {
  return (
    <main className="min-h-screen">
      {/* Critical above-the-fold content - load immediately */}
      <Hero />
      
      {/* Below-the-fold content - lazy load */}
      <Suspense fallback={<SectionLoader />}>
        <BestSellerBooks />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <ArtClasses />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <FreeWorksheet />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <GraspGuide />
      </Suspense>
      
      <Footer />
    </main>
  );
};

export default Index;
