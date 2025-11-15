import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

const GraspGuide = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-background">
      <div className="container mx-auto max-w-2xl animate-fade-in">
        <Card className="border-2 border-border rounded-2xl sm:rounded-3xl shadow-soft hover:shadow-hover transition-smooth overflow-hidden">
          <div className="h-3 sm:h-4 gradient-pink-blue" />
          <CardHeader className="text-center p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
              🧸 Panduan Nama Grasp
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Tersedia nama dan nomor Grasp serta panduan warna untuk mencocokkan crayon Grasp kamu.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4 p-4 sm:p-6 pt-0">
            <div className="bg-gradient-pink-blue rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Rp 5.000</p>
            </div>
            <Button 
              size="lg"
              className="w-full rounded-full text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-primary via-yellow-400 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] text-foreground shadow-soft hover:shadow-hover transition-all duration-500 hover:scale-110 active:scale-95 group touch-manipulation hover:animate-wiggle"
            >
              <ShoppingCart className="mr-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 group-hover:animate-bounce transition-transform inline-block" />
              Beli Sekarang
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default GraspGuide;
