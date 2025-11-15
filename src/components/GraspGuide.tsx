import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

const GraspGuide = () => {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-2xl animate-fade-in">
        <Card className="border-2 border-border rounded-3xl shadow-soft hover:shadow-hover transition-smooth overflow-hidden">
          <div className="h-4 gradient-pink-blue" />
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-foreground mb-2">
              🧸 Panduan Nama Grasp
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground leading-relaxed">
              Tersedia nama dan nomor Grasp serta panduan warna untuk mencocokkan crayon Grasp kamu.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-gradient-pink-blue rounded-2xl p-6">
              <p className="text-4xl font-bold text-foreground">Rp 5.000</p>
            </div>
            <Button 
              size="lg"
              className="w-full rounded-full text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-foreground shadow-soft hover:shadow-hover transition-smooth hover:scale-105 group"
            >
              <ShoppingCart className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              Beli Sekarang
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default GraspGuide;
