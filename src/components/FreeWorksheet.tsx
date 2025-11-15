import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const FreeWorksheet = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-accent/30">
      <div className="container mx-auto max-w-4xl text-center animate-fade-in">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
          🖍️ Free Coloring Worksheet
        </h2>
        <p className="text-xl text-muted-foreground mb-8">
          Download lembar mewarnai gratis untuk latihan di rumah
        </p>
        
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-primary/20 rounded-3xl p-8 border-2 border-primary shadow-soft hover:shadow-hover transition-smooth">
            <div className="text-6xl mb-4">🎨</div>
            <p className="font-semibold text-foreground">Worksheet 1</p>
            <p className="text-sm text-muted-foreground">Karakter Lucu</p>
          </div>
          <div className="bg-secondary/20 rounded-3xl p-8 border-2 border-secondary shadow-soft hover:shadow-hover transition-smooth">
            <div className="text-6xl mb-4">🌈</div>
            <p className="font-semibold text-foreground">Worksheet 2</p>
            <p className="text-sm text-muted-foreground">Pemandangan Alam</p>
          </div>
        </div>
        
        <Button 
          size="lg"
          className="rounded-full text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-foreground shadow-soft hover:shadow-hover transition-smooth hover:scale-105 group"
        >
          <Download className="mr-2 w-5 h-5 group-hover:translate-y-1 transition-transform" />
          Download Gratis
        </Button>
      </div>
    </section>
  );
};

export default FreeWorksheet;
