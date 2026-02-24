// localStorage-based data store for the College Lab Record Maintainer

export interface Student {
  id: string;
  labId: string;
  name: string;
  usn: string;
  year: string;
  department: string;
  password: string;
}

export interface Session {
  id: string;
  studentId: string;
  checkInTime: string;
  checkOutTime: string | null;
  description: string;
}

export interface Admin {
  username: string;
  password: string;
}

const STUDENTS_KEY = "lab_students";
const SESSIONS_KEY = "lab_sessions";
const ADMIN_KEY = "lab_admin";
const COUNTER_KEY = "lab_counter";
const STUDENT_AUTH_KEY = "lab_student_auth";
const ADMIN_AUTH_KEY = "lab_admin_auth";

// 7 days in ms
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

interface AuthToken {
  value: string;
  expiry: number;
}

export function setStudentAuth(studentJson: string) {
  const token: AuthToken = { value: studentJson, expiry: Date.now() + SESSION_TTL };
  localStorage.setItem(STUDENT_AUTH_KEY, JSON.stringify(token));
}

export function getStudentAuth(): string | null {
  try {
    const raw = localStorage.getItem(STUDENT_AUTH_KEY);
    if (!raw) return null;
    const token: AuthToken = JSON.parse(raw);
    if (Date.now() > token.expiry) { localStorage.removeItem(STUDENT_AUTH_KEY); return null; }
    return token.value;
  } catch { return null; }
}

export function clearStudentAuth() {
  localStorage.removeItem(STUDENT_AUTH_KEY);
}

export function setAdminAuth() {
  const token: AuthToken = { value: "true", expiry: Date.now() + SESSION_TTL };
  localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(token));
}

export function getAdminAuth(): boolean {
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_KEY);
    if (!raw) return false;
    const token: AuthToken = JSON.parse(raw);
    if (Date.now() > token.expiry) { localStorage.removeItem(ADMIN_AUTH_KEY); return false; }
    return true;
  } catch { return false; }
}

export function clearAdminAuth() {
  localStorage.removeItem(ADMIN_AUTH_KEY);
}

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Students ---

export function getStudents(): Student[] {
  return get<Student[]>(STUDENTS_KEY, []);
}

export function registerStudent(data: Omit<Student, "id" | "labId">): Student {
  const students = getStudents();
  const counter = get<number>(COUNTER_KEY, 0) + 1;
  set(COUNTER_KEY, counter);
  const student: Student = {
    id: crypto.randomUUID(),
    labId: `LAB-${String(counter).padStart(4, "0")}`,
    ...data,
  };
  students.push(student);
  set(STUDENTS_KEY, students);
  return student;
}

export function loginStudent(labId: string, password: string): Student | null {
  const students = getStudents();
  return students.find((s) => s.labId === labId && s.password === password) ?? null;
}

// --- Admin ---

export function getAdmin(): Admin | null {
  return get<Admin | null>(ADMIN_KEY, null);
}

export function registerAdmin(username: string, password: string): Admin {
  const admin: Admin = { username, password };
  set(ADMIN_KEY, admin);
  return admin;
}

export function loginAdmin(username: string, password: string): boolean {
  const admin = getAdmin();
  return admin !== null && admin.username === username && admin.password === password;
}

// --- Sessions ---

export function getSessions(): Session[] {
  return get<Session[]>(SESSIONS_KEY, []);
}

export function getStudentSessions(studentId: string): Session[] {
  return getSessions().filter((s) => s.studentId === studentId);
}

export function getActiveSession(studentId: string): Session | null {
  return getSessions().find((s) => s.studentId === studentId && !s.checkOutTime) ?? null;
}

export function checkIn(studentId: string): Session {
  const sessions = getSessions();
  const session: Session = {
    id: crypto.randomUUID(),
    studentId,
    checkInTime: new Date().toISOString(),
    checkOutTime: null,
    description: "",
  };
  sessions.push(session);
  set(SESSIONS_KEY, sessions);
  return session;
}

export function checkOut(sessionId: string, description: string): Session | null {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx === -1) return null;
  sessions[idx].checkOutTime = new Date().toISOString();
  sessions[idx].description = description;
  set(SESSIONS_KEY, sessions);
  return sessions[idx];
}
