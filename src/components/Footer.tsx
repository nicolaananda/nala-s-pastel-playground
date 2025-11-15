import { Instagram, Youtube, ShoppingBag } from "lucide-react";

// TikTok Icon Component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const Footer = () => {
  const socialLinks = [
    {
      name: "Instagram",
      url: "https://www.instagram.com/artstudio.nala?igsh=MWN1dHhnbTdtM2xqbA%3D%3D&utm_source=qr",
      icon: Instagram,
      color: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500",
      username: "@artstudio.nala"
    },
    {
      name: "TikTok",
      url: "https://www.tiktok.com/@artstudio.nala?_r=1&_t=ZS-91QNTTACQsi",
      icon: TikTokIcon,
      color: "bg-black",
      username: "@artstudio.nala"
    },
    {
      name: "YouTube",
      url: "https://youtube.com/@artstudionala?si=Vz9Couc3J8XTurzs",
      icon: Youtube,
      color: "bg-gradient-to-r from-red-600 to-red-500",
      username: "@artstudionala"
    },
    {
      name: "Shopee",
      url: "https://s.shopee.co.id/9pWW2rnsVW",
      icon: ShoppingBag,
      color: "bg-gradient-to-r from-orange-500 to-orange-400",
      username: "Shopee Store"
    }
  ];

  return (
    <footer className="py-8 sm:py-10 md:py-12 px-4 sm:px-6 bg-gradient-to-t from-accent/50 to-background border-t border-border">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 sm:gap-8">
          {/* Brand Section */}
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">
              Nala Art Studio
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Art Therapy untuk Anak & Dewasa
            </p>
          </div>
          
          {/* Social Media Links */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {socialLinks.map((social) => {
              const IconComponent = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full ${social.color} text-white font-semibold text-xs sm:text-sm shadow-soft hover:shadow-hover transition-all duration-300 hover:scale-110 active:scale-95 group touch-manipulation`}
                  aria-label={`Follow us on ${social.name}`}
                >
                  <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">{social.username}</span>
                  <span className="sm:hidden">{social.name}</span>
                </a>
              );
            })}
          </div>
          
          {/* Copyright */}
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Nala Art Studio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
