import { useState, useEffect } from "react";
import axios from "axios";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  Search,
  Bell,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [attendance, setAttendance] = useState([
  "Present",
  "Late",
  "Present",
  "Absent",
]);
const [savedMessage, setSavedMessage] = useState("");
  const students = [
    { id: "2026-001", name: "Andrea Santos", section: "BSIT 1-A", status: "Present" },
    { id: "2026-002", name: "Mark Reyes", section: "BSIT 1-A", status: "Late" },
    { id: "2026-003", name: "Sofia Garcia", section: "BSIT 1-B", status: "Present" },
    { id: "2026-004", name: "Daniel Cruz", section: "BSIT 1-A", status: "Absent" },
  ];

  const menu = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Students", icon: Users },
    { name: "Attendance", icon: ClipboardCheck },
    { name: "Reports", icon: FileText },
  ];

  const stats = [
    { title: "Total Students", value: "120", icon: Users, color: "blue" },
    { title: "Present Today", value: "98", icon: CheckCircle, color: "green" },
    { title: "Absent Today", value: "12", icon: XCircle, color: "red" },
    { title: "Late Today", value: "10", icon: Clock, color: "orange" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-slate-950 text-white md:flex">
        <div className="border-b border-slate-800 px-6 py-7">
          <h1 className="text-2xl font-bold">
            <span className="text-blue-400">Attend</span>Ease
          </h1>
          <p className="mt-1 text-sm text-slate-400">Student Attendance System</p>
        </div>

        <nav className="space-y-2 p-4">
          {menu.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => setPage(name)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${
                page === name
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              <Icon size={19} />
              {name}
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-800 p-5 text-sm text-slate-400">
          School Year 2026–2027
        </div>
      </aside>

      <main className="md:ml-64">
        <header className="flex items-center justify-between border-b bg-white px-5 py-5 md:px-9">
          <div>
            <p className="text-sm text-slate-500">Attendance Portal / {page}</p>
            <h2 className="mt-1 text-xl font-bold">{page}</h2>
          </div>
          <button className="rounded-xl border p-3 hover:bg-slate-50">
            <Bell size={20} />
          </button>
        </header>

        <div className="p-5 md:p-9">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">Welcome back, Admin!</h2>
            <p className="mt-2 text-slate-500">
              Here's your student attendance overview for today.
            </p>
          </div>

          <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ title, value, icon: Icon, color }) => (
              <div key={title} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{title}</p>
                  <Icon className={`text-${color}-600`} size={23} />
                </div>
                <p className="mt-4 text-3xl font-bold">{value}</p>
                <p className="mt-2 text-xs text-slate-400">Sample dashboard data</p>
              </div>
            ))}
          </div>

          <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold">Recent Attendance</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Student attendance records
                </p>
                <button
  onClick={() => {
    setSavedMessage("Attendance saved successfully!");
    setTimeout(() => setSavedMessage(""), 3000);
  }}
  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
>
  Save Attendance
</button>

{savedMessage && (
  <p className="mt-3 text-sm text-green-600">
    {savedMessage}
  </p>
)}
              </div>
              <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
                <Search size={18} className="text-slate-400" />
                <span className="text-sm text-slate-400">Student records</span>
              </div>
            </div>

            {page === "Students" || page === "Attendance" || page === "Dashboard" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Student ID</th>
                      <th className="px-5 py-4">Student Name</th>
                      <th className="px-5 py-4">Section</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-medium">{student.id}</td>
                        <td className="px-5 py-4">{student.name}</td>
                        <td className="px-5 py-4">{student.section}</td>
                        <td className="px-5 py-4">
                           <select
  value={attendance[students.indexOf(student)]}
  onChange={(e) => {
    const updated = [...attendance];
    updated[students.indexOf(student)] = e.target.value;
    setAttendance(updated);
  }}
  className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
    attendance[students.indexOf(student)] === "Present"
      ? "border-green-200 bg-green-50 text-green-700"
      : attendance[students.indexOf(student)] === "Absent"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-orange-200 bg-orange-50 text-orange-700"
  }`}
>
  <option value="Present">Present</option>
  <option value="Absent">Absent</option>
  <option value="Late">Late</option>
</select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center">
                <FileText className="mx-auto mb-3 text-blue-500" size={36} />
                <h3 className="font-bold">Attendance Reports</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Report generation will be added in the next step.
                </p>
              </div>
            )}
          </section>

          <p className="mt-6 text-center text-xs text-slate-400">
            AttendEase © 2026 · Student Attendance Monitoring System
          </p>
        </div>
      </main>
    </div>
  );
}