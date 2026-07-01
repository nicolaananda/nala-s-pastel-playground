import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentItem, fetchPublicContent } from "@/lib/cms";
import book1Image from "@/assets/tips-trik-juara-1-lomba-mewarnai-1.jpg?w=600&format=webp&quality=85";
import book1ImageFallback from "@/assets/tips-trik-juara-1-lomba-mewarnai-1.jpg";
import book2Image from "@/assets/NEW-Lets-Coloring-Your-Anime.jpg?w=600&format=webp&quality=85";
import book2ImageFallback from "@/assets/NEW-Lets-Coloring-Your-Anime.jpg";
import book3Image from "@/assets/Coloring_Work_Sheet_Juara1_lomba_mewarnai.jpg?w=600&format=webp&quality=85";
import book3ImageFallback from "@/assets/Coloring_Work_Sheet_Juara1_lomba_mewarnai.jpg";

const fallbackBooks = [
  {
    id: "tips-trik-juara-1-lomba-mewarnai",
    title: "Tips & Trick Juara 1 Lomba Mewarnai",
    description: "Buku pedoman lengkap untuk persiapan lomba mewarnai dengan tips & trik, teknik mewarnai, dan tutorial praktik. Dilengkapi QR Code video tutorial untuk kategori TK & SD.",
    image: book1Image,
    imageFallback: book1ImageFallback,
    price: 110000,
    gradient: "gradient-pink"
  },
  {
    id: "lets-coloring-your-anime",
    title: "LET'S COLORING YOUR ANIME!",
    description: "30 gambar sketsa anime eksklusif dengan tips & trik profesional untuk mewarnai mata, rambut, dan wajah karakter anime. Dilengkapi video tutorial untuk setiap gambar.",
    image: book2Image,
    imageFallback: book2ImageFallback,
    price: 85000,
    gradient: "gradient-pink-blue"
  },
  {
    id: "coloring-worksheet-juara-1-lomba-mewarnai",
    title: "COLORING WORKSHEET JUARA 1 LOMBA MEWARNAI",
    description: "37 gambar sketsa tematik sepanjang tahun dengan tema hari besar, kebudayaan, dan anak. Dilengkapi 6 video tutorial mewarnai yang dapat diakses via QR Code.",
    image: book3Image,
    imageFallback: book3ImageFallback,
    price: 85000,
    gradient: "gradient-blue"
  }
];

const cmsBookToCard = (item: ContentItem) => ({
  id: item.slug,
  title: item.title,
  description: item.description,
  image: item.imageUrl || fallbackBooks[0].image,
  imageFallback: item.imageUrl || fallbackBooks[0].imageFallback,
  price: item.price || 0,
  gradient: String(item.metadata?.gradient || "gradient-pink"),
});

const getGradientClass = (gradient: string) => {
  switch (gradient) {
    case "gradient-pink":
      return "bg-gradient-to-r from-pink-400 via-yellow-400 to-pink-400";
    case "gradient-pink-blue":
      return "bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400";
    case "gradient-blue":
      return "bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500";
    default:
      return "bg-gradient-to-r from-pink-400 via-yellow-400 to-pink-400";
  }
};

const BestSellerBooks = () => {
  const [books, setBooks] = useState(fallbackBooks);

  useEffect(() => {
    fetchPublicContent("book")
      .then((items) => {
        if (items.length) setBooks(items.map(cmsBookToCard));
      })
      .catch(() => setBooks(fallbackBooks));
  }, []);

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
            <Link 
              key={book.id}
              to={`/buku/${book.id}`}
              className="block"
            >
              <Card 
                className="border-2 sm:border-4 border-primary/30 rounded-2xl sm:rounded-3xl shadow-hover hover:shadow-soft transition-all duration-300 hover:scale-110 hover:-rotate-3 hover:border-primary/60 animate-bounce-in bg-gradient-to-br from-card to-accent/10 group cursor-pointer h-full"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className={`h-6 sm:h-8 ${getGradientClass(book.gradient)} rounded-t-2xl sm:rounded-t-3xl`} />
                <CardHeader className="p-4 sm:p-6">
                  <div className="mb-4">
                    <picture>
                      <source srcSet={book.image} type="image/webp" />
                      <img 
                        src={book.imageFallback} 
                        alt={book.title}
                        className="w-full rounded-xl shadow-md object-cover group-hover:shadow-lg transition-shadow duration-300"
                        loading="lazy"
                      />
                    </picture>
                  </div>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                    {book.title}
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-muted-foreground mt-2">
                    {book.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                  <div className="mb-3 text-center">
                    <span className="text-lg sm:text-xl font-bold text-primary">
                      Rp {book.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <button className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary via-yellow-400 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] text-primary-foreground font-bold text-sm sm:text-base rounded-full shadow-hover hover:shadow-soft transition-all duration-500 hover:scale-110 active:scale-95 border-2 sm:border-3 border-foreground/10 touch-manipulation hover:animate-wiggle group/btn">
                    <span className="inline-block group-hover/btn:animate-bounce">📖</span> Lihat Detail
                  </button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestSellerBooks;
