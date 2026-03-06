import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import KlsGridLogo from "@/components/KlsGridLogo";

const API_BASE = "https://gridlog-zgmu.onrender.com";

const AdminAuth = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // ✅ Auto-login if JWT exists
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!username || !password) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }

    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);
      formData.append("grant_type", "password");

      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: data.detail || "Invalid credentials",
          variant: "destructive",
        });
        return;
      }

      // Clear student JWT if exists
      localStorage.removeItem("token");

      // Store admin JWT
      localStorage.setItem("admin_token", data.access_token);

      toast({ title: "Login successful" });
      navigate("/admin/dashboard");

    } catch {
      toast({ title: "Server error", variant: "destructive" });
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background p-6 overflow-hidden">

      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105 animate-bgSlowZoom"
        style={{ backgroundImage: "url('/lab.jpg')" }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full flex flex-col items-center">

        {/* Back button unchanged */}
        <Button
          variant="ghost"
          className="absolute left-4 top-4 gap-1"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="mb-6 flex justify-center">
          <KlsGridLogo height={40} />
        </div>

        <Card className="w-full max-w-md border-2 border-border shadow-sm">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Log in with administrator credentials
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              className="w-full shadow-sm"
              onClick={handleLogin}
            >
              Login
            </Button>
          </CardContent>
        </Card>

      </div>
    </main>
  );
};

export default AdminAuth;