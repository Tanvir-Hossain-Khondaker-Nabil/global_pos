<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Installment;
use App\Models\Payment;
use App\Models\Purchase;
use App\Models\Sale;
use Carbon\Carbon;
 use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;


class InstallmentController extends Controller
{


    /**
     * Get installments for a specific sale or purchase.
     */
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




    /**
     * Update an existing installment.
     */
    public function updateInstallment($id, Request $request)
    {
        $request->validate([
            'account_id'   => 'required|exists:accounts,id',
            'amount'       => 'required|numeric|min:1',
            'payment_date' => 'required|date',
        ]);

        DB::transaction(function () use ($request, $id) {

            $account = Account::lockForUpdate()->findOrFail($request->account_id);
            $installment = Installment::lockForUpdate()->findOrFail($id);

            if ($installment->status === 'paid') {
                throw new \Exception('This installment is already paid.');
            }

            if ($request->amount > $account->current_balance) {
                throw new \Exception('Insufficient balance in the selected account.');
            }

            // Mark installment paid
            $installment->update([
                'status'      => 'paid',
                'paid_date'   => $request->payment_date,
                'paid_amount' => $request->amount,
            ]);

            // Handle SALE installment
            if ($installment->sale_id) {
                $this->handleSalePayment($request, $installment, $account);
            }

            // Handle PURCHASE installment
            if ($installment->purchase_id) {
                $this->handlePurchasePayment($request, $installment, $account);
            }
        });

        return back()->with('success', 'Installment paid successfully.');
    }




    /**
     * Handle the payment for a sale installment.
     */
    private function handleSalePayment($request, $installment, $account)
    {
        PaymentService::saleInstallment(
            $installment,
            $request->amount,
            $request->payment_date,
            $account
        );
    }


    /**
     * Handle the payment for a purchase installment.
     */
    private function handlePurchasePayment($request, $installment, $account)
    {
        PaymentService::purchaseInstallment(
            $installment,
            $request->amount,
            $request->payment_date,
            $account
        );
    }

}
