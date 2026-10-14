
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->foreignId('student_id')
                ->constrained('students')
                ->cascadeOnDelete();

            $table->date('attendance_date');

            $table->enum('status', ['Present', 'Absent', 'Late']);

            $table->unique(['student_id', 'attendance_date']);
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropUnique(['student_id', 'attendance_date']);
            $table->dropForeign(['student_id']);
            $table->dropColumn([
                'student_id',
                'attendance_date',
                'status',
            ]);
        });
    }
};