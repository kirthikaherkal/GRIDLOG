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

const API_BASE = "https://gridlog-zgmu.onrender.com";

const DEPARTMENTS = [
  "Computer Science","Electronics","Mechanical",
  "Civil","Electrical","Information Science"
];

const YEARS = ["1st Year","2nd Year","3rd Year","4th Year"];

const StudentAuth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/student/dashboard",{replace:true});
  }, []);

  const [name,setName]=useState("");
  const [usn,setUsn]=useState("");
  const [year,setYear]=useState("");
  const [department,setDepartment]=useState("");
  const [startup,setStartup]=useState("");   // ✅ added
  const [regPassword,setRegPassword]=useState("");
  const [newLabId,setNewLabId]=useState<string|null>(null);

  const [labId,setLabId]=useState("");
  const [loginPassword,setLoginPassword]=useState("");

  const extractErrorMessage=(data:any)=>
    typeof data?.detail==="string"?data.detail:"Request failed";

  const handleRegister=async()=>{
    const res=await fetch(`${API_BASE}/register`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        name:name.trim(),
        usn:usn.trim().toUpperCase(),
        year,
        department,
        startup:startup.trim(),  // ✅ sent to backend
        password:regPassword.trim()
      })
    });

    const data=await res.json();

    if(!res.ok){
      toast({title:extractErrorMessage(data),variant:"destructive"});
      return;
    }

    setNewLabId(data.lab_id);
    toast({title:"Registered Successfully"});
  };

  const handleLogin=async()=>{
    const formData=new URLSearchParams();
    formData.append("username",labId.trim().toUpperCase());
    formData.append("password",loginPassword.trim());
    formData.append("grant_type","password");

    const res=await fetch(`${API_BASE}/login`,{
      method:"POST",
      headers:{
        "Content-Type":"application/x-www-form-urlencoded"
      },
      body:formData.toString()
    });

    const data=await res.json();

    if(!res.ok){
      toast({title:extractErrorMessage(data),variant:"destructive"});
      return;
    }

    localStorage.setItem("token",data.access_token);

    setTimeout(()=>{
      navigate("/student/dashboard",{replace:true});
    },50);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background p-6 overflow-hidden">

      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105 animate-bgSlowZoom"
        style={{ backgroundImage: "url('/lab.jpg')" }}
      />

      {/* overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60 backdrop-blur-[2px]" />

      {/* content */}
      <div className="relative z-10 w-full flex flex-col items-center">

        <Button
          variant="ghost"
          className="absolute left-4 top-4 gap-1"
          onClick={()=>navigate("/")}>
          <ArrowLeft className="h-4 w-4"/> Back
        </Button>

        <div className="mb-6 flex justify-center">
          <KlsGridLogo height={40}/>
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
                <Button className="w-full" onClick={()=>setNewLabId(null)}>
                  Go to Login
                </Button>
              </CardContent>
            </Card>
          ):(
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
                    <Input value={labId}
                      onChange={e=>setLabId(e.target.value)}/>
                    <Label>Password</Label>
                    <Input type="password"
                      value={loginPassword}
                      onChange={e=>setLoginPassword(e.target.value)}/>
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
                    <Input value={name}
                      onChange={e=>setName(e.target.value)}/>
                    <Label>USN</Label>
                    <Input value={usn}
                      onChange={e=>setUsn(e.target.value)}/>
                    <Label>Year</Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {YEARS.map(y=>(
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Label>Department</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map(d=>(
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Label>Startup Name</Label>
                    <Input value={startup}
                      onChange={e=>setStartup(e.target.value)}/>

                    <Label>Password</Label>
                    <Input type="password"
                      value={regPassword}
                      onChange={e=>setRegPassword(e.target.value)}/>
                    <Button className="w-full" onClick={handleRegister}>
                      Register
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </main>
  );
};

export default StudentAuth;