import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Download, Grid3X3 } from "lucide-react";

const cuteColoringPages = Array.from(
  { length: 19 },
  (_, index) => `https://r2.artstudionala.com/cute-coloring-page/${String(index + 1).padStart(2, "0")}.jpg`,
);

const FreeWorksheet = () => {
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const showPrevious = () => setSelectedPage((page) => (page === null ? null : (page + 18) % 19));
  const showNext = () => setSelectedPage((page) => (page === null ? null : (page + 1) % 19));

  return (
    <section className="bg-gradient-to-b from-background to-accent/30 px-4 py-12 sm:px-6 sm:py-16 md:py-20">
      <div className="container mx-auto max-w-4xl animate-fade-in text-center">
        <h2 className="mb-4 text-2xl font-bold text-foreground sm:mb-6 sm:text-3xl md:text-4xl lg:text-5xl">
          🖍️ Free Coloring Worksheet
        </h2>
        <p className="mb-6 px-2 text-base text-muted-foreground sm:mb-8 sm:text-lg md:text-xl">
          Download lembar mewarnai gratis untuk latihan di rumah
        </p>

        <Dialog onOpenChange={(open) => !open && setSelectedPage(null)}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="group w-full rounded-3xl border-2 border-primary bg-gradient-to-br from-primary/20 via-accent/30 to-secondary/20 p-8 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-10"
            >
              <span className="mb-3 inline-block text-5xl group-hover:animate-bounce sm:text-6xl">🧸</span>
              <span className="block text-lg font-bold text-foreground sm:text-xl">Cute Coloring Page</span>
              <span className="mt-1 block text-sm text-muted-foreground">19 gambar gratis untuk diwarnai</span>
            </button>
          </DialogTrigger>

          <DialogContent className="max-w-4xl rounded-2xl p-4 sm:p-6">
            <DialogHeader className="pr-8">
              <DialogTitle>Cute Coloring Page</DialogTitle>
              <DialogDescription>
                {selectedPage === null ? "Pilih salah satu dari 19 gambar." : `Gambar ${selectedPage + 1} dari 19`}
              </DialogDescription>
            </DialogHeader>

            {selectedPage === null ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
                {cuteColoringPages.map((page, index) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setSelectedPage(index)}
                    aria-label={`Lihat Cute Coloring Page ${index + 1}`}
                    className="group/page relative aspect-[3/4] overflow-hidden rounded-xl border-2 border-primary/30 bg-white shadow-sm transition hover:-translate-y-1 hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <img
                      src={page}
                      alt={`Cute Coloring Page ${index + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover/page:scale-105"
                    />
                    <span className="absolute bottom-1 right-1 rounded-full bg-black/65 px-2 py-0.5 text-xs text-white">{index + 1}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex min-h-0 flex-col gap-3">
                <div className="relative flex min-h-[50svh] items-center justify-center overflow-hidden rounded-2xl bg-muted/60 p-2 sm:min-h-[55vh]">
                  <img
                    src={cuteColoringPages[selectedPage]}
                    alt={`Cute Coloring Page ${selectedPage + 1}`}
                    className="max-h-[60svh] w-auto max-w-full rounded-lg object-contain shadow-md"
                  />
                  <button type="button" onClick={showPrevious} aria-label="Gambar sebelumnya" className="absolute left-2 rounded-full bg-background/90 p-2 shadow-md transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button type="button" onClick={showNext} aria-label="Gambar berikutnya" className="absolute right-2 rounded-full bg-background/90 p-2 shadow-md transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button type="button" onClick={() => setSelectedPage(null)} className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
                    <Grid3X3 className="h-4 w-4" /> Semua gambar
                  </button>
                  <a href={cuteColoringPages[selectedPage]} download={`cute-coloring-page-${selectedPage + 1}.jpg`} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                    <Download className="h-4 w-4" /> Download
                  </a>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default FreeWorksheet;
