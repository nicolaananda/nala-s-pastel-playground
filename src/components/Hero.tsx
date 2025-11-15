import { Button } from "@/components/ui/button";
import cloudBg from "@/assets/cloud-background.jpg";
import nalaLogo from "@/assets/nala-logo.png";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Cloud Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${cloudBg})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Logo */}
          <div className="animate-float">
            <img 
              src={nalaLogo} 
              alt="Nala Art Studio Logo" 
              className="w-48 h-48 mx-auto object-contain drop-shadow-lg"
            />
          </div>
          
          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold text-foreground drop-shadow-sm">
            Nala Art Studio
          </h1>
          <p className="text-3xl md:text-4xl font-semibold bg-gradient-pink-blue bg-clip-text text-transparent drop-shadow-sm">
            My Art Therapy
          </p>
          
          {/* Introduction */}
          <div className="bg-background/90 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-soft max-w-3xl mx-auto">
            <p className="text-lg md:text-xl leading-relaxed text-foreground/90">
              Hi, nama ku <span className="font-bold text-primary">Nala</span>. Aku adalah seorang guru, penulis, dan content creator.
            </p>
            <p className="text-lg md:text-xl leading-relaxed text-foreground/90 mt-4">
              <span className="font-bold">Nala Art Studio</span> didirikan pada <span className="font-semibold">14 Juli 2019</span>.
            </p>
            <p className="text-base md:text-lg leading-relaxed text-foreground/80 mt-6">
              Nala fokus sebagai <span className="font-semibold text-primary">Art Therapy</span> yang cocok bagi anak-anak maupun dewasa. 
              Kami menyediakan berbagai kelas menarik mulai dari menggambar, mewarnai, melukis, dan digital.
            </p>
            <p className="text-base md:text-lg leading-relaxed text-foreground/80 mt-4">
              Jangan takut bosan karena kami menyediakan berbagai media mulai dari oil pastel, pensil warna, watercolor, gouache, acrylic marker, alcohol marker, hingga iPad/tablet untuk Procreate.
            </p>
            <p className="text-base md:text-lg leading-relaxed text-foreground/80 mt-4">
              Kami ingin menghadirkan suasana belajar seni yang menyenangkan sekaligus berorientasi pada prestasi. Karena itu, kami menghadirkan <span className="font-bold text-secondary">3 buku best seller seri "Juara 1 Lomba Mewarnai"</span>.
            </p>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="rounded-full text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-foreground shadow-soft hover:shadow-hover transition-smooth hover:scale-105"
              onClick={() => document.getElementById('kelas-seni')?.scrollIntoView({ behavior: 'smooth' })}
            >
              ✨ Lihat Kelas Seni
            </Button>
            <Button 
              size="lg" 
              variant="secondary"
              className="rounded-full text-lg px-8 py-6 bg-secondary hover:bg-secondary/90 text-foreground shadow-soft hover:shadow-hover transition-smooth hover:scale-105"
              onClick={() => document.getElementById('buku-best-seller')?.scrollIntoView({ behavior: 'smooth' })}
            >
              📚 Beli Buku Best Seller
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
