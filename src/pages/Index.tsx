import { lazy, Suspense } from "react";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";

// Lazy load below-the-fold components
const BestSellerBooks = lazy(() => import("@/components/BestSellerBooks"));
const ArtClasses = lazy(() => import("@/components/ArtClasses"));
const FreeWorksheet = lazy(() => import("@/components/FreeWorksheet"));
const GraspGuide = lazy(() => import("@/components/GraspGuide"));

// Loading fallback component
const SectionLoader = () => (
  <div className="py-20 px-4 text-center">
    <div className="inline-block animate-pulse text-primary">Loading...</div>
  </div>
);

const Index = () => {
  return (
    <main className="min-h-screen">
      <Hero />
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
