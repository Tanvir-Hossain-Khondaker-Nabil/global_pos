<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Damage;
use App\Models\Payment;
use App\Models\PurchaseItem;
use App\Models\SaleItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Pest\Support\Str;

class DamageController extends Controller
{


    /**
     * Get the data for the damage creation page.
     */
    public function getData($id, $type = null)
    {
        if ($type == 'sale') {
            $data = SaleItem::with(['product', 'sale', 'variant', 'warehouse'])->where('id', $id)->first();
        } elseif ($type == 'purchase') {
            $data = PurchaseItem::with(['product', 'purchase', 'variant', 'warehouse'])->where('id', $id)->first();
        }

        return inertia('Damages/Create', [
            'data' => $data,
            'type' => $type,
            'accounts' => Account::where('is_active', true)->get(),
        ]);
    }


    /**
     * Store a new damage record.
     */

    public function storeDamage(Request $request)
    {
        $request->validate([
            'type'      => 'required|in:sale,purchase',
            'item_id'   => [
                'required',
                function ($attribute, $value, $fail) use ($request) {

                    if (
                        $request->type === 'sale' &&
                        !DB::table('sale_items')->where('id', $value)->exists()
                    ) {
                        $fail('Invalid sale item.');
                    }

                    if (
                        $request->type === 'purchase' &&
                        !DB::table('purchase_items')->where('id', $value)->exists()
                    ) {
                        $fail('Invalid purchase item.');
                    }
                },
            ],
            'quantity'  => 'required|numeric|min:1',
            'notes'     => 'nullable|string|max:255',
            'reason'    => 'nullable|string',
            'account_id' => 'nullable|exists:accounts,id',
        ]);


        // Assign IDs safely
        $saleItemId     = $request->type === 'sale' ? $request->item_id : null;
        $purchaseItemId = $request->type === 'purchase' ? $request->item_id : null;
        $cost = ($request->loss_amount ?? 0) * $request->quantity;


        if (Damage::where('sale_item_id', $saleItemId)->orWhere('purchase_item_id', $purchaseItemId)->exists()) {
            return back()->withErrors(['item_id' => 'Damage record already exists for this item.']);
        }


        if ($cost > 0 && $request->account_id) {

            $account = Account::find($request->account_id);

            if ($account) {
                $account->updateBalance($cost, $request->type == 'sale' ? 'withdraw' : 'credit');
            }

            Payment::create([
                'account_id' => $account->id,
                'amount' => $cost * ($request->type == 'sale' ? -1 : 1),
                'payment_method' => $account->type,
                'txn_ref' => 'OB-' . strtoupper(Str::random(8)),
                'note' => 'Damage balance added while creating account',
                'paid_at' => now(),
                'status' => 'completed',
                'created_by' => Auth::id(),
            ]);
        }

        Damage::create([
            'sale_item_id'      => $saleItemId,
            'purchase_item_id'  => $purchaseItemId,
            'damage_quantity'   => $request->quantity,
            'description'       => $request->notes,
            'type'              => $request->type,
            'damage_date'       => now(),
            'action_taken'      => 'refund',
            'cost'              => $cost,
            'reason'            => $request->reason,
        ]);



        return back()->with('success', 'Damage record created successfully.');
    }



    /**
     * Index damages.
     */

    public function index()
    {
        $damages = Damage::with(['saleItem.product', 'purchaseItem.product'])->orderBy('created_at', 'desc')->get();

        return inertia('Damages/Index', [
            'damages' => $damages,
        ]);
    }
}
