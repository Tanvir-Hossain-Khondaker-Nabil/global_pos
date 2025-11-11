<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PaymentController extends Controller
{
    
    public function index(Request $request)
    {

        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $filters = [
            'search' => $request->input('search', ''),
        ];

        $payments = Payment::with(['sale', 'customer'])
            ->where('status', '!=', 'cancelled')
            ->when($request->input('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('payment_method', 'like', "%{$search}%")
                        ->orWhere('txn_ref', 'like', "%{$search}%")
                        ->orWhere('note', 'like', "%{$search}%")
                        ->orWhereHas('customer', function ($q2) use ($search) {
                            $q2->where('customer_name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('sale', function ($q3) use ($search) {
                            $q3->where('invoice_no', 'like', "%{$search}%");
                        });
                });
            })
            ->latest()
            ->paginate(20);

        if ($isShadowUser) {
            $payments->getCollection()->transform(function ($payment) {
                return $this->transformToShadowData($payment);
            });
        }

        return Inertia::render('Payments/Index', [
            'payments' => $payments,
            'filters' => $filters,
            'isShadowUser' => $isShadowUser,
        ]);
    }


    public function show(Payment $payment)
    {
       
        $payment = Payment::with(['customer', 'sale.items'])->findOrFail($payment->id);

        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        if ($isShadowUser) {
            $payment = $this->transformToShadowData($payment);
        }

        return Inertia::render('Payments/Show', [
            'payment' => $payment
        ]);
    }


    private function transformToShadowData(Payment $payment)
    {
        $payment->amount =  $payment->shadow_amount;
        $payment->sale->grand_total = $payment->sale->shadow_grand_total;

        if ($payment->sale->items) {
            $payment->sale->items->transform(function ($item) {
                $item->unit_price = $item->shadow_unit_price;
                $item->sale_price = $item->shadow_sale_price;
                $item->total_price = $item->shadow_total_price;
                return $item;
            });
        }


        return $payment;
    }

}
