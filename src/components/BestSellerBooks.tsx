import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

const books = [
  {
    title: "Tips & Trick Juara 1 Lomba Mewarnai",
    description: "Kegiatan lomba mewarnai kini banyak diadakan, baik offline maupun online. Buku ini memberikan tips dan trik lengkap agar anak lebih siap mengikuti lomba dan meningkatkan kreativitasnya.",
    link: "https://ruangkata.com/product/tips-dan-trik-juara-1-lomba-mewarnai/",
    gradient: "gradient-pink"
  },
  {
    title: "Let's Coloring Your Anime",
    description: "Buku mewarnai karakter anime favorit dengan teknik pewarnaan yang menyenangkan dan mudah diikuti.",
    link: "https://ruangkata.com/product/lets-coloring-your-anime/",
    gradient: "gradient-pink-blue"
  },
  {
    title: "Coloring Worksheet Juara 1 Lomba Mewarnai",
    description: "Lembar kerja mewarnai yang dirancang khusus untuk latihan dan persiapan lomba mewarnai.",
    link: "https://ruangkata.com/product/coloring-worksheet-juara-1-lomba-mewarnai/",
    gradient: "gradient-blue"
  }
];

const BestSellerBooks = () => {
  return (
    <section id="buku-best-seller" className="py-20 px-4 bg-gradient-to-b from-accent/30 to-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            📚 3 Buku Best Seller
          </h2>
          <p className="text-2xl md:text-3xl font-semibold bg-gradient-pink-blue bg-clip-text text-transparent">
            Seri Juara 1 Lomba Mewarnai
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {books.map((book, index) => (
            <Card 
              key={index}
              className="border-2 border-border rounded-3xl shadow-soft hover:shadow-hover transition-smooth hover:scale-105 animate-scale-in overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`h-4 ${book.gradient}`} />
              <CardHeader className="space-y-4">
                <CardTitle className="text-xl font-bold text-foreground leading-tight">
                  {book.title}
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground leading-relaxed">
                  {book.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full rounded-full bg-primary hover:bg-primary/90 text-foreground shadow-soft hover:shadow-hover transition-smooth group"
                  onClick={() => window.open(book.link, '_blank')}
                >
                  <span>Beli Sekarang</span>
                  <ExternalLink className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestSellerBooks;
