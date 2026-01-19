import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createMidtransClassPaymentLink, MidtransClassPaymentRequest } from "@/lib/midtrans";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const classRegistrationSchema = z.object({
  childName: z.string().min(2, "Nama anak minimal 2 karakter"),
  childDob: z.string().min(1, "Tanggal lahir wajib diisi"),
  parentName: z.string().min(2, "Nama orang tua minimal 2 karakter"),
  parentWhatsapp: z.string().min(10, "Nomor WA minimal 10 digit"),
  domicileAddress: z.string().min(5, "Alamat domisili wajib diisi"),
  socialMediaUsername: z.string().min(2, "Username IG/Tiktok wajib diisi"),
  classDay: z.string().min(2, "Pilihan hari wajib diisi"),
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
          firstName: data.parentName, // Mapping parent name to first name
          lastName: "",
          email: "guest@example.com", // Dummy email as it's not requested but required by Midtrans type
          phone: data.parentWhatsapp,
        },
        additionalDetails: {
          childName: data.childName,
          childDob: data.childDob,
          parentWhatsapp: data.parentWhatsapp,
          domicileAddress: data.domicileAddress,
          socialMediaUsername: data.socialMediaUsername,
          classDay: data.classDay,
        }
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Class Information */}
          <div className="bg-primary/10 p-4 rounded-lg border border-primary/20 mb-6">
            <p className="text-sm text-muted-foreground mb-1">Kelas yang dipilih:</p>
            <p className="font-semibold text-lg">{className}</p>
            <p className="text-2xl font-bold text-primary mt-2">
              Rp {classPrice.toLocaleString("id-ID")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="childName">Nama Anak *</Label>
              <Input id="childName" {...register("childName")} placeholder="Nama lengkap anak" />
              {errors.childName && <p className="text-destructive text-sm">{errors.childName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="childDob">Tanggal Lahir *</Label>
              <Input id="childDob" type="date" {...register("childDob")} />
              {errors.childDob && <p className="text-destructive text-sm">{errors.childDob.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentName">Nama Orang Tua *</Label>
              <Input id="parentName" {...register("parentName")} placeholder="Nama orang tua" />
              {errors.parentName && <p className="text-destructive text-sm">{errors.parentName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentWhatsapp">No WA Orang Tua *</Label>
              <Input id="parentWhatsapp" type="tel" {...register("parentWhatsapp")} placeholder="08xxxxxxxxxx" />
              {errors.parentWhatsapp && <p className="text-destructive text-sm">{errors.parentWhatsapp.message}</p>}
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label htmlFor="domicileAddress">Alamat Domisili *</Label>
              <Textarea id="domicileAddress" {...register("domicileAddress")} placeholder="Alamat lengkap" />
              {errors.domicileAddress && <p className="text-destructive text-sm">{errors.domicileAddress.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialMediaUsername">Username IG/Tiktok *</Label>
              <Input id="socialMediaUsername" {...register("socialMediaUsername")} placeholder="@username" />
              {errors.socialMediaUsername && <p className="text-destructive text-sm">{errors.socialMediaUsername.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="classDay">Pilihan Hari *</Label>
              <Input id="classDay" {...register("classDay")} placeholder="Contoh: Senin 15.00" />
              {errors.classDay && <p className="text-destructive text-sm">{errors.classDay.message}</p>}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full mt-6"
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


