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
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete()->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('variant_id')->nullable();
            $table->unsignedBigInteger('warehouse_id')->nullable();
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 10,2)->default(0);
            $table->decimal('total_price', 10,2)->default(0);

            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('completed');

            $table->decimal('shadow_unit_price', 10,2)->default(0);
            $table->decimal('shadow_total_price', 10,2)->default(0);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};
