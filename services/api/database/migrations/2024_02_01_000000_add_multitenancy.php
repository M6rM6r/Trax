<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Companies table
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('logo')->nullable();
            $table->string('industry')->nullable();
            $table->string('address')->nullable();
            $table->string('phone')->nullable();
            $table->enum('plan', ['trial', 'starter', 'pro', 'enterprise'])->default('trial');
            $table->integer('max_employees')->default(10);
            $table->timestamp('trial_ends_at')->nullable();
            $table->boolean('active')->default(true);
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        // 2. Add company_id to users
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->index('company_id');
        });

        // 3. Add company_id to geofences
        Schema::table('geofences', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->index('company_id');
        });

        // 4. Add company_id to employees
        Schema::table('employees', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->index('company_id');
        });

        // 5. Drop old unique on employees.email, re-add scoped to company
        Schema::table('employees', function (Blueprint $table) {
            $table->dropUnique(['email']);
            $table->unique(['company_id', 'email']);
        });

        // 6. Subscription/plan tracking
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->enum('plan', ['trial', 'starter', 'pro', 'enterprise']);
            $table->integer('employee_limit');
            $table->decimal('price_monthly', 10, 2)->default(0);
            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->nullable();
            $table->boolean('active')->default(true);
            $table->string('payment_reference')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');

        Schema::table('employees', function (Blueprint $table) {
            $table->dropUnique(['company_id', 'email']);
            $table->unique('email');
            $table->dropConstrainedForeignId('company_id');
        });

        Schema::table('geofences', function (Blueprint $table) {
            $table->dropConstrainedForeignId('company_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('company_id');
        });

        Schema::dropIfExists('companies');
    }
};
