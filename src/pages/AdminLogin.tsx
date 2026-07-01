import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/lib/cms";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await adminApi.login(email, password);
      toast.success("Login admin berhasil");
      navigate("/admin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20 px-4 py-12">
      <Card className="mx-auto max-w-md border-2 border-primary/30 shadow-hover">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Admin Nala</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>{loading ? "Masuk..." : "Masuk"}</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};

export default AdminLogin;
