import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <section id="buku-best-seller" className="py-20 px-4 bg-gradient-to-br from-background via-muted/30 to-accent/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground sparkle">
            📚 3 Buku Best Seller
          </h2>
          <p className="text-xl md:text-2xl text-primary font-semibold">
            Seri "Juara 1 Lomba Mewarnai" 🏆
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {books.map((book, index) => (
            <Card 
              key={index}
              className="border-4 border-primary/30 rounded-3xl shadow-hover hover:shadow-soft transition-bounce hover:scale-105 hover:-rotate-2 animate-bounce-in bg-gradient-to-br from-card to-accent/10"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className={`h-8 ${book.gradient} rounded-t-3xl`} />
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {book.title}
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  {book.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                <a 
                  href={book.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full shadow-hover hover:shadow-soft transition-bounce hover:scale-110 border-3 border-foreground/10">
                    🛒 Beli Sekarang
                  </button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestSellerBooks;
