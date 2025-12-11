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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('product_no');
            $table->unsignedBigInteger('category_id');
            $table->text('description')->nullable();

            $table->enum('product_type', ['regular', 'in_house'])->default('regular');
            $table->decimal('in_house_cost', 10, 2)->nullable();
            $table->decimal('in_house_shadow_cost', 10, 2)->nullable();
            $table->decimal('in_house_sale_price', 10, 2)->nullable();
            $table->decimal('in_house_shadow_sale_price', 10, 2)->nullable();
            $table->integer('in_house_initial_stock')->default(0);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('brand_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
