import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ACCESS_CODE_KEY = "graspGuideAccessCode";
const SESSION_UNLOCK_KEY = "graspGuideSessionAuthorized";
const GRASP_ASSET_BASE_URL = (import.meta.env.VITE_GRASP_ASSET_BASE_URL || "https://r2.artstudionala.com/grasp").replace(/\/$/, "");

const premiumAssets = [
  {
    src: `${GRASP_ASSET_BASE_URL}/grasp_silky_crayon-60warna.jpeg`,
    title: "Contoh Swatch Nama & Nomor Grasp 60 Warna",
    type: "image",
  },
  {
    src: `${GRASP_ASSET_BASE_URL}/PDF%20GRASP%20NAMA%20NOMOR%2060%20WARNA.pdf`,
    title: "PDF Grasp Nama Nomor 60 Warna",
    type: "pdf",
  },
  {
    src: `${GRASP_ASSET_BASE_URL}/grispy.jpg`,
    title: "Grispy Grasp",
    type: "image",
  },
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
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Nama & Nomor Grasp Isi 60 Warna</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Gunakan swatch, PDF, dan referensi visual ini untuk mencocokkan warna Grasp sesuai nama serta nomor resmi. Simpan akses ini baik-baik.
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
              {asset.type === "pdf" ? (
                <div className="aspect-[4/3] bg-muted/50">
                  <iframe
                    src={asset.src}
                    title={asset.title}
                    className="h-full w-full border-0"
                    loading="lazy"
                  />
                </div>
              ) : (
                <img src={asset.src} alt={asset.title} className="w-full h-auto object-cover" loading="lazy" />
              )}
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
          {previewAsset && previewAsset.type === "pdf" ? (
            <div className="space-y-4">
              <div className="h-[75vh] w-full overflow-hidden rounded-2xl border border-border bg-muted/50">
                <iframe
                  src={previewAsset.src}
                  title={previewAsset.title}
                  className="h-full w-full border-0"
                />
              </div>
              <Button asChild>
                <a href={previewAsset.src} target="_blank" rel="noreferrer">
                  Buka PDF di Tab Baru
                </a>
              </Button>
            </div>
          ) : previewAsset ? (
            <div className="w-full">
              <img
                src={previewAsset.src}
                alt={previewAsset.title}
                className="w-full h-full max-h-[80vh] object-contain rounded-2xl"
                loading="lazy"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </main >
  );
};

export default GraspGuidePremium;
