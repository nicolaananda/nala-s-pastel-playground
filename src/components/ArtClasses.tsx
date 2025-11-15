import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import beginnerImg from "@/assets/beginner-class.jpg";
import intermediateImg from "@/assets/intermediate-class.jpg";
import advancedImg from "@/assets/advanced-class.jpg";

const classes = [
  {
    level: "Beginner Class",
    image: beginnerImg,
    description: "Cocok untuk usia mulai dari 4 tahun.",
    topics: [
      "Mewarnai Oil Pastel",
      "Menggambar & Mewarnai Sederhana",
      "Melengkapi Gambar dan Mewarnai",
      "Doodling Class",
      "Anime Chibi Class"
    ],
    gradient: "gradient-pink"
  },
  {
    level: "Intermediate Class",
    image: intermediateImg,
    description: "Level lanjutan dari Beginner Class.",
    topics: [
      "Watercolor Class",
      "Gouache Class",
      "Realistic Drawing",
      "Portrait Face Drawing"
    ],
    gradient: "gradient-pink-blue"
  },
  {
    level: "Advanced Class",
    image: advancedImg,
    description: "Tingkat mahir untuk peningkatan skill profesional atau persiapan lomba/pameran.",
    topics: [],
    gradient: "gradient-blue"
  }
];

const ArtClasses = () => {
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
              key={index}
              className="border-2 sm:border-4 border-primary/30 rounded-2xl sm:rounded-3xl shadow-hover hover:shadow-soft transition-all duration-300 hover:scale-110 hover:rotate-3 hover:border-primary/60 animate-bounce-in overflow-hidden bg-gradient-to-br from-card to-secondary/10 group cursor-pointer"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {artClass.image ? (
                <div className="h-40 sm:h-48 overflow-hidden">
                  <img 
                    src={artClass.image} 
                    alt={artClass.level}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className={`h-40 sm:h-48 ${artClass.gradient} group-hover:scale-110 transition-transform duration-500`} />
              )}
              
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                  {artClass.level}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-muted-foreground mt-2">
                  {artClass.description}
                </CardDescription>
              </CardHeader>
              
              {artClass.topics.length > 0 && (
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="font-semibold text-sm sm:text-base text-foreground mb-2 sm:mb-3">Berisi:</p>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {artClass.topics.map((topic, idx) => (
                      <li key={idx} className="flex items-start text-sm sm:text-base text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                        <span className="text-primary mr-2 flex-shrink-0 group-hover:scale-125 transition-transform duration-300 inline-block">✨</span>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArtClasses;
