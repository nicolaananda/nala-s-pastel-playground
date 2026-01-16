import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createMidtransSketchPaymentLink } from "@/lib/midtrans";
import { Loader2, Download, Video } from "lucide-react";

const SketchPurchase = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePurchase = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!formData.firstName || !formData.email || !formData.phone) {
            toast.error("Mohon lengkapi data yang diperlukan");
            return;
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error("Format email tidak valid");
            return;
        }

        // Validate phone (Indonesian format)
        const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
        if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
            toast.error("Format nomor telepon tidak valid (contoh: 08123456789)");
            return;
        }

        setIsLoading(true);

        try {
            const paymentResponse = await createMidtransSketchPaymentLink({
                sketchId: "sketch-face-hair-001",
                sketchTitle: "Sketsa Wajah & Rambut Laki-laki Perempuan",
                price: 5000,
                customerDetails: {
                    firstName: formData.firstName,
                    lastName: formData.lastName || "",
                    email: formData.email,
                    phone: formData.phone,
                },
            });

            // Redirect to Midtrans payment page
            window.location.href = paymentResponse.paymentUrl;
        } catch (error) {
            console.error("Payment error:", error);
            toast.error(error instanceof Error ? error.message : "Gagal membuat link pembayaran");
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background py-12 sm:py-16 md:py-20 px-4 sm:px-6">
            <div className="container mx-auto max-w-6xl space-y-10">
                {/* Header */}
                <div className="flex flex-col gap-4 text-center">
                    <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">Digital Product</p>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                        Sketsa Wajah & Rambut
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Panduan sketsa wajah dan rambut laki-laki & perempuan untuk referensi menggambar Anda
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="text-4xl font-bold text-primary">Rp 5.000</span>
                    </div>
                </div>

                {/* Video Preview Section */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="overflow-hidden">
                        <CardHeader className="p-0">
                            <div className="relative pb-[56.25%] h-0">
                                <iframe
                                    className="absolute top-0 left-0 w-full h-full"
                                    src="https://www.youtube.com/embed/GMzu2jMTigk"
                                    title="Tutorial 1"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                Rambut Kerik Silky Crayon
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardHeader className="p-0">
                            <div className="relative pb-[56.25%] h-0">
                                <iframe
                                    className="absolute top-0 left-0 w-full h-full"
                                    src="https://www.youtube.com/embed/3PmaoARSYxo"
                                    title="Tutorial 2"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                Tutorial Rambut Berkilau
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardHeader className="p-0">
                            <div className="relative pb-[56.25%] h-0">
                                <iframe
                                    className="absolute top-0 left-0 w-full h-full"
                                    src="https://www.youtube.com/embed/g6qvnSauzp0"
                                    title="Tutorial 3"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                Cara Mewarnai Wajah
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* What You Get */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="w-5 h-5" />
                            Yang Akan Anda Dapatkan
                        </CardTitle>
                        <CardDescription>Setelah pembayaran berhasil</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">✓</span>
                                <span>Kode akses premium untuk download sketsa</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">✓</span>
                                <span>File sketsa wajah & rambut laki-laki dan perempuan</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">✓</span>
                                <span>Link download langsung dari Google Drive</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">✓</span>
                                <span>Akses selamanya dengan kode yang Anda terima</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Purchase Form */}
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Informasi Pembeli</CardTitle>
                        <CardDescription>Lengkapi data Anda untuk melanjutkan pembayaran</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePurchase} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">
                                        Nama Depan <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        placeholder="John"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Nama Belakang</Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        placeholder="Doe"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">
                                    Nomor Telepon <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="08123456789"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="pt-4 space-y-3">
                                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Memproses...
                                        </>
                                    ) : (
                                        <>Beli Sekarang - Rp 5.000</>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => navigate("/")}
                                    disabled={isLoading}
                                >
                                    Kembali ke Beranda
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
};

export default SketchPurchase;
