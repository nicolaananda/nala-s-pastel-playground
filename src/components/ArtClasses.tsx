import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ClassRegistrationForm from "@/components/ClassRegistrationForm";
// @ts-ignore - vite-imagetools handles this
import beginnerImg from "@/assets/begin.jpeg?w=400&format=webp&quality=65";
import beginnerImgFallback from "@/assets/begin.jpeg";
// @ts-ignore - vite-imagetools handles this
import beginnerDrawingImg from "@/assets/begsed.jpeg?w=400&format=webp&quality=65";
import beginnerDrawingImgFallback from "@/assets/begsed.jpeg";
// @ts-ignore - vite-imagetools handles this
import intermediateDrawingImg from "@/assets/interkolor.jpeg?w=400&format=webp&quality=65";
import intermediateDrawingImgFallback from "@/assets/interkolor.jpeg";

const classes = [
  {
    id: "coloring-silky-crayon",
    level: "Coloring Silky Crayon",
    image: beginnerImg,
    imageFallback: beginnerImgFallback,
    description: "Kelas mewarnai dengan silky crayon.",
    schedule: "Kamis, 14.00 WIB",
    topics: [],
    gradient: "gradient-pink",
    price: 150000,
  },
  {
    id: "drawing-chibi-acrylic-marker",
    level: "Drawing Chibi Acrylic Marker",
    image: beginnerDrawingImg,
    imageFallback: beginnerDrawingImgFallback,
    description: "Menggambar karakter chibi dengan acrylic marker.",
    schedule: "Jumat, 19.00 WIB",
    topics: [],
    gradient: "gradient-pink-blue",
    price: 150000,
  },
  {
    id: "melengkapi-gambar-mewarnai",
    level: "Melengkapi Gambar & Mewarnai",
    image: intermediateDrawingImg,
    imageFallback: intermediateDrawingImgFallback,
    description: "Latihan melengkapi gambar dan mewarnai.",
    schedule: "Sabtu, 16.00 WIB",
    topics: [],
    gradient: "gradient-blue",
    price: 150000,
  },
];

const ArtClasses = () => {
  const [selectedClass, setSelectedClass] = useState<typeof classes[0] | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRegisterClick = (artClass: typeof classes[0]) => {
    setSelectedClass(artClass);
    setIsDialogOpen(true);
  };

  const handlePaymentSuccess = (paymentUrl: string) => {
    setIsDialogOpen(false);
    window.location.href = paymentUrl;
  };

  return (
    <section id="kelas-seni" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-br from-accent/20 via-background to-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8 sm:mb-12 md:mb-16 animate-fade-in sparkle">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 text-foreground">
            🎨 Kelas Seni Nala
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-primary font-semibold">
            Pilih level sesuai kemampuanmu 🌟
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {classes.map((artClass, index) => (
            <Card
              key={artClass.id}
              className="border-2 sm:border-4 border-primary/30 rounded-2xl sm:rounded-3xl shadow-hover hover:shadow-soft transition-all duration-300 hover:scale-105 hover:border-primary/60 animate-bounce-in overflow-hidden bg-white group"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Banner Header */}
              <div className={`h-12 sm:h-14 ${artClass.gradient} flex items-center justify-center`}>
                <p className="text-white font-bold text-sm sm:text-base px-4 text-center">
                  {artClass.level.toUpperCase()}
                </p>
              </div>

              {artClass.image ? (
                <div className="h-48 sm:h-56 overflow-hidden bg-muted">
                  <picture>
                    <source
                      srcSet={artClass.image}
                      type="image/webp"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    />
                    <img
                      src={artClass.imageFallback || artClass.image}
                      alt={artClass.level}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                      decoding="async"
                      width="400"
                      height="224"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    />
                  </picture>
                </div>
              ) : (
                <div className={`h-48 sm:h-56 ${artClass.gradient} group-hover:scale-110 transition-transform duration-500`} />
              )}

              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2">
                  {artClass.level}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-muted-foreground mb-3">
                  {artClass.description}
                </CardDescription>

                {/* Schedule */}
                <div className="mb-4 flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground bg-accent/30 rounded-lg px-3 py-2">
                  <span>📅</span>
                  <span>{artClass.schedule}</span>
                </div>

                {/* Price Section */}
                <div className="mb-4">
                  <span className="text-2xl sm:text-3xl font-bold text-primary">
                    Rp {artClass.price.toLocaleString("id-ID")}
                  </span>
                </div>
              </CardHeader>

              {artClass.topics.length > 0 && (
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="font-semibold text-sm sm:text-base text-foreground mb-2 sm:mb-3">Berisi:</p>
                  <ul className="space-y-1.5 sm:space-y-2 mb-4">
                    {artClass.topics.map((topic, idx) => (
                      <li key={idx} className="flex items-start text-sm sm:text-base text-muted-foreground">
                        <span className="text-primary mr-2 flex-shrink-0 inline-block">✨</span>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}

              {/* Register Button */}
              <CardContent className="p-4 sm:p-6 pt-0">
                <Button
                  onClick={() => handleRegisterClick(artClass)}
                  className="w-full"
                  size="lg"
                  variant="default"
                >
                  📝 Daftar Kelas
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Registration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pendaftaran Kelas</DialogTitle>
            <DialogDescription>
              Lengkapi form berikut untuk mendaftar kelas
            </DialogDescription>
          </DialogHeader>
          {selectedClass && (
            <ClassRegistrationForm
              classId={selectedClass.id}
              className={selectedClass.level}
              classPrice={selectedClass.price}
              classSchedule={selectedClass.schedule}
              onPaymentSuccess={handlePaymentSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ArtClasses;
