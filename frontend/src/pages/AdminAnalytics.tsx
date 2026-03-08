import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import KlsGridLogo from "@/components/KlsGridLogo";

const COLORS = ["#6366f1", "#22c55e", "#f97316", "#ef4444"];
const API_BASE = "https://gridlog-zgmu.onrender.com";

const AdminAnalytics = () => {
  const navigate = useNavigate();

  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  const [studentActivity, setStudentActivity] = useState<any[]>([]);
  const [regularity, setRegularity] = useState<any[]>([]);
  const [departmentUsage, setDepartmentUsage] = useState<any[]>([]);
  const [sessionHistory, setSessionHistory] = useState<any>({});

  const token = localStorage.getItem("access_token");

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

        const endpoints = [
          "/admin/analytics/students",
          "/admin/analytics/regularity",
          "/admin/analytics/departments",
          "/admin/analytics/history"
        ];

        const responses = await Promise.all(
          endpoints.map(ep =>
            fetch(`${API_BASE}${ep}`, { headers })
          )
        );

        // If any endpoint returns 401 → token invalid
        if (responses.some(r => r.status === 401)) {
          localStorage.removeItem("access_token");
          navigate("/admin/login");
          return;
        }

        const data = await Promise.all(
          responses.map(r => r.ok ? r.json() : null)
        );

        const [students, regular, departments, history] = data;

        setStudentActivity(Array.isArray(students) ? students : []);
        setRegularity(Array.isArray(regular) ? regular : []);
        setDepartmentUsage(Array.isArray(departments) ? departments : []);
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
          <CardTitle>{person.name} — Work History</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
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

    let dataset: any[] = [];

    if (expandedChart === "students")
      dataset = studentActivity;

    if (expandedChart === "regularity")
      dataset = studentActivity.filter(
        s => s.type === selectedEntity?.name
      );

    if (expandedChart === "department")
      dataset = studentActivity.filter(
        s => s.dept === selectedEntity?.dept
      );

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
              {Array.isArray(dataset) && dataset.map((item, i) => (
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

        <div className="grid gap-6 md:grid-cols-2">

          <Card
            className="border-2 cursor-pointer"
            onClick={()=>setExpandedChart("students")}
          >
            <CardHeader>
              <CardTitle>Most Active Students</CardTitle>
            </CardHeader>

            <CardContent className="h-[300px]">
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

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Student Regularity</CardTitle>
            </CardHeader>

            <CardContent className="h-[300px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={regularity} dataKey="value" outerRadius={100}>
                    {regularity.map((_, i) =>
                      <Cell key={i} fill={COLORS[i % COLORS.length]}/>
                    )}
                  </Pie>
                  <Tooltip/>
                  <Legend/>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Department Usage</CardTitle>
            </CardHeader>

            <CardContent className="h-[300px]">
              <ResponsiveContainer>
                <BarChart layout="vertical" data={departmentUsage}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis type="number"/>
                  <YAxis dataKey="dept" type="category"/>
                  <Tooltip/>
                  <Bar dataKey="sessions" fill="#f97316"/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>
      </div>

      <ExpandedOverlay />
    </main>
  );
};

export default AdminAnalytics;