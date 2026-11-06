import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import VillagePicker from "@/components/VillagePicker";
import { createMidtransPaymentLink, MidtransPaymentRequest } from "@/lib/midtrans";
import {
  calculateShippingCost,
  ShippingCost,
  VillageOption,
  DEFAULT_BOOK_WEIGHT,
} from "@/lib/shipping";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const checkoutSchema = z.object({
  firstName: z.string().min(2, "Nama depan minimal 2 karakter"),
  lastName: z.string().min(2, "Nama belakang minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit"),
  address: z.string().min(10, "Alamat lengkap minimal 10 karakter"),
  postalCode: z.string().min(5, "Kode pos minimal 5 digit"),
  shippingService: z.string().min(1, "Pilih layanan pengiriman"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutFormProps {
  bookId: string;
  bookTitle: string;
  bookPrice: number;
  onPaymentSuccess?: (paymentUrl: string) => void;
}

const CheckoutForm = ({ bookId, bookTitle, bookPrice, onPaymentSuccess }: CheckoutFormProps) => {
  const monitor = (event: string, reason = "none") => { const base=import.meta.env.VITE_API_URL||""; void fetch(`${base}/api/checkout-events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({event,route:"/buku/:slug",bookSlug:bookId,reason}),keepalive:true}).catch(()=>{}); };
  const [village, setVillage] = useState<VillageOption | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingCost[]>([]);
  const [selectedShippingCost, setSelectedShippingCost] = useState<number>(0);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: (() => { try { return JSON.parse(sessionStorage.getItem(`checkout-draft:${bookId}`) || "null")?.fields; } catch { return undefined; } })(),
  });

  useEffect(() => {
    monitor("checkout_opened");
  }, [bookId]);

  useEffect(() => {
    try { const draft = JSON.parse(sessionStorage.getItem(`checkout-draft:${bookId}`) || "null"); if (draft?.village) setVillage(draft.village); } catch { /* Storage may be unavailable. */ }
    const subscription = watch((fields) => { try { sessionStorage.setItem(`checkout-draft:${bookId}`, JSON.stringify({ fields, village })); } catch { /* Storage may be unavailable. */ } });
    return () => subscription.unsubscribe();
  }, [bookId, village, watch]);

  // Hitung ongkir saat village berubah
  useEffect(() => {
    if (!village) {
      setShippingOptions([]);
      setSelectedShippingCost(0);
      setIsLoadingShipping(false);
      setValue("shippingService", "");
      return;
    }

    let cancelled = false;
    const fetchShipping = async () => {
      setIsLoadingShipping(true);
      setShippingError("");
      try {
        const response = await calculateShippingCost(village.code, DEFAULT_BOOK_WEIGHT);
        if (cancelled) return;
        setShippingOptions(response.costs);
        if (response.costs.length > 0) {
          setValue("shippingService", response.costs[0].service);
          setSelectedShippingCost(response.costs[0].cost);
        } else {
          setValue("shippingService", "");
          setSelectedShippingCost(0);
        }
      } catch (error) {
        monitor("shipping_failed", error instanceof TypeError ? "network" : "provider");
        console.error("Shipping calculation error:", error);
        if (!cancelled) {
          setShippingOptions([]);
          setSelectedShippingCost(0);
          setShippingError("Ongkir gagal dimuat. Pilih ulang kelurahan/desa atau coba lagi.");
        }
      } finally {
        if (!cancelled) setIsLoadingShipping(false);
      }
    };
    fetchShipping();

    return () => {
      cancelled = true;
    };
  }, [village, setValue]);

  const handleShippingServiceChange = (service: string) => {
    setValue("shippingService", service);
    const selected = shippingOptions.find((cost) => cost.service === service);
    if (selected) setSelectedShippingCost(selected.cost);
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (!village) {
      toast.error("Pilih kelurahan/desa tujuan dulu");
      return;
    }

    setIsProcessingPayment(true);
    try {
      const paymentRequest: MidtransPaymentRequest = {
        bookId,
        bookTitle,
        price: bookPrice,
        shippingCost: selectedShippingCost,
        customerDetails: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          address: `${data.address}, ${village.name}, ${village.district}`,
          city: village.regency,
          postalCode: data.postalCode,
          province: village.province,
        },
      };

      const paymentResponse = await createMidtransPaymentLink(paymentRequest);
      if (!paymentResponse.paymentUrl) throw Object.assign(new Error("Gagal membuat payment link"), { monitoringReason: "invalid_response" });
      sessionStorage.removeItem(`checkout-draft:${bookId}`);

      toast.success("Payment link berhasil dibuat!");

      if (onPaymentSuccess) {
        monitor("payment_redirected");
        onPaymentSuccess(paymentResponse.paymentUrl);
      } else {
        monitor("payment_redirected");
        window.location.href = paymentResponse.paymentUrl;
      }
    } catch (error) {
      monitor("payment_link_failed", error instanceof TypeError ? "network" : error && typeof error === "object" && "monitoringReason" in error ? "invalid_response" : "provider");
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Gagal membuat payment link");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const totalAmount = bookPrice + selectedShippingCost;

  return (
    <Card className="border-2 border-primary/30 rounded-2xl shadow-hover">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Form Pemesanan</CardTitle>
        <CardDescription>Isi data berikut untuk melanjutkan pembayaran</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Data Diri</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nama Depan *</Label>
                <Input id="firstName" autoComplete="given-name" aria-invalid={!!errors.firstName} aria-describedby={errors.firstName ? "firstName-error" : undefined} {...register("firstName")} placeholder="Nama depan" />
                {errors.firstName && (
                  <p id="firstName-error" role="alert" className="text-sm text-destructive mt-1">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="lastName">Nama Belakang *</Label>
                <Input id="lastName" autoComplete="family-name" aria-invalid={!!errors.lastName} {...register("lastName")} placeholder="Nama belakang" />
                {errors.lastName && (
                  <p className="text-sm text-destructive mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} placeholder="email@example.com" />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Nomor Telepon *</Label>
              <Input id="phone" type="tel" autoComplete="tel" inputMode="tel" aria-invalid={!!errors.phone} {...register("phone")} placeholder="081234567890" />
              {errors.phone && (
                <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Alamat Pengiriman</h3>

            <div>
              <Label htmlFor="address">Alamat Lengkap *</Label>
              <Textarea
                id="address"
                autoComplete="street-address"
                aria-invalid={!!errors.address}
                {...register("address")}
                placeholder="Jl. Contoh No. 123, RT/RW"
                rows={3}
              />
              {errors.address && (
                <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="village">Kelurahan/Desa *</Label>
              <VillagePicker id="village" value={village} onChange={setVillage} />
              {village && (
                <p className="text-xs text-muted-foreground mt-1">
                  {village.district}, {village.regency}, {village.province}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="postalCode">Kode Pos *</Label>
              <Input id="postalCode" autoComplete="postal-code" inputMode="numeric" aria-invalid={!!errors.postalCode} {...register("postalCode")} placeholder="12345" />
              {errors.postalCode && (
                <p className="text-sm text-destructive mt-1">{errors.postalCode.message}</p>
              )}
            </div>
          </div>

          {/* Shipping Options */}
          <div className="space-y-4" aria-live="polite" aria-busy={isLoadingShipping}>
            <h3 className="text-lg font-semibold text-primary">Pilihan Pengiriman</h3>

            {shippingError ? (
              <p role="alert" className="text-sm text-destructive">{shippingError}</p>
            ) : !village ? (
              <p className="text-sm text-muted-foreground">
                Pilih kelurahan/desa tujuan dulu untuk melihat opsi pengiriman
              </p>
            ) : isLoadingShipping ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
                <span>Menghitung ongkir...</span>
              </div>
            ) : shippingOptions.length > 0 ? (
              <div>
                <Label htmlFor="shippingService">Layanan Pengiriman *</Label>
                <Select
                  value={watch("shippingService")}
                  onValueChange={handleShippingServiceChange}
                >
                  <SelectTrigger id="shippingService">
                    <SelectValue placeholder="Pilih layanan" />
                  </SelectTrigger>
                  <SelectContent>
                    {shippingOptions.map((cost) => (
                      <SelectItem key={cost.service} value={cost.service}>
                        {cost.description} — Rp {cost.cost.toLocaleString("id-ID")} ({cost.etd})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.shippingService && (
                  <p className="text-sm text-destructive mt-1">{errors.shippingService.message}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tidak ada layanan pengiriman tersedia
              </p>
            )}
          </div>

          {/* Price Summary */}
          <div className="border-t-2 border-primary/20 pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Harga Buku:</span>
              <span className="font-semibold">Rp {bookPrice.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span>Ongkir:</span>
              <span className="font-semibold">
                {selectedShippingCost > 0
                  ? `Rp ${selectedShippingCost.toLocaleString("id-ID")}`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold text-primary pt-2 border-t">
              <span>Total:</span>
              <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isProcessingPayment || !village || selectedShippingCost === 0}
          >
            {isProcessingPayment ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
                Memproses...
              </>
            ) : (
              <>💳 Lanjutkan ke Pembayaran</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CheckoutForm;
