<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            $table->index(['date', 'employee_id'], 'attendance_date_employee_idx');
            $table->index('status', 'attendance_status_idx');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->index(['company_id', 'status'], 'employees_company_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            $table->dropIndex('attendance_date_employee_idx');
            $table->dropIndex('attendance_status_idx');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropIndex('employees_company_status_idx');
        });
    }
};
