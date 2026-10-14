
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileBarChart,
  LogOut,
  Menu,
  X,
  Search,
  Plus,
  Pencil,
  Trash2,
  Download,
  Printer,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  GraduationCap,
  BookOpen,
  Activity,
  ChevronRight,
  RefreshCw,
  Filter,
  UserCheck,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import Login from "./Login.jsx";
import Register from "./Register.jsx";

const API_URL = "http://127.0.0.1:8000/api";
const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: "application/json" },
});

function getToken() {
  return localStorage.getItem("attendease_token");
}

function getAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  if (!date) return " — ";
  const parsed = new Date(`${String(date).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return " — ";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(time) {
  if (!time) return " — ";

  const parsed = new Date(`2000-01-01T${time}`);
  return Number.isNaN(parsed.getTime())
    ? time
    : parsed.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
}

function getErrorMessage(error) {
  if (error?.response?.status === 401) {
    return "Your session may have expired. Please sign in again.";
  }

  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    "Something went wrong. Please try again."
  );
}

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.students)) return data.students;
  if (Array.isArray(data?.attendance)) return data.attendance;
  if (Array.isArray(data?.records)) return data.records;
  return [];
}

function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(getToken()));
  const [showRegister, setShowRegister] = useState(false);
  const [activePage, setActivePage] = useState("Dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [attendanceDate, setAttendanceDate] = useState(getToday());
  const [reportStart, setReportStart] = useState(getToday());
  const [reportEnd, setReportEnd] = useState(getToday());
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [studentForm, setStudentForm] = useState({
    student_id: "",
    first_name: "",
    last_name: "",
    email: "",
    course: "",
    year_level: "1st Year",
    section: "",
  });

  const [attendanceForm, setAttendanceForm] = useState({
    student_id: "",
    date: getToday(),
    status: "Present",
    remarks: "",
  });

  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0,
  });

  const clearMessages = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const response = await api.get("/students", {
        headers: getAuthHeaders(),
      });
      setStudents(normalizeList(response.data));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    try {
      const response = await api.get("/attendance", {
        headers: getAuthHeaders(),
      });
      setAttendance(normalizeList(response.data));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get("/user", {
        headers: getAuthHeaders(),
      });
      setUser(response.data?.user || response.data);
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("attendease_token");
        setAuthenticated(false);
        setUser(null);
      } else {
        console.error("Unable to load user profile:", err);
      }
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    clearMessages();

    try {
      await Promise.all([
        fetchStudents(),
        fetchAttendance(),
        fetchUser(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchStudents, fetchAttendance, fetchUser, clearMessages]);

  useEffect(() => {
    if (authenticated) {
      loadData();
    }
  }, [authenticated, loadData]);

  useEffect(() => {
    const today = getToday();

    const todaysRecords = attendance.filter(
      (record) =>
        String(record.date || record.attendance_date || "").slice(0, 10) ===
        today
    );

    const present = todaysRecords.filter(
      (record) => record.status?.toLowerCase() === "present"
    ).length;

    const absent = todaysRecords.filter(
      (record) => record.status?.toLowerCase() === "absent"
    ).length;

    setDashboardStats({
      totalStudents: students.length,
      presentToday: present,
      absentToday: absent,
      attendanceRate:
        todaysRecords.length > 0
          ? Math.round((present / todaysRecords.length) * 100)
          : 0,
    });
  }, [students, attendance]);

  // Accepts either (token, user) or (user, token).
  const handleLogin = (first, second) => {
    const token =
      typeof first === "string"
        ? first
        : typeof second === "string"
          ? second
          : null;

    const userData =
      typeof first === "string" ? second : first;

    if (!token) {
      console.error("Login failed: no valid token was received.");
      setError("Login failed. Please check your login and try again.");
      return;
    }

    localStorage.setItem("attendease_token", token);

    if (userData && typeof userData === "object") {
      setUser(userData);
    }

    setActivePage("Dashboard");
    setError("");
    setSuccess("");
    setAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await api.post("/logout", {}, {
        headers: getAuthHeaders(),
      });
    } catch {
      // Clear the local session even if the API logout request fails.
    }

    localStorage.removeItem("attendease_token");
    setAuthenticated(false);
    setUser(null);
    setStudents([]);
    setAttendance([]);
    setActivePage("Dashboard");
    setError("");
    setSuccess("");
  };

  const resetStudentForm = () => {
    setStudentForm({
      student_id: "",
      first_name: "",
      last_name: "",
      email: "",
      course: "",
      year_level: "1st Year",
    });
    setEditingStudent(null);
    setShowStudentForm(false);
  };

  const openAddStudent = () => {
    clearMessages();
    setEditingStudent(null);
    setStudentForm({
      student_id: "",
      first_name: "",
      last_name: "",
      email: "",
      course: "",
      year_level: "1st Year",
      section: "",
    });
    setShowStudentForm(true);
  };

  const openEditStudent = (student) => {
    clearMessages();
    setEditingStudent(student);
    setStudentForm({
      student_id: student.student_id || student.student_number || "",
      first_name: student.first_name || "",
      last_name: student.last_name || "",
      email: student.email || "",
      course: student.course || student.program || "",
      year_level: student.year_level || "1st Year",
      section: student.section || "",
    });
    setShowStudentForm(true);
  };

  
const saveStudent = async (event) => {
  event.preventDefault();
  clearMessages();

  const studentData = {
    ...studentForm,
    student_number: studentForm.student_id.trim(),
  };

  try {
    if (editingStudent) {
      await api.put(
        `/students/${editingStudent.id}`,
        studentData,
        { headers: getAuthHeaders() }
      );
      setSuccess("Student information updated successfully.");
    } else {
      await api.post(
        "/students",
        studentData,
        { headers: getAuthHeaders() }
      );
      setSuccess("Student added successfully.");
    }

    resetStudentForm();
    await fetchStudents();
  } catch (err) {
    const validationErrors = err?.response?.data?.errors;

    if (validationErrors) {
      setError(
        Object.values(validationErrors).flat().join(" ")
      );
    } else {
      setError(getErrorMessage(err));
    }
  }
};

  const deleteStudent = async (student) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.first_name} ${student.last_name}?`
    );

    if (!confirmed) return;

    clearMessages();

    try {
      await api.delete(`/students/${student.id}`, {
        headers: getAuthHeaders(),
      });
      setSuccess("Student deleted successfully.");
      await fetchStudents();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const saveAttendance = async (event) => {
    event.preventDefault();
    clearMessages();

    try {
      await api.post(
  "/attendance",
  {
    student_id: attendanceForm.student_id,
    attendance_date: attendanceForm.date,
    status: attendanceForm.status,
  },
  {
    headers: getAuthHeaders(),
  }
);

      setSuccess("Attendance recorded successfully.");
      setAttendanceForm({
        student_id: "",
        date: getToday(),
        status: "Present",
        remarks: "",
      });

      await fetchAttendance();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };
  
const saveBulkAttendance = async (date, records) => {
  clearMessages();

  try {
    await api.post(
      "/attendance/bulk",
      {
        attendance_date: date,
        records: records,
      },
      {
        headers: getAuthHeaders(),
      }
    );

    setSuccess("Class attendance saved successfully.");
    await fetchAttendance();
  } catch (err) {
    setError(getErrorMessage(err));
  }
};

  const updateAttendanceStatus = async (record, status) => {
    clearMessages();

    try {
      await api.put(
        `/attendance/${record.id}`,
        { ...record, status },
        { headers: getAuthHeaders() }
      );

      setSuccess("Attendance record updated.");
      await fetchAttendance();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deleteAttendance = async (record) => {
    if (!window.confirm("Delete this attendance record?")) return;

    clearMessages();

    try {
      await api.delete(`/attendance/${record.id}`, {
        headers: getAuthHeaders(),
      });

      setSuccess("Attendance record deleted.");
      await fetchAttendance();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const exportCSV = (rows, filename) => {
    if (!rows.length) {
      setError("There is no data to export.");
      return;
    }

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const value = row[header] ?? "";
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportStudents = () => {
    exportCSV(
      students.map((student) => ({
        Student_ID: student.student_id || student.student_number || "",
        First_Name: student.first_name || "",
        Last_Name: student.last_name || "",
        Email: student.email || "",
        Course: student.course || student.program || "",
        Year_Level: student.year_level || "",
      })),
      "CPSU_AttendEase_Students.csv"
    );
  };

  const reportAttendance = attendance.filter((record) => {
    const date = String(
      record.date || record.attendance_date || ""
    ).slice(0, 10);

    return date >= reportStart && date <= reportEnd;
  });

  const filteredStudents = students.filter((student) => {
    const fullName =
      `${student.first_name || ""} ${student.last_name || ""}`.toLowerCase();

    const term = search.toLowerCase();

    const matchesSearch =
      fullName.includes(term) ||
      String(student.student_id || student.student_number || "")
        .toLowerCase()
        .includes(term) ||
      String(student.course || student.program || "")
        .toLowerCase()
        .includes(term);

    const matchesYear =
      yearFilter === "All" || student.year_level === yearFilter;

    return matchesSearch && matchesYear;
  });

  const todayAttendance = attendance.filter(
    (record) =>
      String(record.date || record.attendance_date || "").slice(0, 10) ===
      attendanceDate
  );

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Students", icon: Users },
    { name: "Attendance", icon: ClipboardCheck },
    { name: "Reports", icon: FileBarChart },
  ];

  const navigate = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    clearMessages();
  };

  if (!authenticated) {
  if (showRegister) {
    return (
      <Register
        onRegister={handleLogin}
        onBackToLogin={() => setShowRegister(false)}
      />
    );
  }

  return (
    <Login
      onLogin={handleLogin}
      onShowRegister={() => setShowRegister(true)}
    />
  );
}

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {mobileMenuOpen && (
        <button
          aria-label="Close navigation menu"
          className="fixed inset-0 z-30 bg-slate-950/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#2E8B45] text-white transition-transform duration-200 md:static md:translate-x-0 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white p-1">
              <img
                src="/cpsu-logo.png"
                alt="CPSU Logo"
                className="h-full w-full object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold tracking-tight text-white">
                CPSU AttendEase
              </h1>
              <p className="text-xs leading-5 text-slate-300">
                Student Records and Attendance
              </p>
            </div>

            <button
              className="ml-auto rounded-lg p-1 text-slate-300 hover:bg-white/10 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-4 pb-2 pt-6">
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Main Menu
            </p>
          </div>

          <nav className="flex-1 space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.name)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-[#F5D547] text-[#2E8B45] shadow-sm"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  <span>{item.name}</span>
                  {active && <ChevronRight size={16} className="ml-auto" />}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/5 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5D547] text-[#2E8B45]">
                <Users size={19} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {user?.name || "Administrator"}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {user?.email || "School Administrator"}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-red-500/15 hover:text-red-300"
            >
              <LogOut size={18} />
              Sign Out
            </button>

            <p className="mt-4 text-center text-xs text-slate-500">
              CPSU AttendEase Â· v1.0
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 md:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu size={22} />
              </button>

              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>CPSU AttendEase</span>
                  <ChevronRight size={13} />
                  <span className="font-medium text-slate-600">
                    {activePage}
                  </span>
                </div>
                <h2 className="mt-1 text-lg font-bold text-[#2E8B45]">
                  {activePage}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-700">
                  {user?.name || "Administrator"}
                </p>
                <p className="text-xs text-slate-400">CPSU AttendEase</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2E8B45] text-sm font-bold text-white">
                {(user?.name || "A").charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle size={19} className="mt-0.5 shrink-0" />
                <p className="flex-1">{error}</p>
                <button
                  onClick={() => setError("")}
                  aria-label="Dismiss error"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            {success && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
                <p className="flex-1">{success}</p>
                <button
                  onClick={() => setSuccess("")}
                  aria-label="Dismiss success message"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            {activePage === "Dashboard" && (
              <DashboardPage
                stats={dashboardStats}
                students={students}
                attendance={attendance}
                loading={loading}
                onRefresh={loadData}
                onNavigate={navigate}
              />
            )}

            {activePage === "Students" && (
              <StudentsPage
                students={filteredStudents}
                search={search}
                setSearch={setSearch}
                yearFilter={yearFilter}
                setYearFilter={setYearFilter}
                onAdd={openAddStudent}
                onEdit={openEditStudent}
                onDelete={deleteStudent}
                onExport={exportStudents}
                onRefresh={fetchStudents}
              />
            )}

            {activePage === "Attendance" && (
              <AttendancePage
                students={students}
                attendance={attendance}
                attendanceForm={attendanceForm}
                setAttendanceForm={setAttendanceForm}
                attendanceDate={attendanceDate}
                setAttendanceDate={setAttendanceDate}
                todayAttendance={todayAttendance}
                onSave={saveAttendance}
                onBulkSave={saveBulkAttendance}
                onUpdateStatus={updateAttendanceStatus}
                onDelete={deleteAttendance}
                onRefresh={fetchAttendance}
              />
            )}

            {activePage === "Reports" && (
              <ReportsPage
                attendance={reportAttendance}
                students={students}
                startDate={reportStart}
                setStartDate={setReportStart}
                endDate={reportEnd}
                setEndDate={setReportEnd}
                onExport={() =>
                  exportCSV(
                    reportAttendance.map((record) => ({
                      Student_ID:
                        record.student?.student_id ||
                        record.student_id ||
                        "",
                      Student_Name:
                        record.student?.first_name &&
                        record.student?.last_name
                          ? `${record.student.first_name} ${record.student.last_name}`
                          : record.student_name || "",
                      Date: record.date || record.attendance_date || "",
                      Status: record.status || "",
                      Remarks: record.remarks || "",
                    })),
                    "CPSU_AttendEase_Attendance_Report.csv"
                  )
                }
              />
            )}

            <footer className="mt-10 border-t border-slate-200 py-5 text-center text-xs text-slate-400">
              Â© {new Date().getFullYear()} CPSU AttendEase Â· Student Records
              and Attendance
            </footer>
          </div>
        </main>
      </div>

      {showStudentForm && (
        <StudentModal
          form={studentForm}
          setForm={setStudentForm}
          editing={Boolean(editingStudent)}
          onClose={resetStudentForm}
          onSubmit={saveStudent}
        />
      )}
    </div>
  );
}

function DashboardPage({
  stats,
  students,
  attendance,
  loading,
  onRefresh,
  onNavigate,
}) {
  const recentAttendance = [...attendance]
    .sort((a, b) => {
      const dateA = new Date(
        `${a.date || a.attendance_date || ""}T${a.time_in || "00:00:00"}`
      );
      const dateB = new Date(
        `${b.date || b.attendance_date || ""}T${b.time_in || "00:00:00"}`
      );
      return dateB - dateA;
    })
    .slice(0, 6);

  const courseCounts = students.reduce((result, student) => {
    const course = student.course || student.program || "Not specified";
    result[course] = (result[course] || 0) + 1;
    return result;
  }, {});

  const yearCounts = students.reduce((result, student) => {
    const year = student.year_level || "Not specified";
    result[year] = (result[year] || 0) + 1;
    return result;
  }, {});

  const yearOrder = [
    "1st Year",
    "2nd Year",
    "3rd Year",
    "4th Year",
    "5th Year",
    "Not specified",
  ];

  const colors = [
    "bg-[#2E8B45]",
    "bg-[#d6a72b]",
    "bg-sky-600",
    "bg-emerald-600",
    "bg-violet-600",
  ];

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2E8B45] via-[#3C9B55] to-[#246F37] p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5" />
        <div className="pointer-events-none absolute -bottom-24 right-32 h-48 w-48 rounded-full bg-[#F5D547]/10" />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
              <Activity size={14} />
              School Attendance Overview
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Welcome to CPSU AttendEase
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
              Manage student records and monitor attendance in one convenient
              place.
            </p>
          </div>

          <button
            onClick={onRefresh}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-[#F5D547] px-4 py-3 text-sm font-bold text-[#2E8B45] transition hover:bg-yellow-300 sm:self-center"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh Data
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Students" value={stats.totalStudents} subtitle="Registered students" icon={Users} iconBg="bg-[#EAF5EC]" iconColor="text-[#2E8B45]" />
        <StatCard title="Present Today" value={stats.presentToday} subtitle="Students marked present" icon={UserCheck} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard title="Absent Today" value={stats.absentToday} subtitle="Students marked absent" icon={XCircle} iconBg="bg-red-50" iconColor="text-red-600" />
        <StatCard title="Attendance Rate" value={`${stats.attendanceRate}%`} subtitle="Based on today's records" icon={TrendingUp} iconBg="bg-amber-50" iconColor="text-amber-600" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800">Students by Course</h3>
              <p className="mt-1 text-xs text-slate-400">Registered students per course</p>
            </div>
            <div className="rounded-xl bg-[#EAF5EC] p-2.5 text-[#2E8B45]">
              <BookOpen size={20} />
            </div>
          </div>

          {Object.keys(courseCounts).length === 0 ? (
            <EmptyState message="No student records available yet." />
          ) : (
            <div className="space-y-5">
              {Object.entries(courseCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([course, count], index) => (
                  <div key={course}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-slate-700">{course}</span>
                      <span className="shrink-0 font-semibold text-slate-600">{count}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${colors[index % colors.length]}`}
                        style={{
                          width: `${Math.max(4, (count / Math.max(...Object.values(courseCounts))) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}

          <button onClick={() => onNavigate("Students")} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#2E8B45] hover:text-[#246F37]">
            View students <ChevronRight size={16} />
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800">Students by Year Level</h3>
              <p className="mt-1 text-xs text-slate-400">Student distribution by year</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <GraduationCap size={20} />
            </div>
          </div>

          {students.length === 0 ? (
            <EmptyState message="No student records available yet." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {yearOrder.filter((year) => yearCounts[year]).map((year, index) => (
                <div key={year} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${colors[index % colors.length]} text-white`}>
                    <GraduationCap size={18} />
                  </div>
                  <p className="text-xs text-slate-500">{year}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">{yearCounts[year]}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
            <Activity size={17} className="shrink-0" />
            <span>Student statistics update when new records are added.</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h3 className="font-bold text-slate-800">Recent Activity</h3>
            <p className="mt-1 text-xs text-slate-400">Latest attendance records saved in CPSU AttendEase</p>
          </div>
          <button onClick={() => onNavigate("Attendance")} className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
            View attendance <ChevronRight size={15} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Student</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Time</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentAttendance.length === 0 ? (
                <EmptyTableRow colSpan={4} message="No attendance records found." />
              ) : recentAttendance.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/70">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF5EC] text-xs font-bold text-[#2E8B45]">
                        {(record.student?.first_name || record.first_name || record.student_name || "S").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">
                          {record.student?.first_name && record.student?.last_name
                            ? `${record.student.first_name} ${record.student.last_name}`
                            : record.student_name || `${record.first_name || ""} ${record.last_name || ""}`.trim() || "Unknown Student"}
                        </p>
                        <p className="text-xs text-slate-400">{record.student?.student_id || record.student_id || " — "}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{formatDate(record.date || record.attendance_date)}</td>
                  <td className="px-6 py-4 text-slate-500">{formatTime(record.time_in || record.time)}</td>
                  <td className="px-6 py-4"><StatusBadge status={record.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StudentsPage({
  students,
  search,
  setSearch,
  yearFilter,
  setYearFilter,
  onAdd,
  onEdit,
  onDelete,
  onExport,
  onRefresh,
}) {
  return (
    <div className="space-y-6">
      <PageHeading title="Student Records" description="Manage student information and enrollment records." icon={Users} />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total Students" value={students.length} subtitle="Matching current filters" icon={Users} iconBg="bg-[#EAF5EC]" iconColor="text-[#2E8B45]" />
        <StatCard title="First Year" value={students.filter((s) => s.year_level === "1st Year").length} subtitle="First-year students" icon={GraduationCap} iconBg="bg-amber-50" iconColor="text-amber-600" />
        <StatCard title="Courses" value={new Set(students.map((s) => s.course || s.program).filter(Boolean)).size} subtitle="Courses represented" icon={BookOpen} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-bold text-slate-800">All Students</h3>
            <p className="mt-1 text-xs text-slate-400">Search, edit, and manage student records</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#2E8B45] focus:ring-2 focus:ring-[#D6EBDD] sm:w-56" />
            </div>

            <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2E8B45]">
              <option value="All">All Year Levels</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="5th Year">5th Year</option>
            </select>

            <button onClick={onRefresh} title="Refresh students" className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"><RefreshCw size={17} /></button>
            <button onClick={onExport} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Download size={16} /> Export</button>
            <button onClick={onAdd} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E8B45] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#246F37]"><Plus size={17} /> Add Student</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-4 font-semibold">Student</th>
                <th className="px-5 py-4 font-semibold">Student ID</th>
                <th className="px-5 py-4 font-semibold">Course</th>
                <th className="px-5 py-4 font-semibold">Year Level</th>
                <th className="px-5 py-4 font-semibold">Section</th>
                <th className="px-5 py-4 font-semibold">Email</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <EmptyTableRow colSpan={6} message="No students found. Add a student to get started." />
              ) : students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF5EC] text-sm font-bold text-[#2E8B45]">
                        {(student.first_name || "S").charAt(0).toUpperCase()}{(student.last_name || "").charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-700">{student.first_name} {student.last_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-600">{student.student_id || student.student_number || " — "}</td>
                  <td className="px-5 py-4 text-slate-600">{student.course || student.program || " — "}</td>
                  <td className="px-5 py-4"><span className="rounded-lg bg-[#EAF5EC] px-2.5 py-1.5 text-xs font-semibold text-[#2E8B45]">{student.year_level || " — "}</span></td>
                  <td className="px-5 py-4 text-slate-600">{student.section ? `Section ${student.section}` : " — "}</td>
                  <td className="px-5 py-4 text-slate-500">{student.email || " — "}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onEdit(student)} title="Edit student" className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-[#B7DCC0] hover:bg-[#EAF5EC] hover:text-[#2E8B45]"><Pencil size={15} /></button>
                      <button onClick={() => onDelete(student)} title="Delete student" className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-400">Showing {students.length} student record(s)</div>
      </section>
    </div>
  );
}

function StudentModal({ form, setForm, editing, onClose, onSubmit }) {
  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
      <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{editing ? "Edit Student" : "Add New Student"}</h3>
            <p className="mt-1 text-xs text-slate-400">Enter the student's information below.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close form"><X size={20} /></button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Student ID" required>
              <input required value={form.student_id} onChange={(event) => updateField("student_id", event.target.value)} placeholder="Enter student ID" className={inputClass} />
            </FormField>
            <FormField label="Email Address">
              <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="student@example.com" className={inputClass} />
            </FormField>
            <FormField label="First Name" required>
              <input required value={form.first_name} onChange={(event) => updateField("first_name", event.target.value)} placeholder="Enter first name" className={inputClass} />
            </FormField>
            <FormField label="Last Name" required>
              <input required value={form.last_name} onChange={(event) => updateField("last_name", event.target.value)} placeholder="Enter last name" className={inputClass} />
            </FormField>
            <FormField label="Course / Program" required>
              <input required value={form.course} onChange={(event) => updateField("course", event.target.value)} placeholder="e.g. BSIT" className={inputClass} />
            </FormField>
            <FormField label="Year Level" required>
              <select required value={form.year_level} onChange={(event) => updateField("year_level", event.target.value)} className={inputClass}>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="5th Year">5th Year</option>
              </select>
            </FormField>
            <FormField label="Section" required>
  <select
    required
    value={form.section || ""}
    onChange={(event) => updateField("section", event.target.value)}
    className={inputClass}
  >
    <option value="">Select Section</option>
    <option value="A">Section A</option>
    <option value="B">Section B</option>
    <option value="C">Section C</option>
    <option value="D">Section D</option>
    <option value="E">Section E</option>
    <option value="F">Section F</option>

  </select>
</FormField>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E8B45] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#246F37]"><CheckCircle2 size={17} />{editing ? "Save Changes" : "Add Student"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AttendancePage({
  students,
  attendance,
  attendanceForm,
  setAttendanceForm,
  attendanceDate,
  setAttendanceDate,
  todayAttendance,
  onSave,
    onBulkSave,
  onUpdateStatus,
  onDelete,
  onRefresh,
}) {
    const [bulkDate, setBulkDate] = useState(getToday());
  const [bulkStatuses, setBulkStatuses] = useState({});
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkCourse, setBulkCourse] = useState("All");
const [bulkYear, setBulkYear] = useState("All");
const [bulkSection, setBulkSection] = useState("All");
  const updateField = (field, value) => {
    setAttendanceForm((current) => ({ ...current, [field]: value }));
  };

  const findStudentName = (record) => {
    if (record.student?.first_name || record.student?.last_name) {
      return `${record.student.first_name || ""} ${record.student.last_name || ""}`.trim();
    }

    if (record.student_name) return record.student_name;

    const student = students.find(
      (item) => String(item.id) === String(record.student_id)
    );

    if (student) return `${student.first_name} ${student.last_name}`.trim();

    return `${record.first_name || ""} ${record.last_name || ""}`.trim() || "Unknown Student";
  };

  return (
    <div className="space-y-6">
      <PageHeading title="Attendance Management" description="Record, review, and update student attendance." icon={ClipboardCheck} />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Records Today" value={todayAttendance.length} subtitle={formatDate(attendanceDate)} icon={CalendarDays} iconBg="bg-[#EAF5EC]" iconColor="text-[#2E8B45]" />
        <StatCard title="Present" value={todayAttendance.filter((record) => record.status?.toLowerCase() === "present").length} subtitle="Marked present" icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard title="Absent" value={todayAttendance.filter((record) => record.status?.toLowerCase() === "absent").length} subtitle="Marked absent" icon={XCircle} iconBg="bg-red-50" iconColor="text-red-600" />
            </section>

      {/* Bulk Attendance */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h3 className="font-bold text-slate-800">Bulk Attendance</h3>
          <p className="mt-1 text-xs text-slate-400">
            Mark attendance for multiple students on the same date.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Attendance Date
            </label>
            <input
              type="date"
              value={bulkDate}
              onChange={(event) => setBulkDate(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Course
            </label>
            <select
  id="bulk-course"
  className={inputClass}
  value={bulkCourse}
  onChange={(event) => setBulkCourse(event.target.value)}
>
              <option value="All">All Courses</option>
<option value="BEEd">BEEd</option>
<option value="BSED">BSED</option>
<option value="BS Agribusiness">BS Agribusiness</option>
<option value="BSHM">BSHM</option>
<option value="BSCrim">BSCrim</option>
              {[...new Set(students.map((student) => student.course).filter(Boolean))].map((course) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Year Level
            </label>
            <select
  id="bulk-year"
  className={inputClass}
  value={bulkYear}
  onChange={(event) => setBulkYear(event.target.value)}
>
              
<option value="All">All Year Levels</option>
<option value="1st Year">1st Year</option>
<option value="2nd Year">2nd Year</option>
<option value="3rd Year">3rd Year</option>
<option value="4th Year">4th Year</option>
            </select>
          </div>
          
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Section
            </label>
            <select
              id="bulk-section"
              className={inputClass}
              value={bulkSection}
              onChange={(event) => setBulkSection(event.target.value)}
            >
              <option value="All">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
              <option value="E">Section E</option>
              <option value="F">Section F</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-4 font-semibold">Student</th>
                <th className="px-5 py-4 font-semibold">Course / Year</th>
                <th className="px-5 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <EmptyTableRow colSpan={3} message="No students available." />
              ) : students
  
.filter((student) => bulkCourse === "All" || student.course === bulkCourse)
.filter((student) => bulkYear === "All" || student.year_level === bulkYear)
.filter((student) => bulkSection === "All" || student.section === bulkSection)
.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-medium text-slate-700">
                    {student.student_number || student.id} — {student.first_name} {student.last_name}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {student.course || "—"} / {student.year_level || "—"}
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={bulkStatuses[student.id] || "Present"}
                      onChange={(event) => setBulkStatuses((previous) => ({
                        ...previous,
                        [student.id]: event.target.value,
                      }))}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2E8B45]"
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                      <option value="Excused">Excused</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            
Students: {students.filter((student) => bulkCourse === "All" || student.course === bulkCourse).filter((student) => bulkYear === "All" || student.year_level === bulkYear).filter((student) => bulkSection === "All" || student.section === bulkSection).length}
          </p>
          <button
           
  type="button"
  onClick={async () => {
    
const filteredStudents = students
  .filter((student) => bulkCourse === "All" || student.course === bulkCourse)
  .filter((student) => bulkYear === "All" || student.year_level === bulkYear)
  .filter((student) => bulkSection === "All" || student.section === bulkSection);

    if (filteredStudents.length === 0) return;

    setBulkSaving(true);
    try {
      await onBulkSave(
        bulkDate,
        filteredStudents.map((student) => ({
          student_id: student.id,
          status: bulkStatuses[student.id] || "Present",
        }))
      );
    } finally {
      setBulkSaving(false);
    }
  }}
  disabled={bulkSaving || students.length === 0}
  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E8B45] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#246F37] disabled:cursor-not-allowed disabled:opacity-50"
>
            Save Class Attendance
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[360px_1fr]"> 
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-[#EAF5EC] p-2.5 text-[#2E8B45]"><ClipboardCheck size={21} /></div>
            <div>
              <h3 className="font-bold text-slate-800">Record Attendance</h3>
              <p className="mt-1 text-xs text-slate-400">Add a new attendance entry</p>
            </div>
          </div>

          <form onSubmit={onSave} className="space-y-4">
            <FormField label="Student" required>
              <select required value={attendanceForm.student_id} onChange={(event) => updateField("student_id", event.target.value)} className={inputClass}>
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>{student.student_id || student.student_number || student.id}  —  {student.first_name} {student.last_name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Attendance Date" required>
              <input type="date" required value={attendanceForm.date} onChange={(event) => updateField("date", event.target.value)} className={inputClass} />
            </FormField>
            <FormField label="Status" required>
              <select required value={attendanceForm.status} onChange={(event) => updateField("status", event.target.value)} className={inputClass}>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Excused">Excused</option>
              </select>
            </FormField>
            <FormField label="Remarks">
              <textarea rows={3} value={attendanceForm.remarks} onChange={(event) => updateField("remarks", event.target.value)} placeholder="Optional remarks..." className={inputClass} />
            </FormField>
            <button type="submit" disabled={students.length === 0} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E8B45] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#246F37] disabled:cursor-not-allowed disabled:opacity-50"><Plus size={17} /> Save Attendance</button>
            {students.length === 0 && <p className="text-xs text-amber-700">Add a student record before recording attendance.</p>}
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Attendance History</h3>
              <p className="mt-1 text-xs text-slate-400">Review and update attendance records</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="date" value={attendanceDate} onChange={(event) => setAttendanceDate(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2E8B45]" />
              <button onClick={onRefresh} title="Refresh attendance" className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"><RefreshCw size={17} /></button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-semibold">Student</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Remarks</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayAttendance.length === 0 ? (
                  <EmptyTableRow colSpan={5} message="No attendance records for this date." />
                ) : todayAttendance.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-semibold text-slate-700">{findStudentName(record)}</td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(record.date || record.attendance_date)}</td>
                    <td className="px-5 py-4"><StatusBadge status={record.status} /></td>
                    <td className="max-w-[180px] truncate px-5 py-4 text-slate-500">{record.remarks || " — "}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <select value={record.status || "Present"} onChange={(event) => onUpdateStatus(record, event.target.value)} aria-label="Update attendance status" className="max-w-[120px] rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[#2E8B45]">
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Late">Late</option>
                          <option value="Excused">Excused</option>
                        </select>
                        <button onClick={() => onDelete(record)} title="Delete attendance" className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-400">Showing {todayAttendance.length} record(s) for {formatDate(attendanceDate)}</div>
        </div>
      </section>
    </div>
  );
}

function ReportsPage({
  attendance,
  students,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onExport,
}) {
  const present = attendance.filter((record) => record.status?.toLowerCase() === "present").length;
  const absent = attendance.filter((record) => record.status?.toLowerCase() === "absent").length;
  const late = attendance.filter((record) => record.status?.toLowerCase() === "late").length;
  const excused = attendance.filter((record) => record.status?.toLowerCase() === "excused").length;

  return (
    <div className="space-y-6">
      <PageHeading title="Attendance Reports" description="Review attendance statistics and export records." icon={FileBarChart} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-[#EAF5EC] p-2.5 text-[#2E8B45]"><Filter size={20} /></div>
          <div>
            <h3 className="font-bold text-slate-800">Report Filters</h3>
            <p className="mt-1 text-xs text-slate-400">Choose the date range for your report</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <FormField label="Start Date">
            <input type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} className={inputClass} />
          </FormField>
          <FormField label="End Date">
            <input type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} className={inputClass} />
          </FormField>
          <button onClick={onExport} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E8B45] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#246F37]"><Download size={17} /> Export CSV</button>
          <button onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"><Printer size={17} /> Print</button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Records" value={attendance.length} subtitle="Selected date range" icon={ClipboardCheck} iconBg="bg-[#EAF5EC]" iconColor="text-[#2E8B45]" />
        <StatCard title="Present" value={present} subtitle="Present records" icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard title="Absent" value={absent} subtitle="Absent records" icon={XCircle} iconBg="bg-red-50" iconColor="text-red-600" />
        <StatCard title="Late / Excused" value={late + excused} subtitle={`${late} late Â· ${excused} excused`} icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-slate-800">Attendance Report</h3>
            <p className="mt-1 text-xs text-slate-400">{formatDate(startDate)} â€“ {formatDate(endDate)}</p>
          </div>
          <span className="rounded-lg bg-[#EAF5EC] px-3 py-2 text-xs font-semibold text-[#2E8B45]">{attendance.length} record(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-4 font-semibold">Student</th>
                <th className="px-5 py-4 font-semibold">Student ID</th>
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendance.length === 0 ? (
                <EmptyTableRow colSpan={5} message="No attendance records for this date range." />
              ) : attendance.map((record) => {
                const student = record.student || students.find((item) => String(item.id) === String(record.student_id));
                const studentName = student
                  ? `${student.first_name || ""} ${student.last_name || ""}`.trim()
                  : record.student_name || `${record.first_name || ""} ${record.last_name || ""}`.trim() || "Unknown Student";

                return (
                  <tr key={record.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-semibold text-slate-700">{studentName}</td>
                    <td className="px-5 py-4 text-slate-500">{student?.student_id || student?.student_number || record.student_id || " — "}</td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(record.date || record.attendance_date)}</td>
                    <td className="px-5 py-4"><StatusBadge status={record.status} /></td>
                    <td className="px-5 py-4 text-slate-500">{record.remarks || " — "}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
        <div className="flex items-start gap-3">
          <Users size={20} className="mt-0.5 shrink-0 text-[#2E8B45]" />
          <p>The system currently has <span className="font-bold text-slate-700">{students.length}</span> student record(s). Reports include attendance entries within the selected date range.</p>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2E8B45] focus:ring-2 focus:ring-[#D6EBDD]";

function PageHeading({ title, description, icon: Icon }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2E8B45] text-white shadow-sm"><Icon size={23} /></div>
      <div>
        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = "bg-[#EAF5EC]",
  iconColor = "text-[#2E8B45]",
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-800">{value}</p>
          <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
        </div>
        <div className={`rounded-xl p-3 ${iconBg} ${iconColor}`}><Icon size={22} /></div>
      </div>
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-semibold text-slate-700">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function EmptyTableRow({ colSpan, message }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-14 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><ClipboardCheck size={23} /></div>
          <p className="text-sm font-medium text-slate-500">{message}</p>
        </div>
      </td>
    </tr>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
      <Activity size={22} className="mb-2 text-slate-300" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = (status || "").toLowerCase();

  let style = "bg-slate-100 text-slate-600";
  let Icon = Clock;

  if (normalized === "present") {
    style = "bg-emerald-50 text-emerald-700";
    Icon = CheckCircle2;
  } else if (normalized === "absent") {
    style = "bg-red-50 text-red-700";
    Icon = XCircle;
  } else if (normalized === "late") {
    style = "bg-amber-50 text-amber-700";
    Icon = Clock;
  } else if (normalized === "excused") {
    style = "bg-[#EAF5EC] text-blue-700";
    Icon = CheckCircle2;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold capitalize ${style}`}>
      <Icon size={13} />
      {status || "Unknown"}
    </span>
  );
}

export default App;
