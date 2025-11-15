import cloudBg from "@/assets/cloud-background.jpg";
import nalaLogo from "@/assets/nala-logo.png";

const Hero = () => {
  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${cloudBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Fun overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30" />
      
      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Logo with fun animations */}
        <div className="mb-8 animate-bounce-in">
          <img 
            src={nalaLogo} 
            alt="Nala Art Studio Logo" 
            className="w-48 md:w-64 mx-auto drop-shadow-2xl animate-float"
          />
        </div>

        {/* Title with sparkle effect */}
        <div className="mb-6 animate-fade-in sparkle">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-2 drop-shadow-lg">
            🎨 Nala Art Studio
          </h1>
          <p className="text-3xl md:text-4xl font-semibold text-primary drop-shadow-md">
            My Art Therapy ✨
          </p>
        </div>

        {/* Introduction with fun background */}
        <div 
          className="max-w-4xl mx-auto mb-10 p-8 rounded-3xl bg-card/95 backdrop-blur-sm shadow-hover border-4 border-primary/30 animate-scale-in"
          style={{ animationDelay: '0.2s' }}
        >
          <p className="text-lg md:text-xl text-foreground leading-relaxed whitespace-pre-line font-medium">
            {`Hi, nama ku Nala 👋 Aku adalah seorang guru, penulis, dan content creator. 
Nala Art Studio didirikan pada 14 Juli 2019.

Nala fokus sebagai Art Therapy yang cocok bagi anak-anak maupun dewasa 🎨
Kami menyediakan berbagai kelas menarik mulai dari menggambar, mewarnai, 
melukis, dan digital.

Jangan takut bosan karena kami menyediakan berbagai media mulai dari 
oil pastel 🖍️, pensil warna ✏️, watercolor 💧, gouache 🎨, acrylic marker, alcohol marker, 
hingga iPad/tablet untuk Procreate 📱

Kami ingin menghadirkan suasana belajar seni yang menyenangkan sekaligus 
berorientasi pada prestasi 🏆 Karena itu, kami menghadirkan 3 buku best seller 
seri "Juara 1 Lomba Mewarnai".`}
          </p>
        </div>

        {/* CTA Buttons with fun effects */}
        <div 
          className="flex flex-col sm:flex-row gap-4 justify-center animate-bounce-in"
          style={{ animationDelay: '0.4s' }}
        >
          <a href="#kelas-seni">
            <button className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-full shadow-hover hover:shadow-soft transition-bounce hover:scale-110 border-4 border-foreground/10">
              🎨 Lihat Kelas Seni
            </button>
          </a>
          <a href="#buku-best-seller">
            <button className="px-8 py-4 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold text-lg rounded-full shadow-hover hover:shadow-soft transition-bounce hover:scale-110 border-4 border-foreground/10">
              📚 Beli Buku Best Seller
            </button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
