<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Api\StudentController;

class StudentController extends Controller
{
    // Admin sees all students; teachers see only their own.
    public function index(Request $request)
    {
        $query = Student::query();

        if ($request->user()->role !== 'admin') {
            $query->where('teacher_id', $request->user()->id);
        }

        return response()->json(
            $query->orderBy('last_name')->get()
        );
    }

    // Create a student under the logged-in teacher.
    public function store(Request $request)
    {
        $request->merge([
            'student_number' => $request->input('student_number')
                ?: $request->input('student_id'),
        ]);

        $validated = $request->validate([
            'student_number' => 'required|string|max:255|unique:students,student_number',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'course' => 'sometimes|nullable|string|max:255',
            'year_level' => 'sometimes|nullable|string|max:255',
            'section' => 'sometimes|nullable|string|in:A,B,C,D,E,F',
        ]);

        $student = new Student();
        $student->teacher_id = $request->user()->id;
        $student->student_number = $validated['student_number'];
        $student->first_name = $validated['first_name'];
        $student->last_name = $validated['last_name'];
        $student->course = $validated['course'] ?? null;
        $student->year_level = $validated['year_level'] ?? null;
        $student->section = $validated['section'] ?? null;
        $student->save();

        return response()->json($student, 201);
    }

    // Update only a student the logged-in user is allowed to manage.
    public function update(Request $request, $studentId)
    {
        $query = Student::query();

        if ($request->user()->role !== 'admin') {
            $query->where('teacher_id', $request->user()->id);
        }

        $student = $query->findOrFail($studentId);

        $request->merge([
            'student_number' => $request->input('student_number')
                ?: $request->input('student_id'),
        ]);

        $validated = $request->validate([
            'student_number' => [
                'required',
                'string',
                'max:255',
                Rule::unique('students', 'student_number')
                    ->ignore($student->id),
            ],
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'course' => 'sometimes|nullable|string|max:255',
            'year_level' => 'sometimes|nullable|string|max:255',
            'section' => 'sometimes|nullable|string|in:A,B,C,D,E,F',
        ]);

        $student->student_number = $validated['student_number'];
        $student->first_name = $validated['first_name'];
        $student->last_name = $validated['last_name'];
        $student->course = $validated['course'] ?? $student->course;
        $student->year_level = $validated['year_level'] ?? $student->year_level;
        $student->section = $validated['section'] ?? $student->section;
        $student->save();

        return response()->json([
            'message' => 'Student updated successfully.',
            'student' => $student,
        ]);
    }
    
    // Delete a student only if the logged-in user has permission.
    public function destroy(Request $request, $studentId)
    {
        $query = Student::query();

        // Admin can delete any student.
        // Teachers can delete only their own students.
        if ($request->user()->role !== 'admin') {
            $query->where('teacher_id', $request->user()->id);
        }

        $student = $query->findOrFail($studentId);

        $student->delete();

        return response()->json([
            'message' => 'Student deleted successfully.',
        ]);
    }
}