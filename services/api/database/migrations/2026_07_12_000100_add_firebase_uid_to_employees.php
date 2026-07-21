<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (! Schema::hasColumn('employees', 'firebase_uid')) {
                $table->string('firebase_uid')->nullable()->after('email');
                $table->index('firebase_uid');
            }
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (Schema::hasColumn('employees', 'firebase_uid')) {
                $table->dropIndex(['firebase_uid']);
                $table->dropColumn('firebase_uid');
            }
        });
    }
};
