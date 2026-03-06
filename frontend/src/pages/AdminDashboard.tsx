import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LogOut, ArrowLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import KlsGridLogo from "@/components/KlsGridLogo";

const API_BASE = "https://gridlog-zgmu.onrender.com";

type Student = {
  name: string;
  usn: string;
  department: string;
  year: string;
  lab_id: string;
  startup: string;
};

type Session = {
  id: number;
  student: Student;
  check_in_time?: string;
  check_out_time?: string | null;
  description?: string | null;
};

const safeDate = (d?: string) => {
  if (!d) return "—";
  try {
    return format(parseISO(d), "hh:mm a");
  } catch {
    return "—";
  }
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [expandedDesc, setExpandedDesc] = useState<Set<number>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      navigate("/admin");
      return;
    }

    const load = async () => {
      try {
        const allRes = await fetch(`${API_BASE}/admin/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const activeRes = await fetch(`${API_BASE}/admin/active`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!allRes.ok || !activeRes.ok) {
          throw new Error("Unauthorized");
        }

        const allData = await allRes.json();
        const activeData = await activeRes.json();

        setSessions(allData);
        setActiveSessions(activeData);

      } catch {
        localStorage.removeItem("admin_token");
        navigate("/admin");
      }
    };

    load();
  }, [navigate]);

  const toggleDesc = (id: number) => {
    setExpandedDesc(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin");
  };

  return (
    <main className="relative min-h-screen bg-background p-4 sm:p-6 overflow-hidden">

      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105 animate-bgSlowZoom"
        style={{ backgroundImage: "url('/lab.jpg')" }}
      />

      {/* overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60 backdrop-blur-[2px]" />

      <div className="relative z-10 mx-auto max-w-5xl">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" className="mb-1 gap-1 px-0" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" /> Home
            </Button>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Button
              size="sm"
              className="border-2 w-full md:w-auto"
              onClick={() => navigate("/admin/analytics")}
            >
              View Analytics
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full md:w-auto"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>

        <Card className="mb-6 border-2 border-border shadow-sm">
          <CardHeader>
            <CardTitle>
              Currently Checked In
              <Badge className="ml-2">{activeSessions.length}</Badge>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {activeSessions.length === 0 ? (
              <p className="text-muted-foreground">No students currently checked in.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>USN</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Check-In</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.student.name}</TableCell>
                      <TableCell>{s.student.usn}</TableCell>
                      <TableCell>{s.student.department}</TableCell>
                      <TableCell>{safeDate(s.check_in_time)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-border shadow-sm">
          <CardHeader>
            <CardTitle>Records</CardTitle>
          </CardHeader>

          <CardContent>
            {sessions.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No records found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>USN</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>In</TableHead>
                    <TableHead>Out</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {sessions.map((s) => {
                    const expanded = expandedDesc.has(s.id);

                    return (
                      <TableRow key={s.id}>
                        <TableCell>{s.student.name}</TableCell>
                        <TableCell>{s.student.usn}</TableCell>
                        <TableCell>{s.student.department}</TableCell>
                        <TableCell>{s.student.year}</TableCell>
                        <TableCell>{safeDate(s.check_in_time)}</TableCell>
                        <TableCell>
                          {s.check_out_time
                            ? safeDate(s.check_out_time)
                            : <Badge className="animate-pulse">Active</Badge>}
                        </TableCell>

                        <TableCell className="max-w-[220px]">
                          {s.description ? (
                            <div>
                              <p className={`text-xs ${expanded ? "" : "line-clamp-2"}`}>
                                {s.description}
                              </p>
                              <button
                                onClick={() => toggleDesc(s.id)}
                                className="mt-1 text-xs text-primary hover:underline"
                              >
                                {expanded ? "Show less" : "Read more"}
                              </button>
                            </div>
                          ) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>

              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default AdminDashboard;