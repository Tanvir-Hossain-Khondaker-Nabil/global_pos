<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\SectorController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ExchangeController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\AttributeController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExtraCashController;
use App\Http\Controllers\SalesListController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\BarcodePrintController;

// Guest routes
Route::middleware('guest')->controller(AuthController::class)->group(function () {
    Route::get('/', 'loginView')->name('login');
    Route::post('/login', 'login')->name('login.post');
});


Route::get('/clear', function () {
    Artisan::call('cache:clear');
    Artisan::call('config:clear');
    Artisan::call('config:cache');
    Artisan::call('view:clear');
    return "Cache is cleared";
});


Route::get('/migrate', function () {
    Artisan::call('migrate:fresh --seed');
    return "Database migrated fresh with seeders";
});


Route::get('/module', function () {
    $modules = collect(Route::getRoutes())
        ->map(fn($route) => $route->getName())
        ->filter()
        ->map(fn($name) => explode('.', $name)[0])
        ->unique()
        ->values()
        ->toArray();

    return $modules;
});


Route::get('/actions', function () {

    $actionMap = [
        'index' => 'view',
        'show' => 'view',
        'create' => 'create',
        'store' => 'create',
        'edit' => 'edit',
        'update' => 'edit',
        'destroy' => 'delete',
        'delete' => 'delete'
    ];


    $allActions = collect(Route::getRoutes())
        ->map(fn($route) => $route->getName())
        ->filter()
        ->map(function ($name) use ($actionMap) {

            $parts = explode('.', $name);

            if (count($parts) < 2)
                return null;

            $method = end($parts);

            return $actionMap[$method] ?? null;
        })
        ->filter()
        ->unique()
        ->values()
        ->toArray();

    return $allActions;


});


// auth routes
Route::middleware('auth')->group(function () {
    Route::get('/dashboard/{s?}', [DashboardController::class, 'index'])->name('home');

    // users managment
    Route::controller(UserController::class)->prefix('users')->group(function () {
        Route::get('/', 'index')->name('userlist.view');
        Route::get('/delete/{id}', 'delete')->name('userlist.delete');
        Route::post('/create', 'store')->name('userlist.store');
        Route::get('/create/edit/{id}', 'edit')->name('userlist.edit');
    });

    // customer manage
    Route::controller(CustomerController::class)->prefix('customer')->group(function () {
        Route::get('/', 'index')->name('customer.index');
        Route::post('/add', 'store')->name('customer.store');
        Route::get('/delete/{id}', 'del')->name('customer.del');
        Route::get('/edit/{id}', 'edit')->name('customer.edit');
    });

    // sector
    Route::controller(SectorController::class)->group(function () {
        Route::get('/category', 'category_view')->name('category.view');
        Route::post('/category', 'category_store')->name('category.store');
        Route::get('/category/edit/{id}', 'category_edit')->name('category.edit');
        Route::get('/category/del/{id}', 'category_del')->name('category.del');
    });

    // supplier
    Route::get('/supplier', [SupplierController::class, 'index'])->name('supplier.view');
    Route::post('/supplier', [SupplierController::class, 'store'])->name('supplier.store');
    Route::put('/supplier/update/{id}', [SupplierController::class, 'update'])->name('supplier.update');
    Route::get('/supplier/edit/{id}', [SupplierController::class, 'edit'])->name('supplier.edit');
    Route::delete('/supplier/del/{id}', [SupplierController::class, 'destroy'])->name('supplier.del'); // Changed to DELETE

    // products
    Route::controller(ProductController::class)->prefix('/product')->group(function () {
        Route::get('/', 'index')->name('product.list');
        Route::get('/add', 'add_index')->name('product.add');
        Route::post('/add', 'update')->name('product.add.post');
        Route::get('/del/{id}', 'del')->name('product.del');
    });

    // sales
    Route::controller(SalesController::class)->group(function () {

        Route::get('/sales/add', 'createPos')->name('sales.add');
        Route::post('/sales/store', 'store')->name('sales.store');
        Route::get('/sales/create', 'create')->name('sales.create');
        Route::get('/sales', 'index')->name('sales.index');
        Route::get('/sales/list/{pos}', 'index')->name('salesPos.index');


        Route::get('/sales/{sale}', 'show')->name('sales.show');
        Route::get('/sales/{sale}/{print}', 'show')->name('salesPrint.show');
        Route::get('/sales/{sale}/print', 'print')->name('sales.print');
        Route::get('/sales/{sale}/download-pdf', 'downloadPdf')->name('sales.download.pdf');
        Route::delete('/sales/{sale}', 'destroy')->name('sales.destroy');
        Route::get('/sales/{sale}/edit', 'edit')->name('sales.edit');
        Route::put('/sales/{sale}', 'update')->name('sales.update');




        Route::get('sales/items/list', 'allSalesItems')->name('salesItems.list');
        Route::get('/sales-items/{id}', 'showItem')->name('sales.items.show');
        Route::delete('/sales-items/{id}', 'destroy')->name('sales.items.destroy');



        // Route::post('/add/product/varaint', 'productVaraint')->name('sales.add.varaint');
        // Route::post('/add/product-cart', 'productAddCart')->name('sales.add.cart');
        // Route::post('/add/product-cart-scanner', 'productAddCartByscanner')->name('sales.add.cart.scanner');
        // Route::get('/add/cart-de;/{id}', 'destroy')->name('sales.dele');
        // Route::get('/add/clear', 'clearCat')->name('sales.cart.clear');
        // Route::post('/add/cart/update', 'updatecat')->name('sales.cart.update');
        // Route::post('/add/done', 'salesDone')->name('sales.done');
        // Route::post('/add/customer/add', 'customer_store')->name('sales.cart.customer.add');
    });


    // sales list
    Route::controller(SalesListController::class)->group(function () {
        Route::get('/sales/list', 'index')->name('sales.list.all');
        Route::get('/sales/list/del/{id}', 'delete')->name('sales.list.del');
        Route::post('/sales/list/status', 'status')->name('sales.list.status');
        Route::post('/sales/list/duecollact', 'collactDue')->name('sales.list.duecollact');
    });

    // Expense
    Route::controller(ExpenseController::class)->group(function () {
        Route::get('/expense', 'index')->name('expenses.list');
        Route::post('/expense', 'store')->name('expenses.post');
        Route::get('/expense/{id}', 'distroy')->name('expenses.del');
    });

    // extra cash
    Route::controller(ExtraCashController::class)->group(function () {
        Route::get('/extra-cash', 'index')->name('extra.cash.all');
        Route::post('/extra-cash', 'store')->name('extra.cash.post');
        Route::get('/extra-cash/{id}', 'del')->name('extra.cash.del');
    });

    // profile
    Route::controller(AuthController::class)->group(function () {
        Route::get('/profile', 'profileView')->name('profile.view');
        Route::post('/profile', 'profileUpdate')->name('profile.update');
        Route::get('/security', 'securityView')->name('security.view');
        Route::post('/security', 'securityUpdate')->name('security.post');
        Route::get('/logout', 'logout')->name('logout');
    });

    // barcode
    Route::controller(BarcodePrintController::class)->group(function () {
        Route::get('/print-barcode', 'index')->name('barcode.print');
    });

Route::get('/attributes', [AttributeController::class, 'index'])->name('attributes.index');
Route::post('/attributes', [AttributeController::class, 'store'])->name('attributes.store');
Route::put('/attributes/{attribute}', [AttributeController::class, 'update'])->name('attributes.update');
Route::delete('/attributes/{attribute}', [AttributeController::class, 'destroy'])->name('attributes.destroy');

// Attribute values routes
Route::post('/attributes/{attribute}/values', [AttributeController::class, 'storeValue'])->name('attributes.values.store');
Route::delete('/attributes/{attribute}/values/{value}', [AttributeController::class, 'destroyValue'])->name('attributes.values.destroy');


    // Warehouse Routes
    Route::get('/warehouses', [WarehouseController::class, 'index'])->name('warehouse.list');
    Route::get('/warehouses/create', [WarehouseController::class, 'create'])->name('warehouse.create');
    Route::post('/warehouses', [WarehouseController::class, 'store'])->name('warehouse.store');
    Route::get('/warehouses/{warehouse}', [WarehouseController::class, 'show'])->name('warehouse.show');
    Route::get('/warehouses/{warehouse}/edit', [WarehouseController::class, 'edit'])->name('warehouse.edit');
    Route::put('/warehouses/{warehouse}', [WarehouseController::class, 'update'])->name('warehouse.update');
    Route::delete('/warehouses/{warehouse}', [WarehouseController::class, 'destroy'])->name('warehouse.destroy');

    // Purchase Routes
    Route::get('/purchases', [PurchaseController::class, 'index'])->name('purchase.list');
    Route::get('/purchases/create', [PurchaseController::class, 'create'])->name('purchase.create');
    Route::post('/purchases', [PurchaseController::class, 'store'])->name('purchase.store');
    Route::get('/purchases/{purchase}', [PurchaseController::class, 'show'])->name('purchase.show');
    Route::delete('/purchases/{purchase}', [PurchaseController::class, 'destroy'])->name('purchase.destroy');

    Route::post('/toggle-user-type', [UserController::class, 'toggleUserType'])->name('user.toggle.type');

    Route::patch('/purchases/{id}/update-payment', [PurchaseController::class, 'updatePayment'])->name('purchase.updatePayment');
    Route::patch('/purchases/{id}/approve', [PurchaseController::class, 'approve'])->name('purchase.approve');
});


