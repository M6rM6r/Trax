<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->index('status');
            $table->index('geofence_id');
            $table->index('role');
            $table->index('last_seen');
        });

        Schema::table('geofences', function (Blueprint $table) {
            $table->index('active');
        });

        Schema::table('attendance', function (Blueprint $table) {
            $table->index('employee_id');
            $table->index('geofence_id');
            $table->index(['status', 'date']);
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['geofence_id']);
            $table->dropIndex(['role']);
            $table->dropIndex(['last_seen']);
        });

        Schema::table('geofences', function (Blueprint $table) {
            $table->dropIndex(['active']);
        });

        Schema::table('attendance', function (Blueprint $table) {
            $table->dropIndex(['employee_id']);
            $table->dropIndex(['geofence_id']);
            $table->dropIndex(['status', 'date']);
        });
    }
};
