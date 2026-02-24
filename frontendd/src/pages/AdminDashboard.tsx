import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getStudents, getSessions, type Student, type Session, getAdminAuth, clearAdminAuth } from "@/lib/store";
import { LogOut, ArrowLeft, ChevronDown, ChevronUp, Search, ArrowUpDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import KlsGridLogo from "@/components/KlsGridLogo";

type SortField = "date" | "name";
type SortDir = "asc" | "desc";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [dateFilter, setDateFilter] = useState(format(new Date(), "yyyy-MM-dd"));
  const [nameSearch, setNameSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedDesc, setExpandedDesc] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!getAdminAuth() && !sessionStorage.getItem("isAdmin")) { navigate("/admin"); return; }
    setStudents(getStudents());
    setSessions(getSessions());
  }, [navigate]);

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const activeSessions = useMemo(
    () => sessions.filter((s) => !s.checkOutTime),
    [sessions]
  );

  const filteredSessions = useMemo(() => {
    let result = sessions.filter((s) => {
      const sessionDate = format(parseISO(s.checkInTime), "yyyy-MM-dd");
      if (dateFilter && sessionDate !== dateFilter) return false;
      if (nameSearch) {
        const st = studentMap.get(s.studentId);
        if (!st?.name.toLowerCase().includes(nameSearch.toLowerCase())) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      if (sortField === "date") {
        const diff = new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime();
        return sortDir === "asc" ? diff : -diff;
      } else {
        const nameA = studentMap.get(a.studentId)?.name ?? "";
        const nameB = studentMap.get(b.studentId)?.name ?? "";
        const diff = nameA.localeCompare(nameB);
        return sortDir === "asc" ? diff : -diff;
      }
    });
    return result;
  }, [sessions, dateFilter, nameSearch, sortField, sortDir, studentMap]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const toggleDesc = (id: string) => {
    setExpandedDesc((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleLogout = () => {
    clearAdminAuth();
    sessionStorage.removeItem("isAdmin");
    navigate("/admin");
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
    return sortDir === "asc"
      ? <ChevronUp className="ml-1 inline h-3 w-3 text-primary" />
      : <ChevronDown className="ml-1 inline h-3 w-3 text-primary" />;
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
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
          <Button variant="outline" size="sm" className="gap-1 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>

        {/* Currently Checked In */}
        <Card className="mb-6 border-2 border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Currently Checked In
              <Badge className="bg-primary text-primary-foreground">{activeSessions.length}</Badge>
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
                    <TableHead>Check-In Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSessions.map((s) => {
                    const st = studentMap.get(s.studentId);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{st?.name ?? "Unknown"}</TableCell>
                        <TableCell>{st?.usn}</TableCell>
                        <TableCell>{st?.department}</TableCell>
                        <TableCell>{format(parseISO(s.checkInTime), "hh:mm a")}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* All Records */}
        <Card className="border-2 border-border shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Records</CardTitle>
              <div className="flex flex-wrap gap-2">
                {/* Name search */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={nameSearch}
                    onChange={(e) => setNameSearch(e.target.value)}
                    className="w-44 border-2 border-border pl-8"
                  />
                </div>
                {/* Date filter */}
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-auto border-2 border-border"
                />
                {/* Clear filters */}
                {(nameSearch || dateFilter !== format(new Date(), "yyyy-MM-dd")) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={() => { setNameSearch(""); setDateFilter(format(new Date(), "yyyy-MM-dd")); }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredSessions.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No records found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none hover:text-primary"
                      onClick={() => toggleSort("name")}
                    >
                      Name <SortIcon field="name" />
                    </TableHead>
                    <TableHead>USN</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead
                      className="cursor-pointer select-none hover:text-primary"
                      onClick={() => toggleSort("date")}
                    >
                      In <SortIcon field="date" />
                    </TableHead>
                    <TableHead>Out</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((s) => {
                    const st = studentMap.get(s.studentId);
                    const isExpanded = expandedDesc.has(s.id);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{st?.name ?? "Unknown"}</TableCell>
                        <TableCell>{st?.usn}</TableCell>
                        <TableCell>{st?.department}</TableCell>
                        <TableCell>{st?.year}</TableCell>
                        <TableCell>{format(parseISO(s.checkInTime), "hh:mm a")}</TableCell>
                        <TableCell>
                          {s.checkOutTime ? format(parseISO(s.checkOutTime), "hh:mm a") : <Badge className="bg-primary text-primary-foreground animate-pulse">Active</Badge>}
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          {s.description ? (
                            <div>
                              <p className={`text-xs ${isExpanded ? "" : "line-clamp-2"}`}>
                                {s.description}
                              </p>
                              <button
                                onClick={() => toggleDesc(s.id)}
                                className="mt-1 flex items-center gap-0.5 text-xs text-primary hover:underline"
                              >
                                {isExpanded ? (
                                  <><ChevronUp className="h-3 w-3" /> Show less</>
                                ) : (
                                  <><ChevronDown className="h-3 w-3" /> Read more</>
                                )}
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
