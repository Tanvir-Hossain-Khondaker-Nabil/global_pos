<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('investments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('created_by')->index();

            $table->unsignedBigInteger('outlet_id')->nullable()->index(); // requirement: investment-এ outlet লাগবে
            $table->unsignedBigInteger('investor_id')->index();

            $table->string('code')->unique(); // e.g INV-20260201-0001

            // মেয়াদ/শুরু/শেষ
            $table->date('start_date')->index();
            $table->integer('duration_months')->default(1); // মেয়াদ (মাস)
            $table->date('end_date')->nullable()->index();  // start + duration

            // rate + amounts
            $table->decimal('profit_rate', 8, 4)->default(0); // percent
            $table->decimal('initial_principal', 18, 2)->default(0);
            $table->decimal('current_principal', 18, 2)->default(0);

            // status
            $table->enum('status', ['active', 'completed', 'closed'])->default('active')->index();

            // month-end automation ট্র্যাক করার জন্য
            $table->date('last_profit_date')->nullable()->index(); // last month-end processed date

            $table->text('note')->nullable();
            $table->timestamps();

            // FK
            $table->foreign('investor_id')->references('id')->on('investors')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('investments');
    }
};
