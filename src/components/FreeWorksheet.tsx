import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const FreeWorksheet = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-b from-background to-accent/30">
      <div className="container mx-auto max-w-4xl text-center animate-fade-in">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-foreground">
          🖍️ Free Coloring Worksheet
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 px-2">
          Download lembar mewarnai gratis untuk latihan di rumah
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-primary/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-primary shadow-soft hover:shadow-hover transition-all duration-300 hover:scale-110 hover:rotate-2 cursor-pointer group">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4 group-hover:animate-bounce inline-block">🎨</div>
            <p className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">Worksheet 1</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Karakter Lucu</p>
          </div>
          <div className="bg-secondary/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-secondary shadow-soft hover:shadow-hover transition-all duration-300 hover:scale-110 hover:-rotate-2 cursor-pointer group">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4 group-hover:animate-bounce inline-block">🌈</div>
            <p className="font-semibold text-sm sm:text-base text-foreground group-hover:text-secondary transition-colors">Worksheet 2</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Pemandangan Alam</p>
          </div>
        </div>
        
        <Button 
          size="lg"
          className="rounded-full text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-primary via-yellow-400 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] text-foreground shadow-soft hover:shadow-hover transition-all duration-500 hover:scale-110 active:scale-95 group touch-manipulation w-full sm:w-auto hover:animate-wiggle"
        >
          <Download className="mr-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-y-1 group-hover:animate-bounce transition-transform inline-block" />
          Download Gratis
        </Button>
      </div>
    </section>
  );
};

export default FreeWorksheet;
