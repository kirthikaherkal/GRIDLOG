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

  // ✅ auto login if token exists
  useEffect(() => {
  const adminToken = localStorage.getItem("admin_token");
  if (adminToken) navigate("/admin/dashboard");
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

    // ✅ CRITICAL FIX — clear student session
    localStorage.removeItem("token");          // student JWT
    sessionStorage.removeItem("currentStudent");

    // ✅ store admin token
    localStorage.setItem("admin_token", data.access_token);

    toast({ title: "Login successful" });
    navigate("/admin/dashboard");

  } catch {
    toast({ title: "Server error", variant: "destructive" });
  }
};

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <Button variant="ghost" className="absolute left-4 top-4 gap-1" onClick={() => navigate("/")}>
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
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <Button className="w-full shadow-sm" onClick={handleLogin}>
            Login
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default AdminAuth;