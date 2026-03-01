import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { LogOut, Clock, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import KlsGridLogo from "@/components/KlsGridLogo";

const API_BASE = "http://127.0.0.1:8000";

type Student = {
  id: string;
  name: string;
  labId: string;
  department: string;
};

type Session = {
  id: number;
  student_lab_id: string;
  check_in_time: string;
  check_out_time: string | null;
  description: string | null;
};

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function duration(checkIn: string, checkOut: string) {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(mins / 60);
  return hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;
}

const StudentDashboard = () => {
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [active, setActive] = useState<Session | null>(null);
  const [description, setDescription] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);

  // ✅ LOAD USER + SESSIONS FROM BACKEND
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/student");
      return;
    }

    const loadData = async () => {
      try {
        const meRes = await fetch(`${API_BASE}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!meRes.ok) throw new Error();
        const me = await meRes.json();

        const mapped: Student = {
          id: me.lab_id,
          name: me.name,
          labId: me.lab_id,
          department: me.department,
        };

        setStudent(mapped);

        const sessRes = await fetch(`${API_BASE}/my-sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const sessData = await sessRes.json();
        setSessions(sessData);

        const activeSession = sessData.find(
          (s: Session) => s.check_out_time === null
        );
        setActive(activeSession || null);

      } catch {
        localStorage.removeItem("token");
        navigate("/student");
      }
    };

    loadData();
  }, [navigate]);

  const words = useMemo(() => wordCount(description), [description]);
  const canCheckOut = words >= 10;

  // ✅ CHECK IN → BACKEND
  const handleCheckIn = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(`${API_BASE}/checkin`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const session = await res.json();

    setActive(session);
    setSessions((prev) => [session, ...prev]);

    toast({
      title: "Checked in!",
      description: `Time: ${format(new Date(session.check_in_time), "hh:mm a")}`,
    });
  };

  // ✅ CHECK OUT → BACKEND
  const handleCheckOut = async () => {
    if (!active) return;

    const token = localStorage.getItem("token");

    await fetch(`${API_BASE}/checkout/${active.id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ description }),
    });

    const updatedSessions = await fetch(`${API_BASE}/my-sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());

    setSessions(updatedSessions);
    setActive(null);
    setDescription("");

    toast({ title: "Checked out!" });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/student");
  };

  if (!student) return null;

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">

        {/* HEADER (UNCHANGED UI) */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" className="mb-1 gap-1 px-0" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" /> Home
            </Button>

            <div className="flex items-center gap-3">
              <KlsGridLogo variant="badge" height={28} />
              <div>
                <h1 className="text-2xl font-bold">{student.name}</h1>
                <p className="font-mono text-sm text-muted-foreground">
                  {student.labId} · {student.department}
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>

        <Tabs defaultValue="session">
          <TabsList className="mb-4 grid w-full grid-cols-2 border-2 border-border">
            <TabsTrigger value="session">Current Session</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* CURRENT SESSION */}
          <TabsContent value="session">
            {!active ? (
              <Card className="border-2 border-border shadow-sm">
                <CardContent className="flex flex-col items-center gap-4 p-8">
                  <div className="rounded-full bg-accent p-4">
                    <Clock className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-muted-foreground">No active session</p>
                  <Button className="shadow-sm" size="lg" onClick={handleCheckIn}>
                    Check In
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground animate-pulse">
                      Checked In
                    </Badge>
                    <span className="text-sm font-normal text-muted-foreground">
                      {format(new Date(active.check_in_time), "hh:mm a, MMM d")}
                    </span>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Textarea
                    rows={6}
                    placeholder="Describe the work you did in this session (minimum 10 words)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />

                  <Button
                    className="w-full shadow-sm"
                    disabled={!canCheckOut}
                    onClick={handleCheckOut}
                  >
                    Check Out
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* HISTORY */}
          <TabsContent value="history">
            <Card className="border-2 border-border shadow-sm">
              <CardHeader>
                <CardTitle>Session History</CardTitle>
              </CardHeader>

              <CardContent>
                {sessions.filter(s => s.check_out_time).length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    No past sessions yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>In</TableHead>
                        <TableHead>Out</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {sessions
                        .filter(s => s.check_out_time)
                        .map((s) => (
                          <TableRow key={s.id}>
                            <TableCell>{format(new Date(s.check_in_time), "MMM d, yyyy")}</TableCell>
                            <TableCell>{format(new Date(s.check_in_time), "hh:mm a")}</TableCell>
                            <TableCell>{format(new Date(s.check_out_time!), "hh:mm a")}</TableCell>
                            <TableCell>{duration(s.check_in_time, s.check_out_time!)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>

                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default StudentDashboard;