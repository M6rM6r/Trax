<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'username')) {
                $table->string('username')->nullable()->after('email');
                $table->unique(['company_id', 'username']);
            }
        });

        Schema::table('employees', function (Blueprint $table) {
            if (! Schema::hasColumn('employees', 'employee_number')) {
                $table->string('employee_number')->nullable()->after('email');
                $table->index(['company_id', 'employee_number']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (Schema::hasColumn('employees', 'employee_number')) {
                $table->dropIndex(['company_id', 'employee_number']);
                $table->dropColumn('employee_number');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'username')) {
                $table->dropUnique(['company_id', 'username']);
                $table->dropColumn('username');
            }
        });
    }
};
