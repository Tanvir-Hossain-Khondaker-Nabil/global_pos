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
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('invoice_no')->unique();

            $table->decimal('sub_total', 10,2)->default(0);
            $table->decimal('discount', 10,2)->default(0);
            $table->decimal('vat_tax', 10,2)->default(0);
            $table->decimal('grand_total', 10,2)->default(0);
            $table->decimal('paid_amount', 10,2)->default(0);
            $table->decimal('due_amount', 10,2)->default(0);

             $table->decimal('shadow_sub_total', 10,2)->default(0);
            $table->decimal('shadow_discount', 10,2)->default(0);
            $table->decimal('shadow_vat_tax', 10,2)->default(0);
            $table->decimal('shadow_grand_total', 10,2)->default(0);
            $table->decimal('shadow_paid_amount', 10,2)->default(0);
            $table->decimal('shadow_due_amount', 10,2)->default(0);

            $table->enum('payment_type', ['cash','card','bkash','bank'])->default('cash');
            $table->enum('status', ['pending','paid','partial','cancelled'])->default('pending');

            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
