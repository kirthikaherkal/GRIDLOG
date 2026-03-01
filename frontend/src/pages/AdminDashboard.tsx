import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LogOut, ArrowLeft, ChevronDown, ChevronUp, Search, ArrowUpDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import KlsGridLogo from "@/components/KlsGridLogo";

const API_BASE = "http://127.0.0.1:8000";

type SortField = "date" | "name";
type SortDir = "asc" | "desc";

type Student = {
  name: string;
  usn: string;
  department: string;
  year: string;
  lab_id: string;
};

type Session = {
  id: number;
  student: Student;
  check_in_time: string;
  check_out_time: string | null;
  description: string | null;
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [dateFilter, setDateFilter] = useState(format(new Date(), "yyyy-MM-dd"));
  const [nameSearch, setNameSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedDesc, setExpandedDesc] = useState<Set<number>>(new Set());

  // ✅ LOAD DATA FROM BACKEND
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

        setSessions(await allRes.json());
        setActiveSessions(await activeRes.json());
      } catch {
        localStorage.removeItem("admin_token");
        navigate("/admin");
      }
    };

    load();
  }, [navigate]);

  // ✅ FILTER + SORT (unchanged logic)
  const filteredSessions = useMemo(() => {
    let result = sessions.filter((s) => {
      const sessionDate = format(parseISO(s.check_in_time), "yyyy-MM-dd");

      if (dateFilter && sessionDate !== dateFilter) return false;

      if (nameSearch) {
        if (!s.student.name.toLowerCase().includes(nameSearch.toLowerCase()))
          return false;
      }

      return true;
    });

    result = [...result].sort((a, b) => {
      if (sortField === "date") {
        const diff =
          new Date(a.check_in_time).getTime() -
          new Date(b.check_in_time).getTime();
        return sortDir === "asc" ? diff : -diff;
      } else {
        const diff = a.student.name.localeCompare(b.student.name);
        return sortDir === "asc" ? diff : -diff;
      }
    });

    return result;
  }, [sessions, dateFilter, nameSearch, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const toggleDesc = (id: number) => {
    setExpandedDesc((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin");
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
    return sortDir === "asc"
      ? <ChevronUp className="ml-1 inline h-3 w-3 text-primary" />
      : <ChevronDown className="ml-1 inline h-3 w-3 text-primary" />;
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">

        {/* HEADER — unchanged */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" className="mb-1 gap-1 px-0" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" /> Home
            </Button>
            <div className="flex items-center gap-3">
              <KlsGridLogo variant="badge" height={28} />
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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

        {/* ACTIVE USERS */}
        <Card className="mb-6 border-2 border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Currently Checked In
              <Badge className="bg-primary text-primary-foreground">
                {activeSessions.length}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {activeSessions.length === 0 ? (
              <p className="text-muted-foreground">
                No students currently checked in.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>USN</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Check-In Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.student.name}</TableCell>
                      <TableCell>{s.student.usn}</TableCell>
                      <TableCell>{s.student.department}</TableCell>
                      <TableCell>
                        {format(parseISO(s.check_in_time), "hh:mm a")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* RECORDS TABLE — UI untouched */}
        <Card className="border-2 border-border shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Records</CardTitle>

              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={nameSearch}
                    onChange={(e) => setNameSearch(e.target.value)}
                    className="w-44 border-2 border-border pl-8"
                  />
                </div>

                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-auto border-2 border-border"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filteredSessions.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No records found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => toggleSort("name")} className="cursor-pointer">
                      Name <SortIcon field="name" />
                    </TableHead>
                    <TableHead>USN</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead onClick={() => toggleSort("date")} className="cursor-pointer">
                      In <SortIcon field="date" />
                    </TableHead>
                    <TableHead>Out</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredSessions.map((s) => {
                    const expanded = expandedDesc.has(s.id);

                    return (
                      <TableRow key={s.id}>
                        <TableCell>{s.student.name}</TableCell>
                        <TableCell>{s.student.usn}</TableCell>
                        <TableCell>{s.student.department}</TableCell>
                        <TableCell>{s.student.year}</TableCell>

                        <TableCell>
                          {format(parseISO(s.check_in_time), "hh:mm a")}
                        </TableCell>

                        <TableCell>
                          {s.check_out_time
                            ? format(parseISO(s.check_out_time), "hh:mm a")
                            : <Badge className="bg-primary text-primary-foreground animate-pulse">Active</Badge>}
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