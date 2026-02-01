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
        Schema::create('investment_returns', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('created_by')->index();

            $table->unsignedBigInteger('investment_id')->index();

            $table->date('period_end')->index(); // month-end date (e.g 2026-02-28)
            $table->decimal('principal_snapshot', 18, 2)->default(0); // profit calc সময় principal কত ছিল
            $table->decimal('profit_amount', 18, 2)->default(0);

            $table->enum('status', ['pending', 'paid'])->default('pending')->index();
            $table->date('paid_date')->nullable()->index();

            $table->timestamps();

            $table->unique(['investment_id', 'period_end']); // same month duplicate block
            $table->foreign('investment_id')->references('id')->on('investments')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('investment_returns');
    }
};
