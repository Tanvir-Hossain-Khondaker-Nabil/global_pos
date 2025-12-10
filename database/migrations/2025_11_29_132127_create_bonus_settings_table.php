<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bonus_settings', function (Blueprint $table) {
            $table->id();

            $table->string('bonus_name');
            $table->enum('bonus_type', ['eid', 'festival', 'performance', 'other']); // Bonus category

            // For percentage bonus
            $table->decimal('percentage', 8, 2)->nullable();

            // For fixed amount bonus
            $table->decimal('fixed_amount', 12, 2)->nullable();

            // true = percentage bonus, false = fixed amount
            $table->boolean('is_percentage')->default(false);

            // Bonus active or not
            $table->boolean('is_active')->default(true);

            // Optional description
            $table->text('description')->nullable();

            // Bonus effective date
            $table->date('effective_date')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bonus_settings');
    }
};
