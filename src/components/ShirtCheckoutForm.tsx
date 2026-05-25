import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import VillagePicker from "@/components/VillagePicker";
import { createMidtransShirtPaymentLink } from "@/lib/midtrans";
import {
  calculateShippingCost,
  ShippingCost,
  VillageOption,
  DEFAULT_SHIRT_WEIGHT,
} from "@/lib/shipping";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const SIZES_ANAK = ["0 (0-2th)", "1 (3-5th)", "2 (6-8th)", "3 (9-10th)"] as const;
const SIZES_DEWASA = ["XS", "S", "M", "L", "XL", "2XL", "3XL"] as const;

const shirtCheckoutSchema = z.object({
  category: z.enum(["anak", "dewasa"]),
  size: z.string().min(1, "Pilih ukuran"),
  quantity: z.coerce.number().int().min(1, "Minimal 1 pcs").max(10, "Maksimal 10 pcs"),
  firstName: z.string().min(2, "Nama depan minimal 2 karakter"),
  lastName: z.string().min(2, "Nama belakang minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit"),
  address: z.string().min(10, "Alamat lengkap minimal 10 karakter"),
  postalCode: z.string().min(5, "Kode pos minimal 5 digit"),
  shippingService: z.string().min(1, "Pilih layanan pengiriman"),
});

type ShirtCheckoutFormData = z.infer<typeof shirtCheckoutSchema>;

interface ShirtCheckoutFormProps {
  shirtId: string;
  shirtTitle: string;
  priceAnak: number;
  priceDewasa: number;
  onPaymentSuccess?: (paymentUrl: string) => void;
}

const ShirtCheckoutForm = ({
  shirtId,
  shirtTitle,
  priceAnak,
  priceDewasa,
  onPaymentSuccess,
}: ShirtCheckoutFormProps) => {
  const [village, setVillage] = useState<VillageOption | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingCost[]>([]);
  const [selectedShippingCost, setSelectedShippingCost] = useState<number>(0);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ShirtCheckoutFormData>({
    resolver: zodResolver(shirtCheckoutSchema),
    defaultValues: {
      category: "dewasa",
      quantity: 1,
    },
  });

  const watchedCategory = watch("category");
  const watchedSize = watch("size");
  const watchedQuantity = watch("quantity") || 1;

  const unitPrice = watchedCategory === "anak" ? priceAnak : priceDewasa;
  const subtotal = unitPrice * watchedQuantity;
  const totalAmount = subtotal + selectedShippingCost;
  const totalWeight = DEFAULT_SHIRT_WEIGHT * watchedQuantity;
  // Backend konvert ke kg (ceil(g/1000)). Refetch hanya saat hasil kg berubah.
  const weightKg = Math.max(1, Math.ceil(totalWeight / 1000));

  const sizeOptions = watchedCategory === "anak" ? SIZES_ANAK : SIZES_DEWASA;

  // Reset size kalau kategori ganti
  useEffect(() => {
    setValue("size", "");
  }, [watchedCategory, setValue]);

  // Hitung ongkir saat village atau berat (kg) berubah
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
      try {
        const response = await calculateShippingCost(village.code, weightKg * 1000);
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
        console.error("Shipping calculation error:", error);
      } finally {
        if (!cancelled) setIsLoadingShipping(false);
      }
    };
    fetchShipping();

    return () => {
      cancelled = true;
    };
  }, [village, weightKg, setValue]);

  const handleShippingServiceChange = (service: string) => {
    setValue("shippingService", service);
    const selected = shippingOptions.find((cost) => cost.service === service);
    if (selected) setSelectedShippingCost(selected.cost);
  };

  const onSubmit = async (data: ShirtCheckoutFormData) => {
    if (!village) {
      toast.error("Pilih kelurahan/desa tujuan dulu");
      return;
    }

    setIsProcessingPayment(true);
    try {
      const paymentResponse = await createMidtransShirtPaymentLink({
        shirtId,
        shirtTitle,
        price: data.category === "anak" ? priceAnak : priceDewasa,
        shippingCost: selectedShippingCost,
        size: data.size,
        category: data.category,
        quantity: data.quantity,
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
      });

      toast.success("Payment link berhasil dibuat!");

      if (onPaymentSuccess) {
        onPaymentSuccess(paymentResponse.paymentUrl);
      } else {
        window.location.href = paymentResponse.paymentUrl;
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Gagal membuat payment link");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <Card className="border-2 border-primary/30 rounded-2xl shadow-hover">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Form Pemesanan Baju</CardTitle>
        <CardDescription>Pilih ukuran dan isi alamat pengiriman</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Product Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Pilih Ukuran</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Kategori *</Label>
                <Select
                  value={watchedCategory}
                  onValueChange={(value) => setValue("category", value as "anak" | "dewasa")}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anak">
                      Anak — Rp {priceAnak.toLocaleString("id-ID")}
                    </SelectItem>
                    <SelectItem value="dewasa">
                      Dewasa — Rp {priceDewasa.toLocaleString("id-ID")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="size">Size *</Label>
                <Select
                  value={watchedSize}
                  onValueChange={(value) => setValue("size", value)}
                >
                  <SelectTrigger id="size">
                    <SelectValue placeholder="Pilih size" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.size && (
                  <p className="text-sm text-destructive mt-1">{errors.size.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="quantity">Jumlah *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={10}
                  {...register("quantity")}
                />
                {errors.quantity && (
                  <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Data Diri</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nama Depan *</Label>
                <Input id="firstName" {...register("firstName")} placeholder="Nama depan" />
                {errors.firstName && (
                  <p className="text-sm text-destructive mt-1">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="lastName">Nama Belakang *</Label>
                <Input id="lastName" {...register("lastName")} placeholder="Nama belakang" />
                {errors.lastName && (
                  <p className="text-sm text-destructive mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register("email")} placeholder="email@example.com" />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Nomor Telepon *</Label>
              <Input id="phone" type="tel" {...register("phone")} placeholder="081234567890" />
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
              <Input id="postalCode" {...register("postalCode")} placeholder="12345" />
              {errors.postalCode && (
                <p className="text-sm text-destructive mt-1">{errors.postalCode.message}</p>
              )}
            </div>
          </div>

          {/* Shipping Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Pilihan Pengiriman</h3>

            {!village ? (
              <p className="text-sm text-muted-foreground">
                Pilih kelurahan/desa tujuan dulu untuk melihat opsi pengiriman
              </p>
            ) : isLoadingShipping ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
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
              <span>
                Harga ({watchedCategory === "anak" ? "Anak" : "Dewasa"}) × {watchedQuantity}
              </span>
              <span className="font-semibold">Rp {subtotal.toLocaleString("id-ID")}</span>
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

export default ShirtCheckoutForm;
