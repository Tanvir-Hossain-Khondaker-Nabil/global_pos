<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Exchange;
use App\Models\Product;
use App\Models\SalesList;
use App\Models\Variant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

use function Pest\Laravel\json;

class SalesController extends Controller
{
    // index
    public function addView(Request $request)
    {
        // collect filters
        $query = $request->only(['category_id']);

        // sales data
        $slaesId = $request->query('salesid');
        $salesdata = null;
        if (isset($slaesId) && !empty($slaesId)) {
            $salesdata = SalesList::with(['customer', 'created_by'])->find($slaesId);
        }

        // exchange data
        $exchangeid = $request->query('exchangeid');
        $exchangedata = null;
        if (isset($exchangeid) && !empty($exchangeid)) {
            $exchangedata = SalesList::with(['customer'])->where('sales_id', $exchangeid)->first();
        }

        // build query
        $pQuery = Product::query();
        if (!empty($query['category_id'])) {
            $pQuery->where('category_id', $query['category_id']);
        }
        // fetch products
        $product = $pQuery->select("id", "name", 'product_no')->get();
        $product = $product->map(function ($item) {
            return [
                "value" => $item->id,
                "label" => $item->name . ' | ' . $item->product_no,
            ];
        });

        // grand total
        $grandTotal = Cart::where("user_id", Auth::id())
            ->get()
            ->sum(function ($cart) {
                $discountedPrice = $cart->price - ($cart->price * $cart->discount / 100);
                return $discountedPrice * $cart->stock;
            });

        return Inertia::render("sales/Sales", [
            'product' => $product,
            'customer' => Customer::pluck('id', 'customer_name')->toArray(),
            'category' => Category::pluck('id', 'name')->toArray(),
            'filter' => $query,
            'cart' => Cart::with(['product'])
                ->latest()
                ->where('user_id', Auth::id())
                ->get()
                ->map(fn($cart) => [
                    'id' => $cart->id,
                    'product_id' => $cart->product_id,
                    'price' => $cart->price,
                    'discount' => $cart->discount,
                    'stock' => $cart->stock,
                    'product' => $cart->product?->name . ' | ' . $cart->product?->product_no . " | " . strtoupper($cart?->size ?? '') . ' | ' . strtoupper($cart?->color ?? ''),
                ]),
            'grandTotal' => $grandTotal,
            'salesdata' => $salesdata,
            'exchangedata' => $exchangedata,
            'preurl' => url()->previous(),
            'exchangeid' => $request->query('exchangeid')
        ]);
    }

    // get product varaint
    public function productVaraint(Request $request)
    {
        try {
            $product = Product::latest()
                ->with(['category', 'sizes.colors'])
                ->find($request->id);

            return response()->json($product);
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Server error try again!');
        }
    }

    // add in cart
    public function productAddCart(Request $request)
    {
        try {
            // if exit product in cart
            $color = Variant::find($request->variant_id);
            $product = Product::find($request->product_id);

            $oldCart = Cart::where('user_id', Auth::id())
                ->where('product_id', $request->product_id)
                ->where('size', $request->size)
                ->where('color', $color->name)
                ->first();

            if ($oldCart) {
                return redirect()->to(url()->previous())->with('error', 'This product already in cart!');
            }

            // cehck stock
            if ($color->stock <= 0) {
                return redirect()->to(url()->previous())->with('error', 'No more stock in this items!');
            }

            if ($color->stock < $request->qty) {
                return redirect()->to(url()->previous())->with('error', 'Max Quantity in stock ' . $color->stock . ' Pc');
            }

            $cart = new Cart();
            $cart->user_id = Auth::id();
            $cart->product_id = $request->product_id;
            $cart->category_id = $request->category_id;
            $cart->size = $request->size;
            $cart->price = $product->gross_price;
            $cart->discount = $product->discount ?? 0;
            $cart->color = $color->name;
            $cart->varaint_id = $request->variant_id;
            $cart->stock = $request->qty ?? 1;
            $cart->save();

            return redirect()->back()->with('success', 'Product added in cart');
        } catch (\Throwable $th) {
            return redirect()->to(url()->current())->with('error', 'Server error try again!');
        }
    }

    // add in cart by scanner
    public function productAddCartByscanner(Request $request)
    {
        try {
            // if exit product in cart
            $color = Variant::find($request->variant_id);
            $product = Product::where('product_no', $request->product_id)->first();
            $size = Variant::find($color->parent_id);

            // dd($color, $size, $product);

            $oldCart = Cart::where('user_id', Auth::id())
                ->where('product_id', $product->id)
                ->where('size', $size->name)
                ->where('color', $color->name)
                ->first();

            if ($oldCart) {
                return redirect()->to(url()->previous())->with('error', 'This product already in cart!');
            }

            // cehck stock
            if ($color->stock <= 0) {
                return redirect()->to(url()->previous())->with('error', 'No more stock in this items!');
            }

            if ($color->stock < 1) {
                return redirect()->to(url()->previous())->with('error', 'Max Quantity in stock ' . $color->stock . ' Pc');
            }

            $cart = new Cart();
            $cart->user_id = Auth::id();
            $cart->product_id = $product->id;
            $cart->category_id = $product->category_id;
            $cart->size = $size->name;
            $cart->price = $product->gross_price;
            $cart->discount = $product->discount ?? 0;
            $cart->color = $color->name;
            $cart->varaint_id = $request->variant_id;
            $cart->stock = 1;
            $cart->save();

            return redirect()->back()->with('success', 'Product added in cart');
        } catch (\Throwable $th) {
            return redirect()->back()->with('error', 'Server error try again!' . $th->getMessage());
        }
    }

    // deleted
    public function destroy($id)
    {
        try {
            Cart::find($id)->delete();

            return redirect()->to(url()->previous())->with('success', 'One items remove from cart!');
        } catch (\Exception $th) {
            return redirect()->to(url()->previous())->with('error', 'Server error try again!');
        }
    }

    // update cart
    public function updatecat(Request $request)
    {
        try {
            $data = $request->cart;
            $errors = [];

            // Validation
            foreach ($data as $value) {
                $product = Product::find($value['product_id']);
                $cart = Cart::find($value['id']);
                $stock = Variant::find($cart->varaint_id);

                if ($value['stock'] > $stock->stock) {
                    $errors[] = "Product {$product->name} has only {$stock->stock} in stock, you requested {$value['stock']}.";
                    continue;
                }

                if ($value['discount'] < 0 || $value['discount'] > 100) {
                    $errors[] = "Product {$product->name} discount must be between 0 and 100.";
                    continue;
                }
            }

            // যদি error থাকে, redirect back
            if (!empty($errors)) {
                return redirect()->route('sales.add')
                    ->with('error', $errors);
            }

            // Update Cart
            foreach ($data as $value) {
                $cart = Cart::find($value['id']);
                if ($cart) {
                    $cart->stock = $value['stock'];
                    $cart->discount = $value['discount'] ?? 0;
                    $cart->save();
                }
            }

            return redirect()->back()->with('success', 'Cart updated successfully.');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Server error. Try again.');
        }
    }

    // clear cart
    public function clearCat()
    {
        try {
            Cart::where('user_id', Auth::id())->delete();

            return redirect()->back()->with('success', 'Cart clear success');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', "Server error try again.");
        }
    }

    // add customer
    public function customer_store(Request $request)
    {
        $request->validate([
            'customer_name' => 'required',
            'phone' => 'required|min:11',
            'address' => 'nullable|min:2'
        ]);

        try {
            $q = new Customer();
            $q->customer_name = $request->customer_name;
            $q->phone = $request->phone;
            $q->address = $request->address;
            $q->save();

            return redirect()->back()->with('success', 'New customer added success');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Server error try again!');
        }
    }

    // sales done
    public function salesDone(Request $request)
    {
        $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'customer_name' => 'required_if:customer,true',
            'customer_phone' => 'required_if:customer,true'
        ]);

        try {
            // check payment 
            $totalPay = 0;
            if ($request->payments) {
                foreach ($request->payments as $item) {
                    if (!empty($item['amount']) || (int) $item['amount'] >= 0) {
                        $totalPay += (float) $item['amount'];
                    } else {
                        return redirect()->back()->with('error', $item['system'] . ' payment system empty here.');
                    }
                }
            }

            // grand total
            $grandTotal = Cart::where("user_id", Auth::id())
                ->get()
                ->sum(function ($cart) {
                    $discountedPrice = $cart->price - ($cart->price * $cart->discount / 100);
                    return $discountedPrice * $cart->stock;
                });

            // if exchange
            if ($request->exchangeid) {
                if (!$request->exchangedata) {
                    return redirect()->back()->with('error', 'Before exchange select old product');
                }
            }

            // if type extra amount
            if ($request->exchangeid) {
                $q = SalesList::where('sales_id', $request->exchangeid)->first();
                $extraCash = ((float) $q->grandtotal - (float) $request->oldprice) - (float) $q->paytotal;
                $canMisun = abs($extraCash) > 0 ? abs($extraCash) : 0;
                $needAmount = $grandTotal - $canMisun;

                if ((float) $totalPay > (float) $needAmount) {
                    return redirect()->back()
                        ->with(
                            'error',
                            'The amount cannot be greater than the grand total: ' . $needAmount . ' Tk'
                        );
                }
            } else {
                if ($totalPay > (float) $grandTotal) {
                    return redirect()->back()
                        ->with(
                            'error',
                            'The amount cannot be greater than the grand total: ' . $grandTotal . ' Tk'
                        );
                }
            }

            // make product json
            $cart = Cart::where('user_id', Auth::id())->with(['product', 'category'])->get();
            if ($cart->isEmpty()) {
                return redirect()->back()->with('error', 'No product in cart');
            }
            // make products jsno
            $cartData = $cart->map(function ($item) {
                return [
                    'name' => $item->product->name,
                    'product_no' => $item?->product?->product_no,
                    'price' => $item->price,
                    'discount' => $item->discount,
                    'qty' => $item->stock,
                    'size' => $item->size ?? null,
                    'color' => $item->color ?? null,
                    'variant_id' => $item->varaint_id ?? null,
                    'product_id' => $item->product_id ?? null
                ];
            });

            // create nww customer
            $newCustomerId = null;
            if (!$request->exchangeid && empty($request->exchangeid) && $request->customer == true) {
                $nc = new Customer();
                $nc->customer_name = $request->customer_name;
                $nc->phone = $request->customer_phone;
                $nc->address = $request->customer_address;
                $nc->save();

                $newCustomerId = $nc->id;
            }

            // store sales
            $salesID = $this->generateDailyUniqueId();
            $q = $request->exchangeid ? SalesList::where('sales_id', $request->exchangeid)->first() : new SalesList();
            if (!$request->exchangeid && empty($request->exchangeid)) {
                $q->created_by = Auth::user()->id;
                $q->sales_id = $salesID;
                $q->products = json_encode($cartData);

                if (!$request->exchangeid && empty($request->exchangeid) && $request->customer == true && $newCustomerId) {
                    $q->customer = $newCustomerId;
                } else {
                    $q->customer = $request->customer_id;
                }

                $q->paytotal = (float) $totalPay;

                if ($request->trime) {
                    $q->grandtotal = $totalPay;
                    $q->nextdue = 0;
                } else {
                    $q->grandtotal = $grandTotal;
                    $q->nextdue = $grandTotal - $totalPay;
                }
            }

            if ($request->exchangeid) {
                $q->exproducts = json_encode([
                    'old' => $request->exchangedata,
                    'new' => $cartData
                ]);
                $q->status = 'exhance';

                // grand total
                $totalPayment = (float) $q->paytotal + (float) $totalPay;
                $grandTotalWithEx = ((float) $grandTotal + (float) $q->grandtotal) - (float) $request->oldprice;

                $q->paytotal = (float) $totalPayment;
                if ($request->trime) {
                    $q->grandtotal = $grandTotalWithEx;
                    $q->nextdue = 0;
                } else {
                    $q->grandtotal = $grandTotalWithEx;
                    $q->nextdue = $grandTotalWithEx - $totalPayment;
                }
            }

            // payment
            $payments = collect($request->payments)
                ->map(function ($payment) {
                    $payment['date'] = now()->toDateString();
                    return $payment;
                })
                ->toArray();
            $oldPayments = $q->pay ? json_decode($q->pay, true) : [];
            $newPayments = array_merge($oldPayments, $payments);
            $q->pay = json_encode($newPayments);
            $q->save();

            // add stck
            foreach ($request->exchangedata as $item) {
                $va = Variant::find($item['variant_id']);
                $newStock = (int) $va->stock + (int) $item['qty'];
                $va->stock = $newStock;
                $va->save();
            }

            // stock manage
            foreach ($cart as $item) {
                $va = Variant::find($item->varaint_id);
                $newStock = (int) $va->stock - (int) $item->stock;
                $va->stock = $newStock;

                $va->save();
            }

            // clear crat after success
            Cart::where('user_id', Auth::id())->delete();

            if ($request->exchangeid) {
                $invoiceId = SalesList::where('sales_id', $request->exchangeid)->value('id');
                return redirect()->route('sales.list.all', ['salesid' => $invoiceId])->with('success', "Exhance complate");
            } else {
                return redirect()->route('sales.add', ['salesid' => $q->id])->with('success', "Payment complate");
            }
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Server error try again!' . $th->getMessage());
        }
    }

    // genrate sales id
    function generateDailyUniqueId()
    {
        // Prefix সহ তারিখ (যেমন: ORD251006)
        $datePrefix = env('SHOP_PREFIX') . now()->format('ymd'); // উদাহরণ: ORD251006

        // আজকের সর্বশেষ আইডি বের করো (prefix + আজকের দিন অনুযায়ী)
        $last = DB::table('sales_lists')
            ->where('sales_id', 'like', $datePrefix . '%')
            ->orderBy('sales_id', 'desc')
            ->first();

        // নতুন সিরিয়াল নাম্বার নির্ধারণ
        if ($last && isset($last->sales_id)) {
            $lastNumber = (int) substr($last->sales_id, strlen($datePrefix));
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        // prefix বাদে কয়টা digit serial হবে সেটা বের করো
        $serialLength = max(6 - strlen(env('SHOP_PREFIX')) - 6, 2); // অন্তত 2 digit রাখো

        // Final ID তৈরি করো
        $newId = $datePrefix . str_pad($nextNumber, $serialLength, '0', STR_PAD_LEFT);

        return $newId;
    }
}
