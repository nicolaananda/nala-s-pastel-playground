import GraspGuide from "./GraspGuide";
import SketchGuide from "./SketchGuide";

const DigitalProducts = () => {
    return (
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-background">
            <div className="container mx-auto max-w-6xl">
                <div className="text-center mb-8 sm:mb-12">
                    <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground mb-2">Produk Digital</p>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                        Panduan Eksklusif
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                    <GraspGuide />
                    <SketchGuide />
                </div>
            </div>
        </section>
    );
};

export default DigitalProducts;
