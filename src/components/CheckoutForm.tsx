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
import { createMidtransPaymentLink, MidtransPaymentRequest } from "@/lib/midtrans";
import { calculateShippingCost, ShippingResponse, ShippingCost } from "@/lib/shipping";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const checkoutSchema = z.object({
  firstName: z.string().min(2, "Nama depan minimal 2 karakter"),
  lastName: z.string().min(2, "Nama belakang minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit"),
  address: z.string().min(10, "Alamat lengkap minimal 10 karakter"),
  city: z.string().min(2, "Kota harus diisi"),
  postalCode: z.string().min(5, "Kode pos minimal 5 digit"),
  province: z.string().min(2, "Provinsi harus diisi"),
  courier: z.enum(["jne", "tiki", "pos"]),
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
  const [shippingOptions, setShippingOptions] = useState<ShippingResponse | null>(null);
  const [selectedShippingCost, setSelectedShippingCost] = useState<number>(0);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      courier: "jne",
    },
  });

  const watchedCity = watch("city");
  const watchedCourier = watch("courier");

  // Fetch shipping options when city or courier changes
  useEffect(() => {
    if (watchedCity && watchedCity.length >= 2) {
      fetchShippingOptions(watchedCity, watchedCourier);
    }
  }, [watchedCity, watchedCourier]);

  const fetchShippingOptions = async (city: string, courier: "jne" | "tiki" | "pos") => {
    if (!city || city.length < 2) {
      return;
    }
    
    setIsLoadingShipping(true);
    try {
      // Use city name as both ID and name for now
      // In production, backend should handle city ID lookup
      const response = await calculateShippingCost(city, city, courier);
      setShippingOptions(response);
      // Auto-select first option
      if (response.costs.length > 0) {
        setValue("shippingService", response.costs[0].service);
        setSelectedShippingCost(response.costs[0].cost);
      }
    } catch (error) {
      console.error("Shipping calculation error:", error);
      // Fallback will be handled by calculateShippingCost function
      const fallback = await calculateShippingCost(city, city, courier);
      setShippingOptions(fallback);
      if (fallback.costs.length > 0) {
        setValue("shippingService", fallback.costs[0].service);
        setSelectedShippingCost(fallback.costs[0].cost);
      }
    } finally {
      setIsLoadingShipping(false);
    }
  };

  const handleShippingServiceChange = (service: string) => {
    setValue("shippingService", service);
    const selectedService = shippingOptions?.costs.find((cost) => cost.service === service);
    if (selectedService) {
      setSelectedShippingCost(selectedService.cost);
    }
  };

  const onSubmit = async (data: CheckoutFormData) => {
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
          address: data.address,
          city: data.city,
          postalCode: data.postalCode,
          province: data.province,
        },
      };

      const paymentResponse = await createMidtransPaymentLink(paymentRequest);
      
      toast.success("Payment link berhasil dibuat!");
      
      if (onPaymentSuccess) {
        onPaymentSuccess(paymentResponse.paymentUrl);
      } else {
        // Redirect to payment URL
        window.location.href = paymentResponse.paymentUrl;
      }
    } catch (error) {
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
                <Input
                  id="firstName"
                  {...register("firstName")}
                  placeholder="Nama depan"
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive mt-1">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="lastName">Nama Belakang *</Label>
                <Input
                  id="lastName"
                  {...register("lastName")}
                  placeholder="Nama belakang"
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Nomor Telepon *</Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                placeholder="081234567890"
              />
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
                placeholder="Jl. Contoh No. 123, RT/RW, Kelurahan"
                rows={3}
              />
              {errors.address && (
                <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Kota *</Label>
                <Input
                  id="city"
                  {...register("city")}
                  placeholder="Contoh: Jakarta"
                />
                {errors.city && (
                  <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="province">Provinsi *</Label>
                <Input
                  id="province"
                  {...register("province")}
                  placeholder="Contoh: DKI Jakarta"
                />
                {errors.province && (
                  <p className="text-sm text-destructive mt-1">{errors.province.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="postalCode">Kode Pos *</Label>
              <Input
                id="postalCode"
                {...register("postalCode")}
                placeholder="12345"
              />
              {errors.postalCode && (
                <p className="text-sm text-destructive mt-1">{errors.postalCode.message}</p>
              )}
            </div>
          </div>

          {/* Shipping Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Pilihan Pengiriman</h3>
            
            <div>
              <Label htmlFor="courier">Kurir *</Label>
              <Select
                value={watchedCourier}
                onValueChange={(value) => setValue("courier", value as "jne" | "tiki" | "pos")}
              >
                <SelectTrigger id="courier">
                  <SelectValue placeholder="Pilih kurir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jne">JNE</SelectItem>
                  <SelectItem value="tiki">TIKI</SelectItem>
                  <SelectItem value="pos">POS Indonesia</SelectItem>
                </SelectContent>
              </Select>
              {errors.courier && (
                <p className="text-sm text-destructive mt-1">{errors.courier.message}</p>
              )}
            </div>

            {isLoadingShipping ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menghitung ongkir...</span>
              </div>
            ) : shippingOptions && shippingOptions.costs.length > 0 ? (
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
                    {shippingOptions.costs.map((cost: ShippingCost) => (
                      <SelectItem key={cost.service} value={cost.service}>
                        {cost.description} - Rp {cost.cost.toLocaleString("id-ID")} ({cost.etd})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.shippingService && (
                  <p className="text-sm text-destructive mt-1">{errors.shippingService.message}</p>
                )}
              </div>
            ) : watchedCity && watchedCity.length >= 2 ? (
              <p className="text-sm text-muted-foreground">
                Masukkan kota untuk melihat pilihan pengiriman
              </p>
            ) : null}
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
                  : "Menghitung..."}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold text-primary pt-2 border-t">
              <span>Total:</span>
              <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isProcessingPayment || selectedShippingCost === 0}
          >
            {isProcessingPayment ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                💳 Lanjutkan ke Pembayaran
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CheckoutForm;

