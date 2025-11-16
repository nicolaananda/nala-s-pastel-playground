import Hero from "@/components/Hero";
import BestSellerBooks from "@/components/BestSellerBooks";
import ArtClasses from "@/components/ArtClasses";
import FreeWorksheet from "@/components/FreeWorksheet";
import GraspGuide from "@/components/GraspGuide";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <BestSellerBooks />
      <ArtClasses />
      <FreeWorksheet />
      <GraspGuide />
      <Footer />
    </main>
  );
};

export default Index;
