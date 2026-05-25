import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ShirtCheckoutForm from "@/components/ShirtCheckoutForm";
// @ts-ignore - vite-imagetools handles this
import shirtImg from "@/assets/desain_baju.jpeg?w=600&format=webp&quality=80";
import shirtImgFallback from "@/assets/desain_baju.jpeg";
// @ts-ignore - vite-imagetools handles this
import shirtSampleImg from "@/assets/desain_size.jpeg?w=600&format=webp&quality=80";
import shirtSampleImgFallback from "@/assets/desain_size.jpeg";
// @ts-ignore - vite-imagetools handles this
import sizeAnakImg from "@/assets/size_anak.jpeg?w=900&format=webp&quality=85";
import sizeAnakImgFallback from "@/assets/size_anak.jpeg";
// @ts-ignore - vite-imagetools handles this
import sizeDewasaImg from "@/assets/size_dewasa.jpeg?w=900&format=webp&quality=85";
import sizeDewasaImgFallback from "@/assets/size_dewasa.jpeg";

const SHIRT = {
  id: "baju-nala",
  title: "Baju Artstudio Nala",
  priceAnak: 60000,
  priceDewasa: 80000,
};

type SizeCategory = "anak" | "dewasa" | null;

const SIZE_CHART_ANAK = [
  { size: "0", age: "0–2 thn", dimension: "31 × 46 cm" },
  { size: "1", age: "3–5 thn", dimension: "34 × 48 cm" },
  { size: "2", age: "6–8 thn", dimension: "38 × 51 cm" },
  { size: "3", age: "9–10 thn", dimension: "43 × 54 cm" },
];

const SIZE_CHART_DEWASA = [
  { size: "XS", dimension: "46 × 66 cm" },
  { size: "S", dimension: "48 × 68 cm" },
  { size: "M", dimension: "50 × 70 cm" },
  { size: "L", dimension: "52 × 72 cm" },
  { size: "XL", dimension: "54 × 74 cm" },
  { size: "2XL", dimension: "56 × 76 cm" },
  { size: "3XL", dimension: "58 × 78 cm" },
];

const Merchandise = () => {
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [sizeCategory, setSizeCategory] = useState<SizeCategory>(null);
  const [isSampleOpen, setIsSampleOpen] = useState(false);

  const handlePaymentSuccess = (paymentUrl: string) => {
    setIsOrderOpen(false);
    window.location.href = paymentUrl;
  };

  return (
    <section
      id="merchandise"
      className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-br from-muted/30 via-background to-accent/20"
    >
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-6 sm:mb-10 animate-fade-in sparkle">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 text-foreground">
            👕 Baju Nala
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-primary font-semibold">
            Tersedia untuk anak & dewasa
          </p>
        </div>

        <Card className="border-2 sm:border-4 border-primary/30 rounded-2xl sm:rounded-3xl shadow-hover overflow-hidden bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-0 items-center">
            {/* Image — compact (2/5) */}
            <button
              type="button"
              onClick={() => setIsSampleOpen(true)}
              className="sm:col-span-2 bg-muted/20 p-4 hover:bg-muted/30 transition-colors group"
              aria-label="Lihat foto baju lebih besar"
            >
              <picture>
                <source srcSet={shirtImg} type="image/webp" />
                <img
                  src={shirtImgFallback}
                  alt="Desain Baju Nala"
                  className="w-full max-w-[280px] mx-auto h-auto object-contain rounded-xl group-hover:scale-105 transition-transform"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
              <p className="text-xs text-center text-muted-foreground mt-2">
                🔍 Klik untuk lihat lebih besar
              </p>
            </button>

            {/* Info — 3/5 */}
            <CardContent className="sm:col-span-3 p-5 sm:p-6 md:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                {SHIRT.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Baju eksklusif Artstudio Nala untuk anak maupun dewasa.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border-2 border-primary/20 bg-pink-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Anak</p>
                  <p className="text-lg sm:text-xl font-bold text-primary">
                    Rp {SHIRT.priceAnak.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Size 0 – 3 (0-10th)</p>
                </div>
                <div className="rounded-xl border-2 border-primary/20 bg-blue-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Dewasa</p>
                  <p className="text-lg sm:text-xl font-bold text-primary">
                    Rp {SHIRT.priceDewasa.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">XS – 3XL</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => setIsOrderOpen(true)}
                  size="lg"
                  className="flex-1"
                >
                  🛒 Pesan Sekarang
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => setSizeCategory("anak")}
                  >
                    📏 Size Anak
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => setSizeCategory("dewasa")}
                  >
                    📏 Size Dewasa
                  </Button>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Order Dialog */}
      <Dialog open={isOrderOpen} onOpenChange={setIsOrderOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pemesanan Baju</DialogTitle>
            <DialogDescription>
              Lengkapi form berikut untuk melanjutkan pembayaran
            </DialogDescription>
          </DialogHeader>
          <ShirtCheckoutForm
            shirtId={SHIRT.id}
            shirtTitle={SHIRT.title}
            priceAnak={SHIRT.priceAnak}
            priceDewasa={SHIRT.priceDewasa}
            onPaymentSuccess={handlePaymentSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Size Chart Dialog */}
      <Dialog open={!!sizeCategory} onOpenChange={(open) => !open && setSizeCategory(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              📏 Size Chart {sizeCategory === "anak" ? "Anak" : "Dewasa"}
            </DialogTitle>
            <DialogDescription>
              Cek ukuran sebelum memesan
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl overflow-hidden bg-white border-2 border-primary/10">
            {sizeCategory === "anak" && (
              <picture>
                <source srcSet={sizeAnakImg} type="image/webp" />
                <img
                  src={sizeAnakImgFallback}
                  alt="Size chart anak"
                  className="w-full h-auto object-contain"
                />
              </picture>
            )}
            {sizeCategory === "dewasa" && (
              <picture>
                <source srcSet={sizeDewasaImg} type="image/webp" />
                <img
                  src={sizeDewasaImgFallback}
                  alt="Size chart dewasa"
                  className="w-full h-auto object-contain"
                />
              </picture>
            )}
          </div>

          {/* Tabel teks (selalu tampil) */}
          {sizeCategory === "anak" && (
            <div className="rounded-2xl border-2 border-primary/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-primary/10 text-foreground">
                  <tr>
                    <th className="text-left p-3 font-semibold">Size</th>
                    <th className="text-left p-3 font-semibold">Usia</th>
                    <th className="text-left p-3 font-semibold">Lebar × Panjang</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_CHART_ANAK.map((row) => (
                    <tr key={row.size} className="odd:bg-muted/20">
                      <td className="p-3 font-bold text-primary">{row.size}</td>
                      <td className="p-3">{row.age}</td>
                      <td className="p-3">{row.dimension}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-3 py-2 text-xs text-muted-foreground bg-muted/20 border-t border-primary/10">
                Toleransi ukuran: selisih 1–2 cm.
              </p>
            </div>
          )}

          {sizeCategory === "dewasa" && (
            <div className="rounded-2xl border-2 border-primary/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-primary/10 text-foreground">
                  <tr>
                    <th className="text-left p-3 font-semibold">Size</th>
                    <th className="text-left p-3 font-semibold">Lebar × Panjang</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_CHART_DEWASA.map((row) => (
                    <tr key={row.size} className="odd:bg-muted/20">
                      <td className="p-3 font-bold text-primary">{row.size}</td>
                      <td className="p-3">{row.dimension}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-3 py-2 text-xs text-muted-foreground bg-muted/20 border-t border-primary/10">
                Toleransi ukuran: selisih 1–2 cm.
              </p>
            </div>
          )}
          <Button
            onClick={() => {
              setSizeCategory(null);
              setIsOrderOpen(true);
            }}
            size="lg"
            className="w-full mt-2"
          >
            🛒 Pesan Sekarang
          </Button>
        </DialogContent>
      </Dialog>

      {/* Sample/Bigger Photo Dialog */}
      <Dialog open={isSampleOpen} onOpenChange={setIsSampleOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{SHIRT.title}</DialogTitle>
            <DialogDescription>Foto desain & sampel</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl overflow-hidden bg-white border-2 border-primary/10">
              <picture>
                <source srcSet={shirtImg} type="image/webp" />
                <img
                  src={shirtImgFallback}
                  alt="Desain Baju Nala"
                  className="w-full h-auto object-contain"
                />
              </picture>
            </div>
            <div className="rounded-2xl overflow-hidden bg-white border-2 border-primary/10">
              <picture>
                <source srcSet={shirtSampleImg} type="image/webp" />
                <img
                  src={shirtSampleImgFallback}
                  alt="Sampel Baju"
                  className="w-full h-auto object-contain"
                />
              </picture>
            </div>
          </div>
          <Button
            onClick={() => {
              setIsSampleOpen(false);
              setIsOrderOpen(true);
            }}
            size="lg"
            className="w-full mt-2"
          >
            🛒 Pesan Sekarang
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Merchandise;
