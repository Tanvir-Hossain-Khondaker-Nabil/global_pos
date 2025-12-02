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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sale_id')->default(0)->nullable();
            $table->unsignedBigInteger('purchase_id')->default(0)->nullable();
            $table->decimal('amount', 15, 2)->nullable();
            $table->decimal('shadow_amount', 15, 2)->nullable();
            $table->string('payment_method')->default('cash'); // e.g., cash, card, online
            $table->string('txn_ref')->nullable();
            $table->text('note')->nullable();
            $table->unsignedBigInteger('customer_id')->default(0)->nullable();
            $table->unsignedBigInteger('supplier_id')->default(0)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('status')->default('completed'); // e.g., completed, pending, failed
            $table->unsignedBigInteger('created_by')->default(0)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
