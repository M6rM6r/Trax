<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            $table->enum('check_out_status', ['present', 'late', 'absent'])
                ->nullable()
                ->after('status')
                ->comment('Status at time of check-out (preserves present/late before status changes to checked_out)');
        });
    }

    public function down(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            $table->dropColumn('check_out_status');
        });
    }
};
