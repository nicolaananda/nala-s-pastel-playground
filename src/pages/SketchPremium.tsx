import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ExternalLink, Lock } from "lucide-react";

const ACCESS_CODE_KEY = "sketchAccessCode";
const SESSION_UNLOCK_KEY = "sketchSessionAuthorized";

const SketchPremium = () => {
    const navigate = useNavigate();
    const [savedCode, setSavedCode] = useState<string | null>(null);

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

    const handleDownload = () => {
        window.open("https://drive.google.com/file/d/14S_sxgNzqlUw4J9H8_FGLXyUvCRpN4L8/view?usp=drivesdk", "_blank");
    };

    return (
        <main className="min-h-screen bg-background py-12 sm:py-16 md:py-20 px-4 sm:px-6">
            <div className="container mx-auto max-w-5xl space-y-10">
                <div className="flex flex-col gap-4 text-center">
                    <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">Halaman Premium</p>
                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                        Sketsa Wajah & Rambut
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Terima kasih atas pembelian Anda! Download file sketsa Anda di bawah ini.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button variant="outline" onClick={() => navigate("/")}>
                            Kembali ke Beranda
                        </Button>
                        <Button variant="secondary" onClick={handleLockContent}>
                            <Lock className="w-4 h-4 mr-2" />
                            Kunci Konten
                        </Button>
                    </div>
                    <div className="mx-auto mt-4 max-w-md text-sm text-muted-foreground space-y-2">
                        {savedCode ? (
                            <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-6 py-4 text-center">
                                <p className="uppercase tracking-[0.3em] text-xs text-primary/80">Kode Akses Kamu</p>
                                <p className="text-2xl font-mono font-bold text-primary mt-2">{savedCode}</p>
                                <p>Screenshot atau catat kode ini supaya bisa dipakai di perangkat lain.</p>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-4 text-center">
                                <p>Kamu sudah unlock konten. Jika butuh kode lagi, buka halaman utama dan masukkan ulang kode aksesmu.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Download Section */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl flex items-center justify-center gap-2">
                            <Download className="w-6 h-6" />
                            Download Sketsa
                        </CardTitle>
                        <CardDescription>File sketsa wajah & rambut laki-laki dan perempuan</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <Button size="lg" onClick={handleDownload} className="w-full max-w-md">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Buka Google Drive
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">
                            Klik tombol di atas untuk membuka file di Google Drive, lalu download file sketsa Anda.
                        </p>
                    </CardContent>
                </Card>

                {/* Video Tutorials */}
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-foreground mb-2">Tutorial Video</h2>
                        <p className="text-muted-foreground">Pelajari teknik menggambar dan mewarnai dari video tutorial ini</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="p-0">
                                <div className="relative pb-[56.25%] h-0 rounded-t-lg overflow-hidden">
                                    <iframe
                                        className="absolute top-0 left-0 w-full h-full"
                                        src="https://www.youtube.com/embed/GMzu2jMTigk"
                                        title="Tutorial Rambut Kerik"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <h3 className="font-semibold mb-1">Rambut Kerik Silky</h3>
                                <p className="text-sm text-muted-foreground">
                                    Tutorial menggambar rambut kerik dengan crayon
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="p-0">
                                <div className="relative pb-[56.25%] h-0 rounded-t-lg overflow-hidden">
                                    <iframe
                                        className="absolute top-0 left-0 w-full h-full"
                                        src="https://www.youtube.com/embed/3PmaoARSYxo"
                                        title="Tutorial Rambut Berkilau"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <h3 className="font-semibold mb-1">Rambut Berkilau</h3>
                                <p className="text-sm text-muted-foreground">
                                    Teknik membuat efek rambut berkilau
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="p-0">
                                <div className="relative pb-[56.25%] h-0 rounded-t-lg overflow-hidden">
                                    <iframe
                                        className="absolute top-0 left-0 w-full h-full"
                                        src="https://www.youtube.com/embed/g6qvnSauzp0"
                                        title="Cara Mewarnai Wajah"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <h3 className="font-semibold mb-1">Mewarnai Wajah</h3>
                                <p className="text-sm text-muted-foreground">
                                    Tutorial lengkap cara mewarnai wajah
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Tips Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tips Menggunakan Sketsa</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>Print sketsa dalam ukuran yang sesuai dengan kebutuhan Anda</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>Gunakan sebagai referensi untuk belajar proporsi wajah dan rambut</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>Latih teknik shading dan coloring menggunakan sketsa ini</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>Simpan kode akses Anda untuk download ulang di masa depan</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
};

export default SketchPremium;
