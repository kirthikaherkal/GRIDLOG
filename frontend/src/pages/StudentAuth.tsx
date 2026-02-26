import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import KlsGridLogo from "@/components/KlsGridLogo";

const API_BASE = "http://127.0.0.1:8000";

const DEPARTMENTS = [
  "Computer Science",
  "Electronics",
  "Mechanical",
  "Civil",
  "Electrical",
  "Information Science"
];

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const StudentAuth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && token !== "undefined" && token !== "null") {
      navigate("/student/dashboard");
    }
  }, [navigate]);

  const [name, setName] = useState("");
  const [usn, setUsn] = useState("");
  const [year, setYear] = useState("");
  const [department, setDepartment] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [newLabId, setNewLabId] = useState<string | null>(null);

  const [labId, setLabId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const extractErrorMessage = (data: any) => {
    if (!data) return "Something went wrong";
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((err: any) => err.msg).join(", ");
    }
    return "Request failed";
  };

  // ---------------- REGISTER ----------------
  const handleRegister = async () => {
    if (!name || !usn || !year || !department || !regPassword) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          usn: usn.trim().toUpperCase(),
          year,
          department,
          password: regPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: extractErrorMessage(data), variant: "destructive" });
        return;
      }

      setNewLabId(data.lab_id);
      toast({ title: "Registered Successfully" });

    } catch {
      toast({ title: "Server error", variant: "destructive" });
    }
  };

  // ---------------- LOGIN ----------------
  const handleLogin = async () => {
    if (!labId || !loginPassword) {
      toast({ title: "Enter Lab ID and Password", variant: "destructive" });
      return;
    }

    try {
      const formData = new URLSearchParams();
      formData.append("username", labId.trim().toUpperCase());
      formData.append("password", loginPassword.trim());
      formData.append("grant_type", "password");

      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),   // IMPORTANT FIX
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: extractErrorMessage(data), variant: "destructive" });
        return;
      }

      localStorage.setItem("token", data.access_token);
      navigate("/student/dashboard");

    } catch {
      toast({ title: "Server error", variant: "destructive" });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
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

      <div className="w-full max-w-md">
        {newLabId ? (
          <Card>
            <CardHeader>
              <CardTitle>Registration Successful</CardTitle>
              <CardDescription>Save your Lab ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded border p-6 text-center">
                <p>Your Lab ID</p>
                <p className="mt-2 font-mono text-3xl font-bold">
                  {newLabId}
                </p>
              </div>
              <Button className="w-full" onClick={() => setNewLabId(null)}>
                Go to Login
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Student Login</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Label>Lab ID</Label>
                  <Input
                    placeholder="LAB-01"
                    value={labId}
                    onChange={(e) => setLabId(e.target.value)}
                  />

                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />

                  <Button className="w-full" onClick={handleLogin}>
                    Login
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Student Registration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Label>Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />

                  <Label>USN</Label>
                  <Input value={usn} onChange={(e) => setUsn(e.target.value)} />

                  <Label>Year</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Label>Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />

                  <Button className="w-full" onClick={handleRegister}>
                    Register
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
};

export default StudentAuth;