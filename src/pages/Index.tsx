import { lazy, Suspense } from "react";
import Hero from "@/components/Hero";
import Seo from '@/components/Seo';
import { HOME_TITLE, HOME_DESCRIPTION } from '../../shared/seo.js';
import CompetitionPromo from "@/components/CompetitionPromo";

const BestSellerBooks = lazy(() => import("@/components/BestSellerBooks"));
const ArtClasses = lazy(() => import("@/components/ArtClasses"));
const Merchandise = lazy(() => import("@/components/Merchandise"));
const FreeWorksheet = lazy(() => import("@/components/FreeWorksheet"));
const DigitalProducts = lazy(() => import("@/components/DigitalProducts"));
const Footer = lazy(() => import("@/components/Footer"));

const Index = () => {
  return (
    <main className="min-h-screen">
      <Seo title={HOME_TITLE} description={HOME_DESCRIPTION} path="/" />
      <Hero />
      <CompetitionPromo />
      <Suspense fallback={null}>
        <BestSellerBooks />
        <ArtClasses />
        <Merchandise />
        <FreeWorksheet />
        <DigitalProducts />
        <Footer />
      </Suspense>
    </main>
  );
};

export default Index;
