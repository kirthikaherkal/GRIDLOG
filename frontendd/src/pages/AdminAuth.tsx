import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdmin, registerAdmin, loginAdmin, getAdminAuth, setAdminAuth } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import KlsGridLogo from "@/components/KlsGridLogo";

const AdminAuth = () => {
  const navigate = useNavigate();
  const [adminExists, setAdminExists] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Auto-login if valid session exists
    if (getAdminAuth()) { navigate("/admin/dashboard"); return; }
    setAdminExists(getAdmin() !== null);
  }, [navigate]);

  const handleRegister = () => {
    if (!username || !password) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    registerAdmin(username, password);
    setAdminExists(true);
    toast({ title: "Admin account created!" });
  };

  const handleLogin = () => {
    if (loginAdmin(username, password)) {
      setAdminAuth();
      navigate("/admin/dashboard");
    } else {
      toast({ title: "Invalid credentials", variant: "destructive" });
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
          <CardTitle>{adminExists ? "Admin Login" : "Admin Setup"}</CardTitle>
          <CardDescription>
            {adminExists
              ? "Log in with your admin credentials"
              : "Create the one-time admin account"}
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
          <Button
            className="w-full shadow-sm"
            onClick={adminExists ? handleLogin : handleRegister}
          >
            {adminExists ? "Login" : "Create Admin Account"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default AdminAuth;
