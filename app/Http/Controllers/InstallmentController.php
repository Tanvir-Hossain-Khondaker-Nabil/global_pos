<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Installment;
use App\Models\Purchase;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


class InstallmentController extends Controller
{


    public function getInstallment($id, $type = null)
    {
        if ($type == 'purchase') {
            $installments = Installment::where('purchase_id', $id)->get();
        } else {
            $installments = Installment::where('sale_id', $id)->get();
        }

        $accounts = Account::where('is_active', true)->get();

        return inertia('Installments/ShowInstallment', [
            'installments' => $installments,
            'accounts' => $accounts,
        ]);
    }




    public function updateInstallment($id, Request $request)
    {
        $request->validate([
            'account_id'   => 'required|exists:accounts,id',
            'amount'       => 'required|numeric|min:1',
            'payment_date' => 'required|date',
        ]);

        DB::transaction(function () use ($request, $id) {

            $account = Account::lockForUpdate()->findOrFail($request->account_id);

            if ($request->amount > $account->current_balance) {
                throw new \Exception('Insufficient balance in the selected account.');
            }

            $installment = Installment::findOrFail($id);

            // mark installment paid
            $installment->update([
                'status'      => 'paid',
                'paid_date'   => $request->payment_date,
                'paid_amount' => $request->amount,
            ]);


            // SALE
            if ($installment->sale_id) {

                $sale = Sale::findOrFail($installment->sale_id);

                $sale->increment('paid_amount', $request->amount);
                $sale->decrement('due_amount', $request->amount);

                if ($sale->paid_amount >= $sale->grand_total) {
                    $sale->update(['status' => 'paid']);
                }

                // deduct account balance
                $account->updateBalance('current_balance', $request->amount,'credit');
            }

            // PURCHASE
            if ($installment->purchase_id) {

                $purchase = Purchase::findOrFail($installment->purchase_id);
                $purchase->increment('paid_amount', $request->amount);
                $purchase->decrement('due_amount', $request->amount);

                if ($purchase->paid_amount >= $purchase->grand_total) {
                    $purchase->update(['status' => 'paid']);
                }

                // deduct account balance
                $account->updateBalance('current_balance', $request->amount,'withdraw');
            }

        });

        return back()->with('success', 'Installment paid successfully.');
    }


}
