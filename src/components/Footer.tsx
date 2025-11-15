import { Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-8 sm:py-10 md:py-12 px-4 sm:px-6 bg-gradient-to-t from-accent/50 to-background border-t border-border">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className="text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">
              Nala Art Studio
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Art Therapy untuk Anak & Dewasa
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-3 sm:gap-4 w-full md:w-auto">
            <a 
              href="https://instagram.com/nala_art_studio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-gradient-pink-blue text-foreground font-semibold text-sm sm:text-base shadow-soft hover:shadow-hover transition-smooth hover:scale-105 active:scale-95 group touch-manipulation w-full sm:w-auto justify-center"
            >
              <Instagram className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
              @nala_art_studio
            </a>
            
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} Nala Art Studio. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
