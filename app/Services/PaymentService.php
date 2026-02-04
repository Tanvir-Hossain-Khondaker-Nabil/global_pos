<?php

namespace App\Services;

use App\Models\{Payment, Sale, Purchase, Installment, Account};
use Illuminate\Support\Facades\Auth;

class PaymentService
{
    public static function saleInstallment(
        Installment $installment,
        float $amount,
        string $paymentDate,
        Account $account
    ): void {
        $sale = Sale::findOrFail($installment->sale_id);

        self::updateAmounts($sale, $amount);

        self::create([
            'account_id'      => $account->id,
            'amount'          => $amount,
            'customer_id'     => $sale->customer_id,
            'sale_id'         => $sale->id,
            'installment_id'  => $installment->id,
            'payment_date'    => $paymentDate,
            'payment_method'  => $account->type,
            'txn_ref'         => 'PI-' . $installment->id . '-' . uniqid(),
            'owner_id'        => $sale->owner_id,
            'outlet_id'       => $sale->outlet_id,
        ]);

        // money IN
        $account->updateBalance($amount, 'credit');
    }

    public static function purchaseInstallment(
        Installment $installment,
        float $amount,
        string $paymentDate,
        Account $account
    ): void {
        $purchase = Purchase::findOrFail($installment->purchase_id);

        self::updateAmounts($purchase, $amount);

        self::create([
            'account_id'      => $account->id,
            'amount'          => $amount * (-1),
            'supplier_id'     => $purchase->supplier_id,
            'purchase_id'     => $purchase->id,
            'installment_id'  => $installment->id,
            'payment_date'    => $paymentDate,
            'payment_method'  => $account->type,
            'txn_ref'         => 'PI-' . $installment->id . '-' . uniqid(),
            'owner_id'        => $purchase->owner_id,
            'outlet_id'       => $purchase->outlet_id,
        ]);

        // money OUT
        $account->updateBalance($amount, 'withdraw');
    }

    private static function updateAmounts($model, float $amount): void
    {
        $model->increment('paid_amount', $amount);
        $model->decrement('due_amount', $amount);

        if (1 >= $model->due_amount && $model->due_amount >= 0) {
            $model->update(['status' => 'paid']);
        }
    }

    private static function create(array $data): void
    {
        Payment::create($data + [
            'paid_at'    => now(),
            'status'     => 'completed',
            'created_by' => Auth::id(),
        ]);
    }
}
