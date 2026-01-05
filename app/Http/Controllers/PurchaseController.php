<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseRequestStore;
use App\Models\BusinessProfile;
use App\Models\Payment;
use Inertia\Inertia;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Models\Product;
use App\Models\PurchaseItem;
use App\Models\Variant;
use App\Models\Stock;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Support\Str;

class PurchaseController extends Controller
{

    // Show purchase list
    public function index(Request $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $query = Purchase::latest()
            ->with(['supplier', 'warehouse', 'items.product', 'items.variant']);

        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('purchase_no', 'like', '%' . $request->search . '%')
                    ->orWhereHas('supplier', function ($q) use ($request) {
                        $q->where('name', 'like', '%' . $request->search . '%')
                            ->orWhere('company', 'like', '%' . $request->search . '%');
                    })
                    ->orWhereHas('warehouse', function ($q) use ($request) {
                        $q->where('name', 'like', '%' . $request->search . '%')
                            ->orWhere('code', 'like', '%' . $request->search . '%');
                    });
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('date') && $request->date) {
            $query->whereDate('purchase_date', $request->date);
        }

        $purchases = $query->paginate(10)->withQueryString();

        if ($isShadowUser) {
            $purchases->getCollection()->transform(function ($purchase) {
                return $this->transformToShadowData($purchase);
            });
        }

        return Inertia::render('Purchase/PurchaseList', [
            'filters' => $request->only(['search', 'status', 'date']),
            'purchases' => $purchases,
            'isShadowUser' => $isShadowUser,
            'accounts' => Account::where('is_active', true)->get()
        ]);
    }


    // Get all purchase items
    public function allPurchasesItems(Request $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $purchaseItems = PurchaseItem::with(['purchase', 'product', 'variant', 'warehouse'])
            ->when($request->filled('product_id'), function ($query) use ($request) {
                $query->where('product_id', $request->product_id);
            })
            ->when($request->filled('date_from') && $request->filled('date_to'), function ($query) use ($request) {
                $query->whereHas('purchase', function ($q) use ($request) {
                    $q->whereBetween('purchase_date', [$request->date_from, $request->date_to]);
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        if ($isShadowUser) {
            $purchaseItems->getCollection()->transform(function ($purchaseItem) {
                return $this->transformToShadowItemData($purchaseItem);
            });
        }

        return Inertia::render('Purchase/PurchaseItemsList', [
            'purchaseItems' => $purchaseItems,
            'filters' => $request->only(['product_id', 'date_from', 'date_to']),
            'isShadowUser' => $isShadowUser,
        ]);
    }


    //show purchase items
    public function showPurchasesItem($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $purchaseItem = PurchaseItem::with(['purchase.supplier', 'product', 'variant', 'warehouse'])
            ->findOrFail($id);

        if ($isShadowUser) {
            $purchaseItem = $this->transformToShadowItemData($purchaseItem);
        }

        $business = BusinessProfile::where('user_id', $user->id)->first();

        return Inertia::render('Purchase/PurchaseItemShow', [
            'purchaseItem' => $purchaseItem,
            'isShadowUser' => $isShadowUser,
            'business' => $business,
        ]);
    }


    // Show create form
    public function create()
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        return Inertia::render('Purchase/AddPurchase', [
            'suppliers' => Supplier::all(),
            'warehouses' => Warehouse::where('is_active', true)->get(),
            'products' => Product::with('variants', 'brand')->get(),
            'accounts' => Account::where('is_active', true)->get(),
            'isShadowUser' => $isShadowUser
        ]);
    }


    // Store purchase
    public function store(PurchaseRequestStore $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';
        $request->validated();

        // Account validation for real users
        if (!$isShadowUser && $request->paid_amount > 0 && !$request->account_id) {
            return back()->withErrors(['error' => 'Please select a payment account when making payment']);
        }

        $account = null;
        if ($request->account_id) {
            $account = Account::find($request->account_id);
            $payment_type = $account->type;
            if (!$account) {
                return back()->withErrors(['error' => 'Selected account not found']);
            }
            if (!$account->is_active) {
                return back()->withErrors(['error' => 'Selected account is not active']);
            }
        }

        $adjustamount = $request->adjust_from_advance ?? false;


        if ($adjustamount == true) {
            $supplier = Supplier::find($request->supplier_id);
            $payment_type = 'advance_adjustment';

            if ($request->paid_amount > $supplier->advance_amount) {
                return back()->withErrors(['error' => 'If you want to adjust from advance, the advance adjustment cannot be greater than available advance amount.']);
            }

            $supplier->update([
                'advance_amount' => $supplier->advance_amount - $request->paid_amount,
            ]);
        }

        DB::beginTransaction();
        try {
            $purchaseCount = Purchase::count();
            $purchaseNo = 'PUR-' . date('Ymd') . '-' . str_pad($purchaseCount + 1, 4, '0', STR_PAD_LEFT);

            $totalAmount = collect($request->items)->sum(function ($item) {
                return $item['quantity'] * $item['unit_price'];
            });

            $paidAmount = $request->paid_amount;
            $shadowPaidAmount = $request->shadow_paid_amount ?? 0;
            $dueAmount = $totalAmount - $paidAmount;

            // Create purchase (NO account_id here)
            $purchase = Purchase::create([
                'purchase_no' => $purchaseNo,
                'supplier_id' => $request->supplier_id,
                'warehouse_id' => $request->warehouse_id,
                'purchase_date' => $request->purchase_date,
                'grand_total' => $totalAmount,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'payment_status' => $request->payment_status,
                'notes' => $request->notes,
                'status' => 'completed',
                'created_by' => $user->id,
                'user_type' => $user->type,
                'payment_type' => $payment_type
            ]);

            // Create purchase items and update stock
            foreach ($request->items as $item) {
                $totalPrice = $item['quantity'] * ($item['unit_price'] ?? 0);
                $unitPrice = $isShadowUser ? 0 : (float) ($item['unit_price'] ?? 0);
                $salePrice = $isShadowUser ? 0 : (float) ($item['sale_price'] ?? 0);

                if (!$isShadowUser && $salePrice <= 0) {
                    throw new \Exception("Sale price must be greater than 0 for product ID: {$item['product_id']}");
                }

                // Create purchase item
                $purchaseItem = $purchase->items()->create([
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $unitPrice,
                    'sale_price' => $salePrice,
                    'total_price' => $totalPrice,
                    'user_type' => $user->type,
                    'created_by' => $user->id,
                    'warehouse_id' => $request->warehouse_id
                ]);

                // Update or create stock
                Stock::create([
                    'warehouse_id' => $request->warehouse_id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'purchase_price' => $isShadowUser ? 0 : $unitPrice,
                    'sale_price' => $isShadowUser ? 0 : $salePrice,
                    'user_type' => $user->type,
                    'created_by' => $user->id,
                    'batch_no' => 'PO' . '-' . $purchaseItem->id . '-' . Str::upper(Str::random(4)),
                ]);
            }

            if ($paidAmount > 0) {
                if ($account) {
                    // Check account balance before deducting
                    if (!$account->canWithdraw($paidAmount)) {
                        throw new \Exception("Insufficient balance in account: {$account->name}");
                    }

                    // Deduct amount from account - this should handle negative internally
                    $account->updateBalance($paidAmount, 'withdraw');
                }

                $payment = new Payment();
                $payment->purchase_id = $purchase->id;
                $payment->amount = -$paidAmount; // Store as NEGATIVE
                $payment->payment_method = $request->payment_method ?? ($payment_type ?? 'cash');
                $payment->txn_ref = $request->txn_ref ?? ('nexoryn-' . Str::random(10));
                $payment->note = $request->notes ?? null;
                $payment->supplier_id = $request->supplier_id ?? null;
                $payment->account_id = $request->account_id;
                $payment->paid_at = Carbon::now();
                $payment->created_by = Auth::id();
                $payment->save();
            }

            DB::commit();

            return redirect()->route('purchase.list')->with(
                'success',
                $isShadowUser ? 'Shadow purchase created successfully' : 'Purchase created successfully'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error creating purchase: ' . $e->getMessage());
        }
    }


    // show purchase function
    public function show($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $purchase = Purchase::with([
            'supplier',
            'warehouse',
            'items.product',
            'items.product.brand',
            'items.variant',
            'payments.account' 
        ])->findOrFail($id);

        if ($isShadowUser) {
            $purchase = $this->transformToShadowData($purchase);
        }

        return Inertia::render('Purchase/PurchaseShow', [
            'purchase' => $purchase,
            'isShadowUser' => $isShadowUser
        ]);
    }


    //edit purchase method
    public function edit($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $purchase = Purchase::with(['supplier', 'warehouse', 'items.product', 'items.variant', 'payments'])
            ->findOrFail($id);

        if ($isShadowUser) {
            $purchase = $this->transformToShadowData($purchase);
        }

        return Inertia::render('Purchase/EditPurchase', [
            'purchase' => $purchase,
            'suppliers' => Supplier::all(),
            'warehouses' => Warehouse::where('is_active', true)->get(),
            'products' => Product::with('variants', 'brand')->get(),
            'accounts' => Account::where('is_active', true)->get(),
            'isShadowUser' => $isShadowUser
        ]);
    }


    //update purchase method
    public function update(PurchaseRequestStore $request, $id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';
        $request->validated();

        if ($user->role !== 'admin' && $user->id !== Purchase::find($id)->created_by) {
            return back()->withErrors(['error' => 'You are not authorized to edit this purchase.']);
        }

        $purchase = Purchase::with('items')->findOrFail($id);

        if ($purchase->status == 'approved' && $purchase->user_type == 'shadow') {
            return back()->withErrors(['error' => 'Cannot edit an approved shadow purchase.']);
        }

        // Account validation for real users
        if (!$isShadowUser && $request->paid_amount > 0 && !$request->account_id) {
            return back()->withErrors(['error' => 'Please select a payment account when making payment']);
        }

        $account = null;
        if ($request->account_id) {
            $account = Account::find($request->account_id);
            if (!$account) {
                return back()->withErrors(['error' => 'Selected account not found']);
            }
            if (!$account->is_active) {
                return back()->withErrors(['error' => 'Selected account is not active']);
            }
        }

        $adjustamount = $request->adjust_from_advance ?? false;
        $payment_type = 'cash';

        if ($adjustamount == true) {
            $supplier = Supplier::find($request->supplier_id);
            $payment_type = 'advance_adjustment';

            $previousAdjustment = $purchase->payment_type === 'advance_adjustment' ? $purchase->paid_amount : 0;
            if ($previousAdjustment > 0) {
                $supplier->update([
                    'advance_amount' => $supplier->advance_amount + $previousAdjustment,
                ]);
            }

            if ($request->paid_amount > $supplier->advance_amount) {
                return back()->withErrors(['error' => 'Advance adjustment cannot be greater than available advance amount.']);
            }

            $supplier->update([
                'advance_amount' => $supplier->advance_amount - $request->paid_amount,
            ]);
        } else {
            if ($purchase->payment_type === 'advance_adjustment') {
                $supplier = Supplier::find($purchase->supplier_id);
                $supplier->update([
                    'advance_amount' => $supplier->advance_amount + $purchase->paid_amount,
                ]);
            }
        }

        DB::beginTransaction();
        try {
            $totalAmount = collect($request->items)->sum(function ($item) {
                return $item['quantity'] * $item['unit_price'];
            });

            $paidAmount = $request->paid_amount;
            $dueAmount = $totalAmount - $paidAmount;

            // Update purchase
            $purchase->update([
                'supplier_id' => $request->supplier_id,
                'warehouse_id' => $request->warehouse_id,
                'purchase_date' => $request->purchase_date,
                'grand_total' => $totalAmount,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'payment_status' => $request->payment_status,
                'notes' => $request->notes,
                'payment_type' => $payment_type
            ]);

            // Delete existing items and restore stock
            foreach ($purchase->items as $item) {
                $stock = Stock::where('warehouse_id', $purchase->warehouse_id)
                    ->where('product_id', $item->product_id)
                    ->where('variant_id', $item->variant_id)
                    ->first();

                if ($stock) {
                    $newQuantity = $stock->quantity - $item->quantity;
                    if ($newQuantity <= 0) {
                        $stock->delete();
                    } else {
                        $stock->update(['quantity' => $newQuantity]);
                    }
                }
                $item->delete();
            }

            // Create new items and update stock
            foreach ($request->items as $item) {
                $totalPrice = $item['quantity'] * ($item['unit_price'] ?? 0);
                $unitPrice = $isShadowUser ? 0 : (float) ($item['unit_price'] ?? 0);
                $salePrice = $isShadowUser ? 0 : (float) ($item['sale_price'] ?? 0);

                if (!$isShadowUser && $salePrice <= 0) {
                    throw new \Exception("Sale price must be greater than 0 for product ID: {$item['product_id']}");
                }

                $purchaseItem = $purchase->items()->create([
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $unitPrice,
                    'sale_price' => $salePrice,
                    'total_price' => $totalPrice,
                    'user_type' => $user->type,
                    'created_by' => $user->id,
                    'warehouse_id' => $request->warehouse_id
                ]);

                $stock = Stock::where('warehouse_id', $request->warehouse_id)
                    ->where('product_id', $item['product_id'])
                    ->where('variant_id', $item['variant_id'])
                    ->first();

                if ($stock) {
                    $stock->increment('quantity', $item['quantity']);
                } else {
                    Stock::create([
                        'warehouse_id' => $request->warehouse_id,
                        'product_id' => $item['product_id'],
                        'variant_id' => $item['variant_id'],
                        'quantity' => $item['quantity'],
                        'purchase_price' => $isShadowUser ? 0 : $unitPrice,
                        'sale_price' => $isShadowUser ? 0 : $salePrice,
                        'user_type' => $user->type,
                        'created_by' => $user->id,
                        'batch_no' => 'PO-' . $purchaseItem->id . '-' . Str::upper(Str::random(4)),
                    ]);
                }
            }

            // Handle payment update
            // Handle payment update
            $payment = Payment::where('purchase_id', $purchase->id)->first();

            if ($payment) {
                // If there's an existing payment and account
                if ($payment->account_id) {
                    $oldAccount = Account::find($payment->account_id);
                    if ($oldAccount) {
                        // Add back old amount to account (reverse the previous withdrawal)
                        // Since payment amount is stored negative, we need to use the signed value
                        $oldPaymentAmount = $payment->getSignedAmount(); // This will be negative
                        $oldAccount->updateBalance(abs($oldPaymentAmount), 'deposit'); // Use positive value for deposit
                    }
                }

                // Delete old payment if paid amount is 0
                if ($paidAmount <= 0) {
                    $payment->delete();
                } else {
                    // Update existing payment with negative amount
                    $payment->update([
                        'amount' => -$paidAmount, // Store as NEGATIVE
                        'payment_method' => $request->payment_method ?? $payment_type,
                        'note' => $request->notes,
                        'supplier_id' => $request->supplier_id,
                        'account_id' => $request->account_id
                    ]);

                    // Deduct new amount from new account
                    if ($account) {
                        if (!$account->canWithdraw($paidAmount)) {
                            throw new \Exception("Insufficient balance in account: {$account->name}");
                        }
                        $account->updateBalance($paidAmount, 'withdraw');
                    }
                }
            } elseif ($paidAmount > 0) {
                // Create new payment with negative amount
                if ($account) {
                    if (!$account->canWithdraw($paidAmount)) {
                        throw new \Exception("Insufficient balance in account: {$account->name}");
                    }
                    $account->updateBalance($paidAmount, 'withdraw');
                }

                Payment::create([
                    'purchase_id' => $purchase->id,
                    'amount' => -$paidAmount, // Store as NEGATIVE
                    'payment_method' => $request->payment_method ?? $payment_type,
                    'txn_ref' => 'nexoryn-' . Str::random(10),
                    'note' => $request->notes,
                    'supplier_id' => $request->supplier_id,
                    'account_id' => $request->account_id,
                    'paid_at' => Carbon::now(),
                    'created_by' => Auth::id()
                ]);
            }

            DB::commit();

            return redirect()->route('purchase.list')->with(
                'success',
                $isShadowUser ? 'Shadow purchase updated successfully' : 'Purchase updated successfully'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error updating purchase: ' . $e->getMessage());
        }
    }



    //private functions
    private function transformToShadowData($purchase)
    {
        $purchase->grand_total = $purchase->shadow_grand_total;
        $purchase->paid_amount = $purchase->shadow_paid_amount;
        $purchase->due_amount = $purchase->shadow_due_amount;

        if ($purchase->items) {
            $purchase->items->transform(function ($item) {
                $item->unit_price = $item->shadow_unit_price;
                $item->sale_price = $item->shadow_sale_price;
                $item->total_price = $item->shadow_total_price;
                return $item;
            });
        }

        return $purchase;
    }

    private function transformToShadowItemData($purchase)
    {
        $purchase->unit_price = $purchase->shadow_unit_price;
        $purchase->sale_price = $purchase->shadow_sale_price;
        $purchase->total_price = $purchase->shadow_total_price;

        return $purchase;
    }


    //destroy purchase method
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $purchase = Purchase::with('items')->findOrFail($id);

            // Restore account balance if payment exists
            $payment = Payment::where('purchase_id', $purchase->id)->first();
            if ($payment && $payment->account_id) {
                $account = Account::find($payment->account_id);
                if ($account && $payment->amount > 0) {
                    // Since payment amount is stored negative, get the absolute value
                    $paymentAmount = abs($payment->getSignedAmount());

                    // Add back the amount (deposit) to account (reverse withdrawal)
                    $account->updateBalance($paymentAmount, 'deposit');
                    Log::info('Payment restored to account on purchase deletion', [
                        'purchase_id' => $purchase->id,
                        'account_id' => $account->id,
                        'amount' => $paymentAmount
                    ]);
                }
            }

            // Reverse stock
            foreach ($purchase->items as $item) {
                $stock = Stock::where('warehouse_id', $purchase->warehouse_id)
                    ->where('product_id', $item->product_id)
                    ->where('variant_id', $item->variant_id)
                    ->first();

                if ($stock) {
                    $stock->decrement('quantity', $item->quantity);
                    if ($stock->quantity <= 0) {
                        $stock->delete();
                    }
                }
            }

            $purchase->delete();

            DB::commit();
            return redirect()->route('purchase.list')->with('success', 'Purchase deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error deleting purchase: ' . $e->getMessage());
        }
    }


    //update payment method
    public function updatePayment(Request $request, $id)
    {
        $purchase = Purchase::with('supplier')->findOrFail($id);



        $request->validate([
            'payment_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'account_id' => 'required|exists:accounts,id',
        ]);


        DB::beginTransaction();
        try {
            $paymentAmount = $request->payment_amount;
            $account = Account::find($request->account_id);
            $payment_type = $account->type ?? 'cash';

            if (!$account) {
                return back()->withErrors(['error' => 'Selected account not found']);
            }

            if (!$account->canWithdraw($paymentAmount)) {
                return back()->withErrors(['account_id' => 'Insufficient balance in selected account']);
            }

            $newPaidAmount = $purchase->paid_amount + $paymentAmount;
            $newDueAmount = max(0, $purchase->grand_total - $newPaidAmount);
            $newPaymentStatus = $newDueAmount == 0 ? 'paid' : ($newPaidAmount > 0 ? 'partial' : 'unpaid');

            // Update purchase
            $purchase->update([
                'paid_amount' => $newPaidAmount,
                'due_amount' => $newDueAmount,
                'payment_status' => $newPaymentStatus,
                'status' => 'completed'
            ]);

            // Deduct from account (MINUS for purchase payment)
            $account->updateBalance($paymentAmount, 'withdraw');

            // Create payment record with negative amount
            Payment::create([
                'purchase_id' => $purchase->id,
                'amount' => -$paymentAmount, // Store as NEGATIVE
                'payment_method' => $request->payment_method ?? $payment_type,
                'txn_ref' => 'PYM-' . Str::random(10),
                'note' => $request->notes ?? 'Purchase due amount clearance',
                'supplier_id' => $purchase->supplier_id,
                'account_id' => $request->account_id,
                'paid_at' => Carbon::now(),
                'created_by' => Auth::id()
            ]);

            DB::commit();

            return redirect()->back()->with('success', 'Payment processed successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error processing payment: ' . $e->getMessage());
        }
    }


    //approve purchase method
    public function approve(Request $request, $id)
    {
        $purchase = Purchase::with('items')->findOrFail($id);

        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:purchase_items,id',
            'items.*.purchase_price' => 'required|numeric|min:0.01',
            'items.*.sale_price' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            $totalRealAmount = 0;

            foreach ($request->items as $approveItem) {
                $item = PurchaseItem::find($approveItem['id']);

                if ($item) {
                    $realTotalPrice = $approveItem['purchase_price'] * $item->quantity;
                    $totalRealAmount += $realTotalPrice;

                    $item->update([
                        'unit_price' => $approveItem['purchase_price'],
                        'sale_price' => $approveItem['sale_price'],
                        'total_price' => $realTotalPrice
                    ]);

                    $stock = Stock::where('warehouse_id', $purchase->warehouse_id)
                        ->where('product_id', $item->product_id)
                        ->where('variant_id', $item->variant_id)
                        ->first();

                    if ($stock) {
                        $stock->update([
                            'purchase_price' => $approveItem['purchase_price'],
                            'sale_price' => $approveItem['sale_price']
                        ]);
                    }
                }
            }

            $purchase->update([
                'total_amount' => $totalRealAmount,
                'due_amount' => max(0, $totalRealAmount - $purchase->paid_amount),
                'status' => 'completed',
                'notes' => $purchase->notes . "\n\nApproved by: " . Auth::user()->name .
                    "\nApproval Date: " . now()->format('Y-m-d H:i:s') .
                    ($request->notes ? "\nApproval Notes: " . $request->notes : "")
            ]);

            DB::commit();
            return redirect()->back()->with('success', 'Shadow purchase approved successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error approving purchase: ' . $e->getMessage());
        }
    }
}