import { Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 px-4 bg-gradient-to-t from-accent/50 to-background border-t border-border">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Nala Art Studio
            </h3>
            <p className="text-muted-foreground">
              Art Therapy untuk Anak & Dewasa
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <a 
              href="https://instagram.com/nala_art_studio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-pink-blue text-foreground font-semibold shadow-soft hover:shadow-hover transition-smooth hover:scale-105 group"
            >
              <Instagram className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              @nala_art_studio
            </a>
            
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} Nala Art Studio. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
