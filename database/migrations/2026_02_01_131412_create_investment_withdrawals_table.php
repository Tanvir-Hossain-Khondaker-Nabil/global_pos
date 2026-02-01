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
        Schema::create('investment_withdrawals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('created_by')->index();

            $table->unsignedBigInteger('investment_id')->index();
            $table->date('withdraw_date')->index();
            $table->decimal('amount', 18, 2)->default(0);

            $table->string('reason')->nullable();
            $table->timestamps();

            $table->foreign('investment_id')->references('id')->on('investments')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('investment_withdrawals');
    }
};
