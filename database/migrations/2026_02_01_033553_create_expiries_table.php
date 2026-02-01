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
        Schema::create('expiries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sale_item_id')->nullable();
            $table->unsignedBigInteger('purchase_item_id')->nullable();
            $table->dateTime('expire_date')->nullable();
            $table->enum('status', ['valid', 'expired', 'returned'])->default('valid');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expiries');
    }
};
