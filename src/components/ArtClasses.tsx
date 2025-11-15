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
    <section id="kelas-seni" className="py-20 px-4 bg-gradient-to-br from-accent/20 via-background to-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 animate-fade-in sparkle">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            🎨 Kelas Seni Nala
          </h2>
          <p className="text-xl md:text-2xl text-primary font-semibold">
            Pilih level sesuai kemampuanmu 🌟
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {classes.map((artClass, index) => (
            <Card 
              key={index}
              className="border-4 border-primary/30 rounded-3xl shadow-hover hover:shadow-soft transition-bounce hover:scale-110 hover:rotate-2 animate-bounce-in overflow-hidden bg-gradient-to-br from-card to-secondary/10"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {artClass.image ? (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={artClass.image} 
                    alt={artClass.level}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className={`h-48 ${artClass.gradient}`} />
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {artClass.level}
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  {artClass.description}
                </CardDescription>
              </CardHeader>
              
              {artClass.topics.length > 0 && (
                <CardContent>
                  <p className="font-semibold text-foreground mb-3">Berisi:</p>
                  <ul className="space-y-2">
                    {artClass.topics.map((topic, idx) => (
                      <li key={idx} className="flex items-start text-muted-foreground">
                        <span className="text-primary mr-2">•</span>
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
