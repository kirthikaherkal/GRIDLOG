import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { registerStudent, loginStudent, getStudentAuth, setStudentAuth } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import KlsGridLogo from "@/components/KlsGridLogo";

const DEPARTMENTS = ["Computer Science", "Electronics", "Mechanical", "Civil", "Electrical", "Information Science"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const StudentAuth = () => {
  const navigate = useNavigate();

  // Auto-login if valid session exists
  useEffect(() => {
    const saved = getStudentAuth();
    if (saved) navigate("/student/dashboard");
  }, [navigate]);

  // Registration
  const [name, setName] = useState("");
  const [usn, setUsn] = useState("");
  const [year, setYear] = useState("");
  const [department, setDepartment] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [newLabId, setNewLabId] = useState<string | null>(null);

  // Login
  const [labId, setLabId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const handleRegister = () => {
    if (!name || !usn || !year || !department || !regPassword) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    const student = registerStudent({ name, usn, year, department, password: regPassword });
    setNewLabId(student.labId);
    toast({ title: "Registered!", description: `Your Lab ID is ${student.labId}` });
  };

  const handleLogin = () => {
    const student = loginStudent(labId.toUpperCase(), loginPassword);
    if (!student) {
      toast({ title: "Invalid Lab ID or password", variant: "destructive" });
      return;
    }
    setStudentAuth(JSON.stringify(student));
    navigate("/student/dashboard");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <Button variant="ghost" className="absolute left-4 top-4 gap-1" onClick={() => navigate("/")}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="mb-6 flex justify-center">
        <KlsGridLogo height={40} />
      </div>

      <div className="w-full max-w-md">
        {newLabId ? (
          <Card className="border-2 border-border shadow-sm animate-fade-in card-glow">
            <CardHeader>
              <CardTitle>Registration Successful!</CardTitle>
              <CardDescription>Save your Lab ID — you'll use it to log in.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded border-2 border-primary bg-accent p-6 text-center">
                <p className="text-sm text-muted-foreground">Your Lab ID</p>
                <p className="mt-1 font-mono text-3xl font-bold text-primary">{newLabId}</p>
              </div>
              <Button className="w-full shadow-sm" onClick={() => setNewLabId(null)}>
                Go to Login
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 border-2 border-border">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-2 border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Student Login</CardTitle>
                  <CardDescription>Enter your Lab ID and password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Lab ID</Label>
                    <Input placeholder="LAB-0001" value={labId} onChange={(e) => setLabId(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                  </div>
                  <Button className="w-full shadow-sm" onClick={handleLogin}>
                    Login
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-2 border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Student Registration</CardTitle>
                  <CardDescription>Create your account to get a Lab ID</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>USN</Label>
                    <Input value={usn} onChange={(e) => setUsn(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                      <SelectContent>
                        {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                  </div>
                  <Button className="w-full shadow-sm" onClick={handleRegister}>
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
