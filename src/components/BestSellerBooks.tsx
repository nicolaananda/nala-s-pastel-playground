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
    <section id="buku-best-seller" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-br from-background via-muted/30 to-accent/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8 sm:mb-12 md:mb-16 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 text-foreground sparkle">
            📚 3 Buku Best Seller
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-primary font-semibold">
            Seri "Juara 1 Lomba Mewarnai" 🏆
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {books.map((book, index) => (
            <Card 
              key={index}
              className="border-2 sm:border-4 border-primary/30 rounded-2xl sm:rounded-3xl shadow-hover hover:shadow-soft transition-all duration-300 hover:scale-110 hover:-rotate-3 hover:border-primary/60 animate-bounce-in bg-gradient-to-br from-card to-accent/10 group cursor-pointer"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className={`h-6 sm:h-8 ${book.gradient} rounded-t-2xl sm:rounded-t-3xl`} />
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                  {book.title}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-muted-foreground mt-2">
                  {book.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                <a 
                  href={book.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary via-yellow-400 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] text-primary-foreground font-bold text-sm sm:text-base rounded-full shadow-hover hover:shadow-soft transition-all duration-500 hover:scale-110 active:scale-95 border-2 sm:border-3 border-foreground/10 touch-manipulation hover:animate-wiggle group/btn">
                    <span className="inline-block group-hover/btn:animate-bounce">🛒</span> Beli Sekarang
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
