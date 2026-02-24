import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getActiveSession, getStudentSessions, checkIn, checkOut, type Student, type Session, getStudentAuth, clearStudentAuth } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import { LogOut, Clock, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import KlsGridLogo from "@/components/KlsGridLogo";

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

  useEffect(() => {
    // Try persistent auth first, then fall back to sessionStorage
    const raw = getStudentAuth() || sessionStorage.getItem("currentStudent");
    if (!raw) { navigate("/student"); return; }
    const s: Student = JSON.parse(raw);
    setStudent(s);
    setActive(getActiveSession(s.id));
    setSessions(getStudentSessions(s.id));
  }, [navigate]);

  const words = useMemo(() => wordCount(description), [description]);
  const canCheckOut = words >= 10;

  const handleCheckIn = () => {
    if (!student) return;
    const session = checkIn(student.id);
    setActive(session);
    setSessions(getStudentSessions(student.id));
    toast({ title: "Checked in!", description: `Time: ${format(new Date(session.checkInTime), "hh:mm a")}` });
  };

  const handleCheckOut = () => {
    if (!active) return;
    checkOut(active.id, description);
    setActive(null);
    setDescription("");
    if (student) setSessions(getStudentSessions(student.id));
    toast({ title: "Checked out!" });
  };

  const handleLogout = () => {
    clearStudentAuth();
    sessionStorage.removeItem("currentStudent");
    navigate("/student");
  };

  if (!student) return null;

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" className="mb-1 gap-1 px-0" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" /> Home
            </Button>
            <div className="flex items-center gap-3">
              <KlsGridLogo variant="badge" height={28} />
              <div>
                <h1 className="text-2xl font-bold">{student.name}</h1>
                <p className="font-mono text-sm text-muted-foreground">{student.labId} · {student.department}</p>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>

        <Tabs defaultValue="session">
          <TabsList className="mb-4 grid w-full grid-cols-2 border-2 border-border">
            <TabsTrigger value="session">Current Session</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Current Session */}
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
                    <Badge variant="default" className="bg-primary text-primary-foreground animate-pulse">Checked In</Badge>
                    <span className="text-sm font-normal text-muted-foreground">
                      {format(new Date(active.checkInTime), "hh:mm a, MMM d")}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Work Description{" "}
                      <span className={`font-mono ${canCheckOut ? "text-primary" : "text-destructive"}`}>
                        ({words}/10 words)
                      </span>
                    </label>
                    <Textarea
                      rows={6}
                      placeholder="Describe the work you did in this session (minimum 10 words)..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full shadow-sm"
                    disabled={!canCheckOut}
                    onClick={handleCheckOut}
                  >
                    Check Out
                  </Button>
                  {!canCheckOut && (
                    <p className="text-center text-sm text-muted-foreground">
                      Write at least 10 words to check out ({10 - words} more needed)
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History */}
          <TabsContent value="history">
            <Card className="border-2 border-border shadow-sm">
              <CardHeader>
                <CardTitle>Session History</CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.filter((s) => s.checkOutTime).length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No past sessions yet.</p>
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
                        .filter((s) => s.checkOutTime)
                        .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())
                        .map((s) => (
                          <TableRow key={s.id}>
                            <TableCell>{format(new Date(s.checkInTime), "MMM d, yyyy")}</TableCell>
                            <TableCell>{format(new Date(s.checkInTime), "hh:mm a")}</TableCell>
                            <TableCell>{format(new Date(s.checkOutTime!), "hh:mm a")}</TableCell>
                            <TableCell>{duration(s.checkInTime, s.checkOutTime!)}</TableCell>
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
