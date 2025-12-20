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
        Schema::create('sales_return_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sales_return_id')->nullable();
            $table->unsignedBigInteger('sale_item_id')->nullable();
            $table->unsignedBigInteger('product_id')->nullable();
            $table->unsignedBigInteger('variant_id')->nullable();
            $table->unsignedBigInteger('warehouse_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->decimal('unit_price', 15, 2)->nullable();
            $table->decimal('shadow_unit_price', 15, 2)->nullable();
            $table->decimal('sale_price', 15, 2)->nullable();
            $table->decimal('shadow_sale_price', 15, 2)->nullable();
            $table->decimal('total_price', 15, 2)->nullable();
            $table->decimal('shadow_total_price', 15, 2)->nullable();
            $table->integer('return_quantity');
            $table->string('reason')->nullable();
            $table->string('type')->default('sale_return'); // return or replacement // damaged
            $table->enum('status', ['pending', 'processed'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_return_items');
    }
};
