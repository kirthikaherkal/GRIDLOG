import { useNavigate } from "react-router-dom";
import { useState } from "react";
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

/* ================= MOCK DATA ================= */

const studentActivity = [
  { name: "Omkar", sessions: 12, type: "Regular", dept: "Mechanical" },
  { name: "Kirthika", sessions: 9, type: "Regular", dept: "CSE" },
  { name: "Rahul", sessions: 6, type: "Irregular", dept: "ECE" },
  { name: "Asha", sessions: 4, type: "Irregular", dept: "Mechanical" },
];

const regularity = [
  { name: "Regular", value: 14 },
  { name: "Irregular", value: 6 },
];

const departmentUsage = [
  { dept: "Mechanical", sessions: 25 },
  { dept: "CSE", sessions: 18 },
  { dept: "ECE", sessions: 12 },
];

const COLORS = ["#6366f1", "#22c55e", "#f97316", "#ef4444"];

/* ===== MOCK SESSION HISTORY (WHAT YOU REQUESTED) ===== */

const sessionHistory: any = {
  Omkar: [
    { date: "2026-03-01", hours: 3, desc: "Worked on rover SLAM calibration" },
    { date: "2026-02-27", hours: 2, desc: "Sensor debugging and wiring" },
  ],
  Kirthika: [
    { date: "2026-03-02", hours: 4, desc: "AI training dataset cleanup" },
  ],
  Rahul: [
    { date: "2026-02-25", hours: 1, desc: "PCB testing" },
  ],
  Asha: [
    { date: "2026-02-20", hours: 2, desc: "3D printing enclosure" },
  ],
};

/* ================= PAGE ================= */

const AdminAnalytics = () => {
  const navigate = useNavigate();

  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  /* ================= PROFILE VIEW (FIXED) ================= */

  const ProfileView = ({ person }: any) => {
    const sessions = sessionHistory[person.name] || [];

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

  /* ================= EXPANDED VIEW ================= */

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
              {dataset.map((item, i) => (
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

        {/* HEADER */}
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
            <h1 className="text-2xl font-bold">Lab Analytics</h1>
          </div>
        </div>

        {/* ================= CHART GRID ================= */}

        <div className="grid gap-6 md:grid-cols-2">

          {/* ACTIVE STUDENTS */}
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

          {/* REGULARITY */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Student Regularity</CardTitle>
            </CardHeader>

            <CardContent className="h-[300px]">
              <ResponsiveContainer>
                <PieChart
                  onClick={(e:any)=>{
                    if(e?.activePayload){
                      setSelectedEntity(e.activePayload[0].payload);
                      setExpandedChart("regularity");
                    }
                  }}
                >
                  <Pie data={regularity} dataKey="value" outerRadius={100}>
                    {regularity.map((_, i) =>
                      <Cell key={i} fill={COLORS[i]}/>
                    )}
                  </Pie>
                  <Tooltip/>
                  <Legend/>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* DEPARTMENT */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Department Usage</CardTitle>
            </CardHeader>

            <CardContent className="h-[300px]">
              <ResponsiveContainer>
                <BarChart
                  layout="vertical"
                  data={departmentUsage}
                  onClick={(e:any)=>{
                    if(e?.activePayload){
                      setSelectedEntity(e.activePayload[0].payload);
                      setExpandedChart("department");
                    }
                  }}
                >
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