<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('role', ['boss', 'employee', 'manager', 'supervisor'])->default('employee');
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('geofences', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('address');
            $table->double('lat');
            $table->double('lng');
            $table->float('radius')->default(100);
            $table->string('color')->default('#3C7EE7');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone');
            $table->enum('role', ['manager', 'employee', 'supervisor'])->default('employee');
            $table->string('department');
            $table->string('avatar')->nullable();
            $table->foreignId('geofence_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->double('current_lat')->nullable();
            $table->double('current_lng')->nullable();
            $table->timestamp('last_seen')->nullable();
            $table->timestamps();
        });

        Schema::create('attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->time('check_in_time')->nullable();
            $table->time('check_out_time')->nullable();
            $table->double('check_in_lat')->nullable();
            $table->double('check_in_lng')->nullable();
            $table->foreignId('geofence_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('status', ['present', 'late', 'absent', 'checked_out'])->default('present');
            $table->integer('late_minutes')->default(0);
            $table->float('worked_hours')->default(0);
            $table->timestamps();

            $table->unique(['employee_id', 'date']);
            $table->index(['date', 'status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('attendance');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('geofences');
        Schema::dropIfExists('users');
    }
};
