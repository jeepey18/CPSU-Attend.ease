<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    // Admin sees all attendance; teachers see only their own students.
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Attendance::with('student');

        if ($user->role !== 'admin') {
            $query->whereHas('student', function ($studentQuery) use ($user) {
                $studentQuery->where('teacher_id', $user->id);
            });
        }

        if ($request->filled('date')) {
            $query->where('attendance_date', $request->date);
        }

        return response()->json(
            $query->orderByDesc('attendance_date')->get()
        );
    }

    // Create or update attendance for an authorized student.
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'attendance_date' => 'required|date',
            'status' => 'required|in:Present,Absent,Late,Excused',
        ]);

        $this->authorizeStudent($request, $validated['student_id']);

        $attendance = Attendance::updateOrCreate(
            [
                'student_id' => $validated['student_id'],
                'attendance_date' => $validated['attendance_date'],
            ],
            [
                'status' => $validated['status'],
            ]
        );

        return response()->json(
            $attendance->load('student'),
            $attendance->wasRecentlyCreated ? 201 : 200
        );
    }

    // Update attendance only if the student belongs to this teacher.
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:Present,Absent,Late,Excused',
        ]);

        $attendance = $this->attendanceForUser($request, $id);

        $attendance->update([
            'status' => $validated['status'],
        ]);

        return response()->json($attendance->load('student'));
    }

    // Delete only authorized attendance records.
    public function destroy(Request $request, $id)
    {
        $attendance = $this->attendanceForUser($request, $id);

        $attendance->delete();

        return response()->json([
            'message' => 'Attendance record deleted successfully.',
        ]);
    }

    // Save attendance for multiple authorized students.
    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'attendance_date' => 'required|date',
            'records' => 'required|array|min:1',
            'records.*.student_id' => [
                'required',
                'integer',
                'distinct',
                'exists:students,id',
            ],
            'records.*.status' => 'required|in:Present,Absent,Late,Excused',
        ]);

        foreach ($validated['records'] as $record) {
            $this->authorizeStudent($request, $record['student_id']);
        }

        DB::transaction(function () use ($validated) {
            foreach ($validated['records'] as $record) {
                Attendance::updateOrCreate(
                    [
                        'student_id' => $record['student_id'],
                        'attendance_date' => $validated['attendance_date'],
                    ],
                    [
                        'status' => $record['status'],
                    ]
                );
            }
        });

        return response()->json([
            'message' => 'Attendance saved successfully.',
            'count' => count($validated['records']),
        ]);
    }

    // Admin may manage all students; teachers may manage only their own.
    private function authorizeStudent(Request $request, $studentId): void
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            return;
        }

        $belongsToTeacher = Student::where('id', $studentId)
            ->where('teacher_id', $user->id)
            ->exists();

        abort_unless($belongsToTeacher, 403, 'You cannot access this student.');
    }

    private function attendanceForUser(Request $request, $id): Attendance
    {
        $user = $request->user();

        $query = Attendance::query();

        if ($user->role !== 'admin') {
            $query->whereHas('student', function ($studentQuery) use ($user) {
                $studentQuery->where('teacher_id', $user->id);
            });
        }

        return $query->findOrFail($id);
    }
}