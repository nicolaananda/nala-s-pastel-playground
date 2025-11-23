import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import CheckoutForm from "@/components/CheckoutForm";
// @ts-ignore - vite-imagetools handles this
import book1Image from "@/assets/tips-trik-juara-1-lomba-mewarnai-1.jpg?w=800&format=webp&quality=85";
import book1ImageFallback from "@/assets/tips-trik-juara-1-lomba-mewarnai-1.jpg";
// @ts-ignore - vite-imagetools handles this
import book2Image from "@/assets/NEW-Lets-Coloring-Your-Anime.jpg?w=800&format=webp&quality=85";
import book2ImageFallback from "@/assets/NEW-Lets-Coloring-Your-Anime.jpg";
// @ts-ignore - vite-imagetools handles this
import book3Image from "@/assets/Coloring_Work_Sheet_Juara1_lomba_mewarnai.jpg?w=800&format=webp&quality=85";
import book3ImageFallback from "@/assets/Coloring_Work_Sheet_Juara1_lomba_mewarnai.jpg";

const getGradientClass = (bookId: string) => {
  switch (bookId) {
    case "tips-trik-juara-1-lomba-mewarnai":
      return "bg-gradient-to-r from-pink-400 via-yellow-400 to-pink-400";
    case "lets-coloring-your-anime":
      return "bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400";
    case "coloring-worksheet-juara-1-lomba-mewarnai":
      return "bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500";
    default:
      return "bg-gradient-to-r from-pink-400 via-yellow-400 to-pink-400";
  }
};

const books = {
  "tips-trik-juara-1-lomba-mewarnai": {
    title: "Tips & Trick Juara 1 Lomba Mewarnai",
    image: book1Image,
    imageFallback: book1ImageFallback,
    price: 110000,
    description: `Sekarang ini kegiatan lomba mewarnai banyak diadakan di berbagai daerah. Tak hanya acara langsung, tetapi juga telah merambah melalui media social dan online. Ajang ini digunakan sebagai wadah mengasah kreativitas anak dalam tumbuh kembang anak. Untuk menjadi juara 1 lomba mewarnai tentunya dibutuhkan persiapan serta tips dan triknya. Buku ini bisa menjadi pedoman sebagai persiapan untuk mengikuti lomba mewarnai. Lalu apa saja isi bukunya?

**Alat & Bahan**

Sebelum mengikuti lomba mewarnai, ada baiknya kita mengenal terlebih dahulu alat dan bahan dalam mewarnai sebagai persiapan untuk mengikuti lomba. Dilengkapi juga tips dan trik persiapan sebelum lomba dan saat lomba berlangsung.

**Teknik Mewarnai**

Untuk menjadi juara 1 lomba mewarnai tentunya dibutuhkan penggunaan teknik mewarnai yang benar dan kreatif. Dalam buku ini dijelaskan bagaimana teknik-teknik mewarnai dengan krayon, oil pastel, pensil warna, serta proses memahami roda & harmoni warna.

**Mewarnai Objek & Background**

Mewarnai objek dan background menjadi hal yang penting dalam lomba mewarnai. Dalam buku ini terdapat contoh objek-objek yang sering terdapat dalam lomba mewarnai dan latihannya yang disertai panduan warnanya.

**Tutorial Mewarnai & Melengkapi Gambar**

Seringkali lembar saat lomba mewarnai memiliki sedikit objek didalamnya. Menambah & melengkapi gambar merupakan nilai lebih untuk menjadi juara 1. Dalam buku ini kita akan belajar melengkapi gambar untuk kategori TK dan SD serta tema-tema yang sering dilombakan sepanjang tahun dengan disertai QR Code Video tutorialnya.`
  },
  "lets-coloring-your-anime": {
    title: "LET'S COLORING YOUR ANIME!",
    image: book2Image,
    imageFallback: book2ImageFallback,
    price: 79000,
    description: `Temukan pengalaman mewarnai karakter anime yang seru dan edukatif! Buku ini berisi 30 gambar sketsa anime eksklusif yang siap kamu warnai, lengkap dengan tips dan trik profesional untuk menggambar dan mewarnai mata, rambut, serta wajah karakter anime.

**Keunggulan Buku**

1. Berisi 30 gambar sketsa anime.

2. Dilengkapi tips dan trik cara mewarnai mata, rambut, dan wajah karakter anime.

3. Semua gambar dilengkapi dengan video tutorial mewarnai.

4. Finishing jilid spiral agar mudah dilipat saat mewarnai.

5. Dilengkapi papan board di bagian belakang yang berfungsi sebagai alas dan menjaga kestabilan saat mewarnai.`
  },
  "coloring-worksheet-juara-1-lomba-mewarnai": {
    title: "COLORING WORKSHEET JUARA 1 LOMBA MEWARNAI",
    image: book3Image,
    imageFallback: book3ImageFallback,
    price: 79000,
    description: `Buku worksheet mewarnai dengan 37 gambar sketsa tematik sepanjang tahun yang dirancang khusus untuk latihan dan persiapan lomba mewarnai.

**Keunggulan Buku**

1. Berisi 37 Gambar Sketsa Tematik sepanjang tahun.

2. Tema Gambar sangat bervariatif seperti hari-hari besar di Indonesia, Kebudayaan, dan Anak. Malam Tahun Baru, Hari Natal, Takbir Keliling, Hari Paskah, Hari Pahlawan, Hari Kartini, Hari Kebangkitan Nasional, Hari Pendidikan Nasional, Lomba Agustusan, Imlek, Hari Ibu, Liburan Ke Pantai, Sekolah, Luar Angkasa, Kaligrafi, Maulid Nabi Muhammad SAW, Hari Raya Idul Adha, Hari Raya Waisak, Keluarga, Bermain di Timezone, Bermain di Playground, Kebun Binatang, Taman Bermain Dunia Fantasi, Petani di Sawah, Istana Duyung, Unicorn, Batik, Suku Betawi (Jakarta), Suku Jawa (Jawa Tengah & DIY Yogyakarta), Suku Sunda, Suku Minang (Sumatera), Suku Bugis (Sulawesi), Suku Dayak (Kalimantan), Suku Bali (Bali), Suku Papua (Papua), Reog Ponorogo (Jawa Timur).

3. Tema-tema tersebut diambil dari tema yang sering dilombakan dan cocok untuk Latihan lomba mewarnai.

4. Terdapat 6 Video tutorial mewarnai yang menarik dan dapat discan melalui QR Code.`
  }
};

const BookDetail = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const book = bookId ? books[bookId as keyof typeof books] : null;
  const [showCheckout, setShowCheckout] = useState(false);

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">Buku Tidak Ditemukan</h1>
          <p className="mb-4 text-xl text-muted-foreground">Buku yang Anda cari tidak tersedia</p>
          <Link to="/" className="text-primary underline hover:text-primary/90">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6 sm:mb-8 font-semibold transition-colors"
        >
          ← Kembali ke Beranda
        </Link>

        <Card className="border-2 sm:border-4 border-primary/30 rounded-2xl sm:rounded-3xl shadow-hover bg-gradient-to-br from-card to-accent/10">
          <div className={`h-6 sm:h-8 ${getGradientClass(bookId || "")} rounded-t-2xl sm:rounded-t-3xl`} />
          
          <CardHeader className="p-4 sm:p-6 md:p-8">
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              {book.title}
            </CardTitle>
            
            <div className="mb-6">
              <picture>
                <source srcSet={book.image} type="image/webp" />
                <img 
                  src={book.imageFallback} 
                  alt={book.title}
                  className="w-full rounded-xl sm:rounded-2xl shadow-lg object-cover"
                  loading="lazy"
                />
              </picture>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 md:p-8 pt-0">
            <div className="text-base sm:text-lg text-foreground leading-relaxed">
              {book.description.split('\n\n').map((paragraph, index) => {
                const trimmed = paragraph.trim();
                if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                  const title = trimmed.replace(/\*\*/g, '');
                  return (
                    <h3 key={index} className="text-xl sm:text-2xl font-bold text-primary mt-6 mb-3 first:mt-0">
                      {title}
                    </h3>
                  );
                }
                return (
                  <p key={index} className="mb-4 last:mb-0">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t-2 border-primary/20">
              <div className="text-center">
                <div className="mb-4">
                  <span className="text-3xl sm:text-4xl font-bold text-primary">
                    Rp {book.price.toLocaleString('id-ID')}
                  </span>
                </div>
                {!showCheckout ? (
                  <Button
                    onClick={() => setShowCheckout(true)}
                    size="lg"
                    className="w-full sm:w-auto px-8 py-6 text-lg bg-gradient-to-r from-primary via-yellow-400 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0]"
                  >
                    🛒 Beli Sekarang
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checkout Form */}
        {showCheckout && (
          <div className="mt-8">
            <CheckoutForm
              bookId={bookId || ""}
              bookTitle={book.title}
              bookPrice={book.price}
              onPaymentSuccess={(paymentUrl) => {
                window.location.href = paymentUrl;
              }}
            />
          </div>
        )}
      </div>
      
      <Footer />
    </main>
  );
};

export default BookDetail;

