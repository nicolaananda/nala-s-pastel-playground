// @ts-ignore - vite-imagetools handles this
import cloudBg from "@/assets/cloud-background.jpg?w=1920&format=webp&quality=80";
import cloudBgFallback from "@/assets/cloud-background.jpg";
// @ts-ignore - vite-imagetools handles this
import nalaLogo from "@/assets/nala-logo.png?w=448&format=webp&quality=80";
// @ts-ignore - vite-imagetools handles this
import nalaLogo2x from "@/assets/nala-logo.png?w=896&format=webp&quality=75";
import nalaLogoFallback from "@/assets/nala-logo.png";

const Hero = () => {
  return (
    <section 
      className="relative min-h-[100vh] sm:min-h-screen flex items-center justify-center overflow-hidden py-8 sm:py-0"
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${cloudBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <picture>
          <source srcSet={cloudBg} type="image/webp" />
        <img 
          src={cloudBgFallback} 
          alt="Background awan untuk Nala Art Studio" 
          className="absolute inset-0 w-full h-full object-cover opacity-0"
          loading="eager"
          fetchPriority="high"
          aria-hidden="true"
        />
        </picture>
      </div>
      
      {/* Fun overlay gradient - sangat transparan agar background terlihat jelas */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      {/* Floating emoji decorations for kids */}
      <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-4xl animate-float" style={{ animationDelay: '0s' }}>🎨</div>
        <div className="absolute top-40 right-20 text-3xl animate-float" style={{ animationDelay: '1s' }}>✨</div>
        <div className="absolute bottom-40 left-20 text-4xl animate-float" style={{ animationDelay: '2s' }}>🌈</div>
        <div className="absolute bottom-60 right-10 text-3xl animate-float" style={{ animationDelay: '1.5s' }}>🖍️</div>
        <div className="absolute top-60 left-1/4 text-3xl animate-float" style={{ animationDelay: '0.5s' }}>⭐</div>
        <div className="absolute bottom-80 right-1/3 text-4xl animate-float" style={{ animationDelay: '2.5s' }}>🎭</div>
        <div className="absolute top-1/3 right-1/4 text-3xl animate-float" style={{ animationDelay: '1.2s' }}>💫</div>
        <div className="absolute bottom-1/4 left-1/3 text-3xl animate-float" style={{ animationDelay: '0.8s' }}>🦄</div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 text-center">
        {/* Logo with fun animations */}
        <div className="mb-6 sm:mb-8 animate-bounce-in">
          <picture>
            <source 
              srcSet={`${nalaLogo} 448w, ${nalaLogo2x} 896w`}
              sizes="(max-width: 640px) 256px, (max-width: 768px) 320px, (max-width: 1024px) 384px, 448px"
              type="image/webp" 
            />
            <img 
              src={nalaLogoFallback} 
              alt="Nala Art Studio Logo" 
              className="w-64 sm:w-80 md:w-96 lg:w-[28rem] mx-auto drop-shadow-2xl animate-float"
              loading="eager"
              fetchPriority="high"
              width="448"
              height="448"
              sizes="(max-width: 640px) 256px, (max-width: 768px) 320px, (max-width: 1024px) 384px, 448px"
            />
          </picture>
        </div>

        {/* Title with sparkle effect */}
        <div className="mb-4 sm:mb-6 animate-fade-in sparkle">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-2 drop-shadow-lg leading-tight animate-pulse-slow hover:scale-105 transition-transform duration-300 cursor-default">
            🎨 Nala Art Studio
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-primary drop-shadow-md animate-wiggle hover:scale-110 transition-transform duration-300 inline-block cursor-default">
            My Art Therapy ✨
          </p>
        </div>

        {/* Introduction with fun background */}
        <div 
          className="max-w-4xl mx-auto mb-6 sm:mb-10 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-card/95 backdrop-blur-sm shadow-hover border-2 sm:border-4 border-primary/30 animate-scale-in"
          style={{ animationDelay: '0.2s' }}
        >
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-foreground leading-relaxed whitespace-pre-line font-medium">
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
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-bounce-in px-2"
          style={{ animationDelay: '0.4s' }}
        >
          <a href="#kelas-seni" className="w-full sm:w-auto group">
            <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary via-yellow-400 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] text-primary-foreground font-bold text-base sm:text-lg rounded-full shadow-hover hover:shadow-soft transition-all duration-500 hover:scale-110 active:scale-95 border-2 sm:border-4 border-foreground/10 touch-manipulation hover:animate-wiggle">
              <span className="inline-block group-hover:animate-bounce">🎨</span> Lihat Kelas Seni
            </button>
          </a>
          <a href="#buku-best-seller" className="w-full sm:w-auto group">
            <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-secondary via-orange-300 to-secondary bg-[length:200%_100%] hover:bg-[position:100%_0] text-secondary-foreground font-bold text-base sm:text-lg rounded-full shadow-hover hover:shadow-soft transition-all duration-500 hover:scale-110 active:scale-95 border-2 sm:border-4 border-foreground/10 touch-manipulation hover:animate-wiggle">
              <span className="inline-block group-hover:animate-bounce">📚</span> Beli Buku Best Seller
            </button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
