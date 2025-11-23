import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { competitionArticles } from "@/data/competitionArticles";
import { Calendar, MapPin } from "lucide-react";

const CompetitionNews = () => {
  // Sort articles by date (newest first)
  const sortedArticles = [...competitionArticles].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-foreground sparkle">
            🏆 Berita Lomba Mewarnai Nala
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-primary font-semibold">
            Dokumentasi & Laporan Lomba Mewarnai Bersama Nala
          </p>
        </div>

        {/* Back to Home Link */}
        <div className="mb-6 sm:mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            ← Kembali ke Beranda
          </Link>
        </div>

        {/* Articles Grid */}
        {sortedArticles.length === 0 ? (
          <Card className="border-2 border-primary/30 rounded-2xl shadow-hover bg-gradient-to-br from-card to-accent/10 p-8 text-center">
            <p className="text-lg text-muted-foreground">
              Belum ada artikel berita lomba. Artikel akan ditambahkan segera! 🎨
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {sortedArticles.map((article, index) => (
              <Link 
                key={article.id}
                to={`/berita-lomba/${article.id}`}
                className="block"
              >
                <Card 
                  className="border-2 sm:border-4 border-primary/30 rounded-2xl sm:rounded-3xl shadow-hover hover:shadow-soft transition-all duration-300 hover:scale-105 hover:border-primary/60 animate-bounce-in bg-gradient-to-br from-card to-accent/10 group cursor-pointer h-full"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="h-6 sm:h-8 bg-gradient-to-r from-primary via-yellow-400 to-primary rounded-t-2xl sm:rounded-t-3xl" />
                  
                  <CardHeader className="p-4 sm:p-6">
                    {article.featured && (
                      <div className="mb-2">
                        <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs sm:text-sm font-bold rounded-full">
                          ⭐ Featured
                        </span>
                      </div>
                    )}
                    
                    <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 mb-3">
                      {article.title}
                    </CardTitle>
                    
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm sm:text-base text-muted-foreground mb-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{article.date}</span>
                      </div>
                      {article.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span>{article.location}</span>
                        </div>
                      )}
                    </div>

                    {article.photos.length > 0 && (
                      <div className="mb-4">
                        <picture>
                          <source srcSet={article.photos[0].src} type="image/webp" />
                          <img 
                            src={article.photos[0].srcFallback} 
                            alt={article.photos[0].alt}
                            className="w-full rounded-xl shadow-md object-cover group-hover:shadow-lg transition-shadow duration-300"
                            loading="lazy"
                          />
                        </picture>
                      </div>
                    )}

                    <CardDescription className="text-sm sm:text-base text-muted-foreground line-clamp-4">
                      {article.content.substring(0, 200)}...
                    </CardDescription>

                    {article.winners.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-primary/20">
                        <p className="text-xs sm:text-sm font-semibold text-primary mb-2">
                          🏆 Pemenang:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {article.winners.slice(0, 3).map((winner, idx) => (
                            <span 
                              key={idx}
                              className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
                            >
                              {winner.position}: {winner.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-0 p-4 sm:p-6">
                    <button className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary via-yellow-400 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] text-primary-foreground font-bold text-sm sm:text-base rounded-full shadow-hover hover:shadow-soft transition-all duration-500 hover:scale-110 active:scale-95 border-2 sm:border-3 border-foreground/10 touch-manipulation hover:animate-wiggle group/btn">
                      <span className="inline-block group-hover/btn:animate-bounce">📖</span> Baca Selengkapnya
                    </button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </main>
  );
};

export default CompetitionNews;

