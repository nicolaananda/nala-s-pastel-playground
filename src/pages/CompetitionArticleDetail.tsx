import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { competitionArticles } from "@/data/competitionArticles";
import { Calendar, MapPin, Trophy } from "lucide-react";

const CompetitionArticleDetail = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const article = competitionArticles.find(a => a.id === articleId);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">Artikel Tidak Ditemukan</h1>
          <p className="mb-4 text-xl text-muted-foreground">Artikel yang Anda cari tidak tersedia</p>
          <Link to="/berita-lomba" className="text-primary underline hover:text-primary/90">
            Kembali ke Berita Lomba
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Navigation */}
        <div className="mb-6 sm:mb-8">
          <Link 
            to="/berita-lomba" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            ← Kembali ke Berita Lomba
          </Link>
        </div>

        {/* Article Card */}
        <Card className="border-2 sm:border-4 border-primary/30 rounded-2xl sm:rounded-3xl shadow-hover bg-gradient-to-br from-card to-accent/10">
          <div className="h-6 sm:h-8 bg-gradient-to-r from-primary via-yellow-400 to-primary rounded-t-2xl sm:rounded-t-3xl" />
          
          <CardHeader className="p-4 sm:p-6 md:p-8">
            {article.featured && (
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs sm:text-sm font-bold rounded-full">
                  ⭐ Featured
                </span>
              </div>
            )}

            <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              {article.title}
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{article.date}</span>
              </div>
              {article.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{article.location}</span>
                </div>
              )}
            </div>

            {/* Photos Gallery */}
            {article.photos.length > 0 && (
              <div className="mb-6 space-y-4">
                {article.photos.map((photo, index) => (
                  <div key={index} className="rounded-xl overflow-hidden shadow-lg">
                    <picture>
                      <source srcSet={photo.src} type="image/webp" />
                      <img 
                        src={photo.srcFallback} 
                        alt={photo.alt}
                        className="w-full object-cover"
                        loading="lazy"
                      />
                    </picture>
                    {photo.caption && (
                      <p className="text-sm text-muted-foreground mt-2 px-2 text-center italic">
                        {photo.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div className="text-base sm:text-lg text-foreground leading-relaxed whitespace-pre-line">
                {article.content.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </CardHeader>

          {/* Winners Section */}
          {article.winners.length > 0 && (
            <CardContent className="p-4 sm:p-6 md:p-8 pt-0">
              <div className="mt-8 pt-6 border-t-2 border-primary/20">
                <div className="flex items-center gap-2 mb-6">
                  <Trophy className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl sm:text-3xl font-bold text-primary">
                    🏆 Dokumentasi Pemenang
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {article.winners.map((winner, index) => (
                    <Card 
                      key={index}
                      className="border-2 border-primary/30 rounded-xl shadow-md bg-gradient-to-br from-card to-accent/10 text-center"
                    >
                      <CardHeader className="p-4 sm:p-6">
                        {winner.photo ? (
                          <div className="mb-4">
                            <picture>
                              <source srcSet={winner.photo} type="image/webp" />
                              <img 
                                src={winner.photoFallback || winner.photo} 
                                alt={`${winner.name} - ${winner.position}`}
                                className="w-full rounded-lg shadow-md object-cover"
                                loading="lazy"
                              />
                            </picture>
                          </div>
                        ) : (
                          <div className="mb-4 h-32 sm:h-40 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-primary/50" />
                          </div>
                        )}
                        <CardTitle className="text-lg sm:text-xl font-bold text-primary mb-1">
                          {winner.position}
                        </CardTitle>
                        <p className="text-sm sm:text-base text-foreground font-semibold">
                          {winner.name}
                        </p>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
      
      <Footer />
    </main>
  );
};

export default CompetitionArticleDetail;

