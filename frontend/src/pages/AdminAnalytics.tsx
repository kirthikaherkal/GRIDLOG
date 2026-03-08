import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  BarChart, Bar,
  XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import KlsGridLogo from "@/components/KlsGridLogo";

const API_BASE = "https://gridlog-zgmu.onrender.com";

const AdminAnalytics = () => {
  const navigate = useNavigate();

  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [studentActivity, setStudentActivity] = useState<any[]>([]);
  const [sessionHistory, setSessionHistory] = useState<any>({});

  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    const fetchData = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`
        };

        const [studentsRes, historyRes] = await Promise.all([
          fetch(`${API_BASE}/admin/analytics/students`, { headers }),
          fetch(`${API_BASE}/admin/analytics/history`, { headers })
        ]);

        if (studentsRes.status === 401 || historyRes.status === 401) {
          localStorage.removeItem("admin_token");
          navigate("/admin/login");
          return;
        }

        const students = studentsRes.ok ? await studentsRes.json() : [];
        const history = historyRes.ok ? await historyRes.json() : {};

        setStudentActivity(Array.isArray(students) ? students : []);
        setSessionHistory(history && typeof history === "object" ? history : {});

      } catch (err) {
        console.error("Analytics fetch error:", err);
      }
    };

    fetchData();
  }, [token, navigate]);

  const ProfileView = ({ person }: any) => {
    const sessions = sessionHistory?.[person.name] || [];

    return (
      <Card className="mt-4 border-2">
        <CardHeader>
          <CardTitle>{person.name} — Profile & Work History</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* 🔹 Added Profile Info */}
          <div className="border rounded-lg p-3 space-y-1">
            <p><b>Year:</b> {person.year}</p>
            <p><b>Department:</b> {person.dept}</p>
            <p><b>Startup:</b> {person.startup}</p>
            <p><b>Total Sessions:</b> {person.sessions}</p>
          </div>

          {/* 🔹 Work History */}
          {sessions.length === 0 ? (
            <p>No activity recorded.</p>
          ) : (
            sessions.map((s: any, i: number) => (
              <div key={i} className="border rounded-lg p-3">
                <p><b>Date:</b> {s.date}</p>
                <p><b>Hours Worked:</b> {s.hours} hrs</p>
                <p><b>Description:</b> {s.desc}</p>
              </div>
            ))
          )}

        </CardContent>
      </Card>
    );
  };

  const ExpandedOverlay = () => {
    if (!expandedChart) return null;

    return (
      <div className="fixed inset-0 z-50 bg-background/95 p-6 overflow-auto">
        <div className="mx-auto max-w-6xl space-y-6">

          <Button
            variant="outline"
            onClick={()=>{
              setExpandedChart(null);
              setSelectedEntity(null);
            }}
          >
            Close
          </Button>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Detailed View</CardTitle>
            </CardHeader>

            <CardContent className="max-h-[400px] overflow-y-auto space-y-2">
              {studentActivity.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <span className="font-medium">{item.name}</span>

                  <Button
                    size="sm"
                    onClick={()=>setSelectedEntity(item)}
                  >
                    View Profile
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {selectedEntity?.name && (
            <ProfileView person={selectedEntity}/>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">

        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-1 gap-1 px-0"
            onClick={() => navigate("/admin/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>

          <div className="flex items-center gap-3">
            <KlsGridLogo variant="badge" height={28} />
            <h1 className="text-2xl font-bold">Student Analytics</h1>
          </div>
        </div>

        <Card
          className="border-2 cursor-pointer"
          onClick={()=>setExpandedChart("students")}
        >
          <CardHeader>
            <CardTitle>Most Active Students</CardTitle>
          </CardHeader>

          <CardContent className="h-[350px]">
            <ResponsiveContainer>
              <BarChart data={studentActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name"/>
                <YAxis/>
                <Tooltip/>
                <Bar dataKey="sessions" fill="#6366f1"/>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      <ExpandedOverlay />
    </main>
  );
};

export default AdminAnalytics;