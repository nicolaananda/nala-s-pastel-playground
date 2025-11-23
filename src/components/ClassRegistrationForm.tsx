import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createMidtransClassPaymentLink, MidtransClassPaymentRequest } from "@/lib/midtrans";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const classRegistrationSchema = z.object({
  firstName: z.string().min(2, "Nama depan minimal 2 karakter"),
  lastName: z.string().min(2, "Nama belakang minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit"),
});

type ClassRegistrationFormData = z.infer<typeof classRegistrationSchema>;

interface ClassRegistrationFormProps {
  classId: string;
  className: string;
  classPrice: number;
  onPaymentSuccess?: (paymentUrl: string) => void;
}

const ClassRegistrationForm = ({ 
  classId, 
  className, 
  classPrice, 
  onPaymentSuccess 
}: ClassRegistrationFormProps) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassRegistrationFormData>({
    resolver: zodResolver(classRegistrationSchema),
  });

  const onSubmit = async (data: ClassRegistrationFormData) => {
    setIsProcessingPayment(true);
    try {
      const paymentRequest: MidtransClassPaymentRequest = {
        classId,
        className,
        price: classPrice,
        customerDetails: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
        },
      };

      const paymentResponse = await createMidtransClassPaymentLink(paymentRequest);
      
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

  return (
    <Card className="border-2 border-primary/30 rounded-2xl shadow-hover">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Form Pendaftaran Kelas</CardTitle>
        <CardDescription>Isi data berikut untuk melanjutkan pembayaran</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Class Information */}
          <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Kelas yang dipilih:</p>
            <p className="font-semibold text-lg">{className}</p>
            <p className="text-2xl font-bold text-primary mt-2">
              Rp {classPrice.toLocaleString("id-ID")}
            </p>
          </div>

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

          {/* Price Summary */}
          <div className="border-t-2 border-primary/20 pt-4">
            <div className="flex justify-between text-lg font-bold text-primary">
              <span>Total:</span>
              <span>Rp {classPrice.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isProcessingPayment}
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

export default ClassRegistrationForm;

