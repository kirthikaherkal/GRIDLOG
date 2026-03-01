import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import KlsGridLogo from "@/components/KlsGridLogo";

/* ================= MOCK DATA ================= */

const studentActivity = [
  { name: "Omkar", sessions: 12 },
  { name: "Kirthika", sessions: 9 },
  { name: "Rahul", sessions: 6 },
  { name: "Asha", sessions: 4 },
];

const labUsage = [
  { day: "Mon", visits: 12 },
  { day: "Tue", visits: 18 },
  { day: "Wed", visits: 9 },
  { day: "Thu", visits: 22 },
  { day: "Fri", visits: 15 },
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

/* ================= PAGE ================= */

const AdminAnalytics = () => {
  const navigate = useNavigate();

  // ✅ NEW STATES
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  /* ================= PROFILE VIEW ================= */

  const ProfileView = ({ person }: any) => (
    <Card className="mt-4 border-2">
      <CardHeader>
        <CardTitle>{person.name} — Individual Analytics</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-6 md:grid-cols-2">

        {/* Sessions trend */}
        <div className="h-[250px]">
          <ResponsiveContainer>
            <LineChart data={labUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line dataKey="visits" stroke="#6366f1" strokeWidth={3}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Regularity pie */}
        <div className="h-[250px]">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={regularity} dataKey="value" outerRadius={90}>
                {regularity.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </CardContent>
    </Card>
  );

  /* ================= EXPANDED VIEW ================= */

  const ExpandedOverlay = () => {
    if (!expandedChart) return null;

    let dataset: any[] = [];

    if (expandedChart === "students") dataset = studentActivity;
    if (expandedChart === "department") dataset = departmentUsage;
    if (expandedChart === "regularity") dataset = regularity;

    return (
      <div className="fixed inset-0 z-50 bg-background/95 p-6 overflow-auto">
        <div className="mx-auto max-w-6xl space-y-6">

          <Button variant="outline" onClick={()=>{
            setExpandedChart(null);
            setSelectedEntity(null);
          }}>
            Close
          </Button>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Detailed View</CardTitle>
            </CardHeader>

            {/* ✅ scrollable large dataset container */}
            <CardContent className="max-h-[400px] overflow-y-auto space-y-2">
              {dataset.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <span className="font-medium">
                    {item.name || item.dept}
                  </span>

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

          {/* Individual analytics */}
          {selectedEntity && <ProfileView person={selectedEntity}/>}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
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
        </div>

        {/* ================= CHART GRID ================= */}

        <div className="grid gap-6 md:grid-cols-2">

          {/* ACTIVE STUDENTS */}
          <Card className="border-2 cursor-pointer"
            onClick={()=>setExpandedChart("students")}
          >
            <CardHeader>
              <CardTitle>Most Active Students</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer>
                <BarChart
                  data={studentActivity}
                  onClick={(e:any)=>{
                    if(e?.activePayload)
                      setSelectedEntity(e.activePayload[0].payload);
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name"/>
                  <YAxis/>
                  <Tooltip/>
                  <Bar dataKey="sessions" fill="#6366f1" radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* WEEKLY USAGE */}
          <Card className="border-2 cursor-pointer"
            onClick={()=>setExpandedChart("usage")}
          >
            <CardHeader>
              <CardTitle>Weekly Lab Usage</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer>
                <LineChart data={labUsage}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="day"/>
                  <YAxis/>
                  <Tooltip/>
                  <Line dataKey="visits" stroke="#22c55e" strokeWidth={3}/>
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* REGULARITY */}
          <Card className="border-2 cursor-pointer"
            onClick={()=>setExpandedChart("regularity")}
          >
            <CardHeader>
              <CardTitle>Student Regularity</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer>
                <PieChart>
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
          <Card className="border-2 cursor-pointer"
            onClick={()=>setExpandedChart("department")}
          >
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
                  <Bar dataKey="sessions" fill="#f97316" radius={[0,6,6,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ✅ Overlay system */}
      <ExpandedOverlay />
    </main>
  );
};

export default AdminAnalytics;