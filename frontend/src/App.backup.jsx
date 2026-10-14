
import { useEffect, useState } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  History,
  FileText,
  Menu,
  Search,
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  RefreshCw,
  GraduationCap,
  AlertCircle,
  UserPlus,
  X,
} from "lucide-react";

const API = "http://127.0.0.1:8000/api";

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function studentName(student) {
  if (!student) return "Unknown student";
  return `${student.first_name || ""} ${student.last_name || ""}`.trim()
    || student.name
    || "Unknown student";
}

function StatusBadge({ status }) {
  const styles = {
    Present: "bg-green-100 text-green-700",
    Absent: "bg-red-100 text-red-700",
    Late: "bg-yellow-100 text-yellow-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status || "Not recorded"}
    </span>
  );
}

function AttendanceTable({ records }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px] text-left text-sm">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="p-3">Date</th>
            <th className="p-3">Student Number</th>
            <th className="p-3">Student Name</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {records.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50">
              <td className="p-3">{record.attendance_date || "—"}</td>
              <td className="p-3">{record.student?.student_number || "—"}</td>
              <td className="p-3 font-medium">{studentName(record.student)}</td>
              <td className="p-3"><StatusBadge status={record.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {records.length === 0 && (
        <p className="p-8 text-center text-sm text-gray-500">
          No attendance records found.
        </p>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-800">{value}</h3>
        </div>
        <div className={`rounded-xl p-3 ${color}`}><Icon size={24} /></div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [selectedDate, setSelectedDate] = useState(today());
  const [historyDate, setHistoryDate] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentSaving, setStudentSaving] = useState(false);

  const emptyStudent = {
    student_number: "",
    first_name: "",
    last_name: "",
    course: "BSIT",
    year_level: "1st Year",
  };

  const [studentForm, setStudentForm] = useState(emptyStudent);

  async function loadStudents() {
    const response = await axios.get(`${API}/students`);
    setStudents(response.data);
    return response.data;
  }

  async function loadAttendance(date = "") {
    const response = await axios.get(`${API}/attendance`, {
      params: date ? { date } : {},
    });
    setAttendance(response.data);
    return response.data;
  }

  async function loadDailyAttendance(date = selectedDate) {
    try {
      setLoading(true);
      setError("");

      const [studentResponse, attendanceResponse] = await Promise.all([
        axios.get(`${API}/students`),
        axios.get(`${API}/attendance`, { params: { date } }),
      ]);

      setStudents(studentResponse.data);

      const nextStatuses = {};
      studentResponse.data.forEach((student) => {
        nextStatuses[student.id] = "Present";
      });
      attendanceResponse.data.forEach((record) => {
        nextStatuses[record.student_id] = record.status;
      });

      setStatuses(nextStatuses);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load attendance. Check that Laravel is running.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshData() {
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const [, records] = await Promise.all([
        loadStudents(),
        loadAttendance(),
      ]);
      setAttendance(records);
      await loadDailyAttendance(selectedDate);
      setMessage("Data refreshed successfully.");
    } catch (e) {
      setError(e.response?.data?.message || "Unable to refresh data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function initialize() {
      setLoading(true);
      try {
        const [studentResponse, attendanceResponse, dailyResponse] =
          await Promise.all([
            axios.get(`${API}/students`),
            axios.get(`${API}/attendance`),
            axios.get(`${API}/attendance`, { params: { date: today() } }),
          ]);

        setStudents(studentResponse.data);
        setAttendance(attendanceResponse.data);

        const initialStatuses = {};
        studentResponse.data.forEach((student) => {
          initialStatuses[student.id] = "Present";
        });
        dailyResponse.data.forEach((record) => {
          initialStatuses[record.student_id] = record.status;
        });
        setStatuses(initialStatuses);
      } catch (e) {
        setError(e.response?.data?.message || "Cannot connect to Laravel. Make sure the backend is running.");
      } finally {
        setLoading(false);
      }
    }
    initialize();
  }, []);

  async function addStudent(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    setStudentSaving(true);

    try {
      const payload = {
        student_number: studentForm.student_number.trim(),
        first_name: studentForm.first_name.trim(),
        last_name: studentForm.last_name.trim(),
        course: studentForm.course,
        year_level: studentForm.year_level,
      };

      await axios.post(`${API}/students`, payload);

      await loadStudents();
      setStudentForm(emptyStudent);
      setShowStudentForm(false);
      setMessage("Student added successfully!");
    } catch (e) {
      const errors = e.response?.data?.errors;
      setError(
        errors
          ? Object.values(errors).flat().join(" ")
          : e.response?.data?.message || "Unable to add student. Check your Laravel student API."
      );
    } finally {
      setStudentSaving(false);
    }
  }

  async function saveAttendance() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      for (const student of students) {
        await axios.post(`${API}/attendance`, {
          student_id: student.id,
          attendance_date: selectedDate,
          status: statuses[student.id] || "Present",
        });
      }

      await loadAttendance();
      setMessage("Attendance saved successfully!");
    } catch (e) {
      setError(e.response?.data?.message || JSON.stringify(e.response?.data?.errors || e.message));
    } finally {
      setSaving(false);
    }
  }

  const todayRecords = attendance.filter(
    (record) => record.attendance_date === today()
  );
  const presentCount = todayRecords.filter((r) => r.status === "Present").length;
  const absentCount = todayRecords.filter((r) => r.status === "Absent").length;
  const lateCount = todayRecords.filter((r) => r.status === "Late").length;

  const filteredStudents = students.filter((student) =>
    `${student.student_number || ""} ${studentName(student)}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const historyRecords = attendance.filter((record) => {
    const matchesDate = !historyDate || record.attendance_date === historyDate;
    const searchText = `${record.student?.student_number || ""} ${studentName(record.student)}`.toLowerCase();
    return matchesDate && searchText.includes(search.toLowerCase());
  });

  const navigation = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Students", icon: Users },
    { name: "Attendance", icon: ClipboardCheck },
    { name: "Attendance History", icon: History },
    { name: "Reports", icon: FileText },
  ];

  function changePage(name) {
    setPage(name);
    setSearch("");
    setMessage("");
    setError("");

    if (name === "Attendance") loadDailyAttendance(selectedDate);
    if (name === "Attendance History" || name === "Reports") loadAttendance();
    if (name === "Students") loadStudents();
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <aside className={`fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-slate-900 text-white transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 border-b border-slate-700 px-6 py-6">
          <div className="rounded-xl bg-blue-600 p-2"><GraduationCap size={28} /></div>
          <div>
            <h1 className="text-xl font-bold">AttendEase</h1>
            <p className="text-xs text-slate-400">Attendance Management</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-3 py-6">
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => changePage(name)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${page === name ? "bg-blue-600 font-semibold text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
            >
              <Icon size={19} />{name}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-700 p-5 text-xs text-slate-400">
          AttendEase © 2026
          <p className="mt-1">School Attendance System</p>
        </div>
      </aside>

      <div className={`min-h-screen transition-all ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Toggle sidebar">
              <Menu size={22} />
            </button>
            <div>
              <h2 className="text-lg font-bold">{page}</h2>
              <p className="text-xs text-gray-500">School attendance management</p>
            </div>
          </div>
          <button onClick={refreshData} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
            <RefreshCw size={16} /><span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        <main className="mx-auto max-w-7xl space-y-6 p-5 md:p-8">
          {message && (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle size={18} />{message}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} />{error}
            </div>
          )}
          {loading && <p className="text-sm text-gray-500">Loading records...</p>}

          {page === "Dashboard" && (
            <>
              <div>
                <h2 className="text-2xl font-bold">Welcome to AttendEase</h2>
                <p className="mt-1 text-sm text-gray-500">Here's an overview of your attendance records.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Total Students" value={students.length} icon={Users} color="bg-blue-100 text-blue-600" />
                <StatCard title="Present Today" value={presentCount} icon={CheckCircle} color="bg-green-100 text-green-600" />
                <StatCard title="Absent Today" value={absentCount} icon={XCircle} color="bg-red-100 text-red-600" />
                <StatCard title="Late Today" value={lateCount} icon={Clock} color="bg-yellow-100 text-yellow-700" />
              </div>
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-bold">Recent Attendance</h3>
                  <button onClick={() => changePage("Attendance History")} className="text-sm font-semibold text-blue-600 hover:underline">View all history →</button>
                </div>
                <AttendanceTable records={attendance.slice(0, 5)} />
              </section>
            </>
          )}

          {page === "Students" && (
            <>
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">Student Directory</h3>
                    <p className="text-sm text-gray-500">Manage your registered students.</p>
                  </div>
                  <button
                    onClick={() => { setShowStudentForm(!showStudentForm); setMessage(""); setError(""); }}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    {showStudentForm ? <X size={18} /> : <UserPlus size={18} />}
                    {showStudentForm ? "Close Form" : "Add Student"}
                  </button>
                </div>

                {showStudentForm && (
                  <form onSubmit={addStudent} className="mt-6 rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                    <h4 className="mb-4 font-bold">Register New Student</h4>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <label className="text-sm font-medium">
                        Student Number *
                        <input
                          required
                          value={studentForm.student_number}
                          onChange={(e) => setStudentForm({ ...studentForm, student_number: e.target.value })}
                          placeholder="e.g. 2026-004"
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-3 font-normal outline-none focus:border-blue-500"
                        />
                      </label>
                      <label className="text-sm font-medium">
                        First Name *
                        <input
                          required
                          value={studentForm.first_name}
                          onChange={(e) => setStudentForm({ ...studentForm, first_name: e.target.value })}
                          placeholder="Enter first name"
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-3 font-normal outline-none focus:border-blue-500"
                        />
                      </label>
                      <label className="text-sm font-medium">
                        Last Name *
                        <input
                          required
                          value={studentForm.last_name}
                          onChange={(e) => setStudentForm({ ...studentForm, last_name: e.target.value })}
                          placeholder="Enter last name"
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-3 font-normal outline-none focus:border-blue-500"
                        />
                      </label>
                      <label className="text-sm font-medium">
                        Course *
                        <select
                          required
                          value={studentForm.course}
                          onChange={(e) => setStudentForm({ ...studentForm, course: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-3 font-normal outline-none focus:border-blue-500"
                        >
                          <option value="BSIT">BSIT</option>
                          <option value="BSCS">BSCS</option>
                          <option value="BSIS">BSIS</option>
                          <option value="BSEd">BSEd</option>
                          <option value="BEEd">BEEd</option>
                          <option value="BSBA">BSBA</option>
                        </select>
                      </label>
                      <label className="text-sm font-medium">
                        Year Level *
                        <select
                          required
                          value={studentForm.year_level}
                          onChange={(e) => setStudentForm({ ...studentForm, year_level: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-3 font-normal outline-none focus:border-blue-500"
                        >
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </select>
                      </label>
                    </div>
                    <div className="mt-5 flex justify-end">
                      <button
                        type="submit"
                        disabled={studentSaving}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Save size={18} />{studentSaving ? "Saving..." : "Save Student"}
                      </button>
                    </div>
                  </form>
                )}
              </section>

              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold">All Students</h3>
                    <p className="text-sm text-gray-500">{students.length} registered students</p>
                  </div>
                  <div className="relative">
                    <Search size={17} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search students..."
                      className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="p-3">Student Number</th>
                        <th className="p-3">Full Name</th>
                        <th className="p-3">Course</th>
                        <th className="p-3">Year Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="p-3 font-medium">{student.student_number || "—"}</td>
                          <td className="p-3">{studentName(student)}</td>
                          <td className="p-3">{student.course || "—"}</td>
                          <td className="p-3">{student.year_level || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredStudents.length === 0 && <p className="p-6 text-center text-sm text-gray-500">No students found.</p>}
                </div>
              </section>
            </>
          )}

          {page === "Attendance" && (
            <>
              <section className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold">Mark Attendance</h3>
                  <p className="text-sm text-gray-500">Select a date and mark each student's status.</p>
                </div>
                <label className="text-sm">
                  <span className="mb-1 block text-gray-500">Attendance date</span>
                  <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); loadDailyAttendance(e.target.value); }} className="rounded-lg border border-gray-200 p-2 outline-none focus:border-blue-500" />
                </label>
              </section>
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr><th className="p-3">Student Number</th><th className="p-3">Student Name</th><th className="p-3">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {students.map((student) => (
                        <tr key={student.id}>
                          <td className="p-3">{student.student_number || "—"}</td>
                          <td className="p-3 font-medium">{studentName(student)}</td>
                          <td className="p-3">
                            <select value={statuses[student.id] || "Present"} onChange={(e) => setStatuses({ ...statuses, [student.id]: e.target.value })} className="rounded-lg border border-gray-200 p-2 outline-none focus:border-blue-500">
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>
                              <option value="Late">Late</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {students.length === 0 && <p className="p-6 text-center text-sm text-gray-500">No students registered.</p>}
                </div>
                <div className="mt-5 flex justify-end">
                  <button onClick={saveAttendance} disabled={saving || students.length === 0} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                    <Save size={18} />{saving ? "Saving..." : "Save Attendance"}
                  </button>
                </div>
              </section>
            </>
          )}

          {page === "Attendance History" && (
            <>
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold">Attendance History</h3>
                <p className="mb-5 mt-1 text-sm text-gray-500">Search saved records by date or student.</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-1 block text-gray-500">Filter by date</span>
                    <div className="relative">
                      <CalendarDays size={17} className="absolute left-3 top-3 text-gray-400" />
                      <input type="date" value={historyDate} onChange={(e) => setHistoryDate(e.target.value)} className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 outline-none focus:border-blue-500" />
                    </div>
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-gray-500">Search student</span>
                    <div className="relative">
                      <Search size={17} className="absolute left-3 top-3 text-gray-400" />
                      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or student number" className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 outline-none focus:border-blue-500" />
                    </div>
                  </label>
                </div>
                <button onClick={() => { setHistoryDate(""); setSearch(""); }} className="mt-3 text-sm font-semibold text-blue-600 hover:underline">Clear filters</button>
              </section>
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="font-bold">Saved Records</h3>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">{historyRecords.length} records</span>
                </div>
                <AttendanceTable records={historyRecords} />
              </section>
            </>
          )}

          {page === "Reports" && (
            <>
              <div>
                <h3 className="text-xl font-bold">Attendance Reports</h3>
                <p className="mt-1 text-sm text-gray-500">Summary of all saved attendance records.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Registered Students" value={students.length} icon={Users} color="bg-blue-100 text-blue-600" />
                <StatCard title="Present Records" value={attendance.filter((r) => r.status === "Present").length} icon={CheckCircle} color="bg-green-100 text-green-600" />
                <StatCard title="Absent Records" value={attendance.filter((r) => r.status === "Absent").length} icon={XCircle} color="bg-red-100 text-red-600" />
                <StatCard title="Late Records" value={attendance.filter((r) => r.status === "Late").length} icon={Clock} color="bg-yellow-100 text-yellow-700" />
              </div>
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-bold">All Attendance Records</h3>
                <AttendanceTable records={attendance} />
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}