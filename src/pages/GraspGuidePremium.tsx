import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GuideImage from "@/assets/Guide.png";
import Image1 from "@/assets/Image1.jpeg";
import Image2 from "@/assets/Image2.jpeg";
import Image3 from "@/assets/Image3.jpeg";
import Image4 from "@/assets/Image4.png";

const ACCESS_CODE_KEY = "graspGuideAccessCode";
const SESSION_UNLOCK_KEY = "graspGuideSessionAuthorized";

const premiumAssets = [
  { src: GuideImage, title: "Panduan Nama Lengkap" },
  { src: Image1, title: "Sheet Panduan 1" },
  { src: Image2, title: "Sheet Panduan 2" },
  { src: Image3, title: "Sheet Panduan 3" },
  { src: Image4, title: "Sheet Panduan 4" },
];

const GraspGuidePremium = () => {
  const navigate = useNavigate();
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<(typeof premiumAssets)[number] | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const isAuthorized = window.sessionStorage.getItem(SESSION_UNLOCK_KEY) === "true";
    if (!isAuthorized) {
      toast.error("Kode akses tidak ditemukan. Masukkan kode melalui halaman utama.");
      navigate("/", { replace: true });
      return;
    }

    const localCode = window.localStorage.getItem(ACCESS_CODE_KEY);
    if (localCode) {
      setSavedCode(localCode);
    }
  }, [navigate]);

  const handleLockContent = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(SESSION_UNLOCK_KEY);
    }
    toast("Konten premium dikunci kembali.");
    navigate("/");
  };

  return (
    <main className="min-h-screen bg-background py-12 sm:py-16 md:py-20 px-4 sm:px-6">
      <div className="container mx-auto max-w-5xl space-y-10">
        <div className="flex flex-col gap-4 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">Halaman Premium</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Panduan Nama + Warna Grasp</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Gunakan referensi visual ini untuk mencocokkan warna crayon Grasp sesuai nomor resmi. Simpan akses ini baik-baik.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>
              Kembali ke Beranda
            </Button>
            <Button variant="secondary" onClick={handleLockContent}>
              Kunci Konten
            </Button>
          </div>
          <div className="mx-auto mt-4 max-w-md text-sm text-muted-foreground space-y-2">
            {savedCode ? (
              <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-6 py-4 text-center">
                <p className="uppercase tracking-[0.3em] text-xs text-primary/80">Kode Akses Kamu</p>
                <p className="text-2xl font-mono font-bold text-primary mt-2">{savedCode}</p>
                <p>Screenshoot atau catat kode ini supaya bisa dipakai di perangkat lain.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-4 text-center">
                <p>Kamu sudah unlock konten. Jika butuh kode lagi, buka halaman utama dan masukkan ulang kode aksesmu.</p>
              </div>
            )}
          </div>
        </div>



        {/* YouTube Video Section */}
        <div className="w-full max-w-3xl mx-auto">
          <div className="relative pb-[56.25%] h-0 rounded-2xl overflow-hidden shadow-soft border border-border bg-card">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/U6GRQyS0fZU"
              title="Grasp Panduan Nama & Nomor"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-3">
            Grasp Panduan Nama & Nomor #juara1lombamewarnai #mewarnai #lombamewarnai
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {premiumAssets.map((asset) => (
            <figure
              key={asset.title}
              className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden cursor-zoom-in transition hover:shadow-hover"
              onClick={() => setPreviewAsset(asset)}
            >
              <img src={asset.src} alt={asset.title} className="w-full h-auto object-cover" loading="lazy" />
              <figcaption className="p-4 text-center font-semibold text-foreground">{asset.title}</figcaption>
            </figure>
          ))}
        </div>
      </div>

      <Dialog open={!!previewAsset} onOpenChange={(open) => !open && setPreviewAsset(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewAsset?.title ?? "Pratinjau Gambar"}</DialogTitle>
            <DialogDescription>Gunakan gerakan pinch atau scroll untuk memperbesar detail.</DialogDescription>
          </DialogHeader>
          {previewAsset && (
            <div className="w-full">
              <img
                src={previewAsset.src}
                alt={previewAsset.title}
                className="w-full h-full max-h-[80vh] object-contain rounded-2xl"
                loading="lazy"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main >
  );
};

export default GraspGuidePremium;

