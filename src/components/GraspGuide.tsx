import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createMidtransClassPaymentLink,
  saveGraspGuideAccessCode,
  verifyGraspGuideAccessCode,
} from "@/lib/midtrans";
import { toast } from "sonner";
import { Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import useMidtransSnap from "@/hooks/use-midtrans-snap";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: Record<string, unknown>) => void;
      hide?: () => void;
      close?: () => void;
    };
  }
}

const GUIDE_PRICE = 5000;
const ACCESS_CODE_KEY = "graspGuideAccessCode";
const SESSION_UNLOCK_KEY = "graspGuideSessionAuthorized";

type SnapResult = {
  transaction_id?: string;
  order_id?: string;
  [key: string]: unknown;
};

const GraspGuide = () => {
  useMidtransSnap();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [enteredCode, setEnteredCode] = useState("");
  const [storedCode, setStoredCode] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const savedCode = window.localStorage.getItem(ACCESS_CODE_KEY);
    if (savedCode) {
      setStoredCode(savedCode);
    }
  }, []);

  const handleInputChange = (field: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  // const generateAccessCode = useCallback(() => {
  //   const randomPart = Math.random().toString(36).slice(-6).toUpperCase();
  //   return `GG-${randomPart}`;
  // }, []);

  const handleOpenPayment = () => {
    setIsDialogOpen(true);
    toast("Lengkapi data pembeli sebelum lanjut ke Midtrans.");
  };

  const closeSnapPopup = () => {
    if (window.snap?.hide) {
      window.snap.hide();
    } else if (window.snap?.close) {
      window.snap.close();
    }
  };

  const handleSuccessfulUnlock = async (code: string, result?: SnapResult) => {
    setGeneratedCode(code);
    setStoredCode(code);
    window.localStorage.setItem(ACCESS_CODE_KEY, code);
    setEnteredCode(code);

    if (result?.transaction_id && result?.order_id) {
      try {
        await saveGraspGuideAccessCode({
          transactionId: result.transaction_id,
          orderId: result.order_id,
          code,
          customer: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
          },
        });
      } catch (error) {
        console.error("Save access code error:", error);
        toast("Kode akses tersimpan di perangkat, tapi gagal disinkronkan.");
      }
    }

    window.sessionStorage.setItem(SESSION_UNLOCK_KEY, "true");
    setIsDialogOpen(false);
    toast.success("Pembayaran berhasil! Kode akses diterapkan otomatis.");
    navigate("/grasp-guide-premium");
  };

  const handlePayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast.error("Lengkapi semua data terlebih dahulu.");
      return;
    }

    setIsProcessingPayment(true);
    try {
      const paymentResponse = await createMidtransClassPaymentLink({
        classId: "GRASP_GUIDE_DIGITAL",
        className: "Panduan Nama Grasp",
        price: GUIDE_PRICE,
        customerDetails: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        },
      });

      if (paymentResponse.token && window.snap) {
        closeSnapPopup();
        setIsDialogOpen(false);
        window.snap.pay(paymentResponse.token, {
          onSuccess: (result: SnapResult) => {
            closeSnapPopup();
            // Instead of generating locally, we poll the server for the code
            // The webhook should have triggered by now or will trigger soon
            toast("Pembayaran berhasil! Sedang mengambil kode akses...");

            // Poll for code
            const pollForCode = async () => {
              let attempts = 0;
              const maxAttempts = 10; // 20 seconds total
              const baseUrl = import.meta.env.VITE_API_URL || '';

              const check = async () => {
                try {
                  // Use baseUrl if set, otherwise use relative path (for dev proxy)
                  const apiUrl = baseUrl
                    ? `${baseUrl}/api/transaction/${result.order_id}/code`
                    : `/api/transaction/${result.order_id}/code`;

                  console.log(`[Poll ${attempts + 1}/${maxAttempts}] Fetching code from:`, apiUrl);

                  const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  });

                  console.log(`[Poll ${attempts + 1}] Response status:`, response.status);

                  if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                      try {
                        const data = await response.json();
                        console.log(`[Poll ${attempts + 1}] Response data:`, data);
                        if (data.code) {
                          console.log(`✅ Code found: ${data.code}`);
                          void handleSuccessfulUnlock(data.code, result);
                          return true;
                        } else {
                          console.warn(`[Poll ${attempts + 1}] No code in response:`, data);
                        }
                      } catch (jsonError) {
                        console.error(`[Poll ${attempts + 1}] JSON parse error:`, jsonError);
                        const text = await response.text();
                        console.error('Response text:', text);
                      }
                    } else {
                      const text = await response.text();
                      console.error(`[Poll ${attempts + 1}] Unexpected content-type:`, contentType);
                      console.error('Response text:', text.substring(0, 200));
                    }
                  } else if (response.status === 404) {
                    // Code not found yet, continue polling
                    console.log(`[Poll ${attempts + 1}] Code not found yet (404), continuing...`);
                    return false;
                  } else {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    console.error(`[Poll ${attempts + 1}] Error fetching code (${response.status}):`, errorText.substring(0, 200));
                  }
                } catch (e) {
                  console.error(`[Poll ${attempts + 1}] Network/fetch error:`, e);
                  if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
                    console.error('Possible CORS issue or server not reachable. Check VITE_API_URL:', baseUrl || 'not set');
                  }
                }
                return false;
              };

              const interval = setInterval(async () => {
                attempts++;
                const success = await check();
                if (success || attempts >= maxAttempts) {
                  clearInterval(interval);
                  if (!success) {
                    toast.error("Gagal mengambil kode otomatis. Silakan cek email atau hubungi admin.");
                  }
                }
              }, 2000);
            };

            pollForCode();
          },
          onPending: () => {
            closeSnapPopup();
            toast("Pembayaran masih diproses, cek status di Midtrans.");
          },
          onError: () => {
            closeSnapPopup();
            toast.error("Pembayaran gagal. Silakan coba lagi.");
          },
          onClose: () => {
            closeSnapPopup();
            toast("Kamu menutup jendela pembayaran sebelum selesai.");
          },
        });
      } else if (paymentResponse.paymentUrl) {
        setIsDialogOpen(false);
        window.location.href = paymentResponse.paymentUrl;
        toast("Mengalihkan ke halaman pembayaran Midtrans.");
      } else {
        toast.error("Token pembayaran tidak ditemukan.");
      }
    } catch (error) {
      console.error("Guide payment error:", error);
      toast.error(error instanceof Error ? error.message : "Gagal membuat pembayaran");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleUnlockContent = async () => {
    const codeToCheck = enteredCode.trim().toUpperCase();
    if (!codeToCheck) {
      toast.error("Masukkan kode akses terlebih dahulu.");
      return;
    }

    setIsVerifyingCode(true);
    try {
      const verification = await verifyGraspGuideAccessCode(codeToCheck);
      if (!verification.valid) {
        toast.error("Kode akses tidak valid.");
        return;
      }

      // Determine which premium page to navigate to based on code prefix
      let premiumPage = "/grasp-guide-premium";
      let storageKey = ACCESS_CODE_KEY;
      let sessionKey = SESSION_UNLOCK_KEY;

      if (codeToCheck.startsWith("SK-")) {
        premiumPage = "/sketch-premium";
        storageKey = "sketchAccessCode";
        sessionKey = "sketchSessionAuthorized";
      }

      window.localStorage.setItem(storageKey, codeToCheck);
      window.sessionStorage.setItem(sessionKey, "true");
      setStoredCode(codeToCheck);
      toast.success("Kode valid! Membuka halaman premium.");
      navigate(premiumPage);
    } catch (error) {
      console.error("Verify access code error:", error);
      toast.error(error instanceof Error ? error.message : "Gagal memeriksa kode akses.");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <Card className="border-2 border-border rounded-2xl sm:rounded-3xl shadow-soft hover:shadow-hover transition-smooth overflow-hidden">
        <div className="h-3 sm:h-4 gradient-pink-blue" />
        <CardHeader className="text-center p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">🧸 Panduan Nama Grasp</h2>
          <CardDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Bayar sekali untuk akses panduan nomor & warna Grasp plus kode eksklusif menuju halaman premium.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-4 sm:p-6 pt-0">
          <div className="bg-gradient-pink-blue rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center">
            <p className="text-sm uppercase tracking-[0.2em] font-semibold text-muted text-primary-foreground/80">
              Investasi Sekali, Akses Selamanya
            </p>
            <p className="text-3xl sm:text-4xl font-bold text-foreground mt-2">Rp {GUIDE_PRICE.toLocaleString("id-ID")}</p>
          </div>

          <Button
            size="lg"
            onClick={handleOpenPayment}
            className="w-full rounded-full text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-primary via-yellow-400 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] text-foreground shadow-soft hover:shadow-hover transition-all duration-500 hover:scale-105 active:scale-95 group touch-manipulation"
          >
            <ShieldCheck className="mr-2 w-5 h-5" />
            Bayar Sekarang
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Tombol akan membuka form singkat lalu meneruskan pembayaran ke Midtrans.
          </p>

          <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-primary" />
              <p className="font-semibold text-foreground">Masukkan kode akses</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Contoh: GG-ABC123 atau SK-ABC123"
                value={enteredCode}
                onChange={(event) => setEnteredCode(event.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                className="sm:w-40"
                onClick={handleUnlockContent}
                disabled={isVerifyingCode}
              >
                {isVerifyingCode ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memeriksa...
                  </>
                ) : (
                  "Buka Konten"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Sudah pernah membeli? Masukkan kode lama (bisa dari device mana pun) untuk pindah ke halaman premium.
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Lengkapi Data Pembeli</DialogTitle>
            <DialogDescription>Data ini digunakan Midtrans untuk memproses pembayaran digital kamu.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nama Depan</Label>
                <Input id="firstName" value={formData.firstName} onChange={handleInputChange("firstName")} required />
              </div>
              <div>
                <Label htmlFor="lastName">Nama Belakang</Label>
                <Input id="lastName" value={formData.lastName} onChange={handleInputChange("lastName")} required />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={handleInputChange("email")} required />
            </div>
            <div>
              <Label htmlFor="phone">Nomor WhatsApp</Label>
              <Input id="phone" type="tel" value={formData.phone} onChange={handleInputChange("phone")} required />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isProcessingPayment}>
              {isProcessingPayment ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memproses Pembayaran...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 w-5 h-5" />
                  Lanjutkan ke Midtrans
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Setelah transaksi sukses, kamu akan menerima kode akses unik (tersimpan otomatis di perangkat ini).
            </p>
          </form>

          {generatedCode && (
            <div className="rounded-xl border border-dashed border-primary/50 bg-primary/5 p-4 space-y-2 text-center">
              <p className="text-sm text-muted-foreground">Kode akses terbaru kamu</p>
              <p className="text-2xl font-mono font-bold tracking-widest text-primary">{generatedCode}</p>
              <p className="text-xs text-muted-foreground">Catat kode ini. Kamu bisa memakainya kapan saja.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GraspGuide;
