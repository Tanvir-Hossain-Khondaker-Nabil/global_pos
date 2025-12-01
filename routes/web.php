<?php

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\SectorController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\PaymentController;
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
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\DealershipController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\SubscriptionController;

// Guest routes
Route::middleware('guest')->controller(AuthController::class)->group(function () {
    Route::get('/', 'loginView')->name('login');
    Route::post('/login', 'login')->name('login.post');
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
    Route::controller(SalesController::class)->prefix('/sales')->group(function () {

        Route::get('/add', 'createPos')->name('sales.add');
        Route::post('/store', 'store')->name('sales.store');
        Route::post('/store/shadow', 'shadowStore')->name('salesShadow.store');

        Route::get('/create', 'create')->name('sales.create');
        Route::get('/', 'index')->name('sales.index');
        Route::get('/list/{pos}', 'index')->name('salesPos.index');


        Route::get('/{sale}', 'show')->name('sales.show');
        Route::get('/{sale}/{print}', 'show')->name('salesPrint.show');
        Route::get('/{sale}/print', 'print')->name('sales.print');
        Route::get('/{sale}/download-pdf', 'downloadPdf')->name('sales.download.pdf');
        Route::delete('/{sale}', 'destroy')->name('sales.destroy');


        Route::delete('/sales-items/{id}', 'destroy')->name('sales.items.destroy');


    });


    Route::get('/items/{id}', [SalesController::class, 'showItem'])->name('sales.items.show');
    Route::get('/sales-items', [SalesController::class, 'allSalesItems'])->name('salesItems.list');
    Route::get('/{sale}/edit', [SalesController::class, 'edit'])->name('sales.edit');
    Route::patch('/{sale}/update', [SalesController::class, 'update'])->name('sales.update');
    Route::delete('/{sale}/rejected', [SalesController::class, 'rejected'])->name('sales.rejected');
    Route::post('/sales/{sale}/payments', [SalesController::class, 'storePayment'])->name('sales.payments.store');




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
        Route::get('/expense/category', 'category')->name('expenses.category');
        Route::post('/expense/category', 'categoryStore')->name('expenses.category.store');

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

    //payment routes
    Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
    Route::get('/payments/{payment}', [PaymentController::class, 'show'])->name('payments.show');



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
    Route::get('/purchases_items', [PurchaseController::class, 'allPurchasesItems'])->name('purchase.items');

    Route::get('/purchase/create', [PurchaseController::class, 'create'])->name('purchase.create');
    Route::post('/purchase/store', [PurchaseController::class, 'store'])->name('purchase.store');
    Route::get('/purchase/{id}', [PurchaseController::class, 'show'])->name('purchase.show');
    Route::patch('/purchase/{id}/payment', [PurchaseController::class, 'updatePayment'])->name('purchase.updatePayment');
    Route::patch('/purchase/{id}/approve', [PurchaseController::class, 'approve'])->name('purchase.approve');
    Route::delete('/purchase/{id}', [PurchaseController::class, 'destroy'])->name('purchase.destroy');

    Route::post('/toggle-user-type', [UserController::class, 'toggleUserType'])->name('user.toggle.type');

    Route::patch('/purchases/{id}/update-payment', [PurchaseController::class, 'updatePayment'])->name('purchase.updatePayment');
    Route::patch('/purchases/{id}/approve', [PurchaseController::class, 'approve'])->name('purchase.approve');

    Route::get('/purchase/statistics', [PurchaseController::class, 'getStatistics'])->name('purchase.statistics');
    Route::get('/purchase/recent', [PurchaseController::class, 'getRecentPurchases'])->name('purchase.recent');
    Route::get('/purchase/{id}/export-pdf', [PurchaseController::class, 'exportPdf'])->name('purchase.exportPdf');



    Route::post('/switch-locale', [Controller::class, 'switchLocale'])->name('locale.switch');

    Route::get('/lang/{locale}', [Controller::class, 'setLang'])->name('lang.switch');

    Route::get('/current-lang', [Controller::class, 'getLang'])->name('lang.current');

    Route::resource('companies', CompanyController::class)->names([
        'index' => 'companies.index',
        'create' => 'companies.create',
        'store' => 'companies.store',
        'show' => 'companies.show',
        'edit' => 'companies.edit',
        'update' => 'companies.update',
        'destroy' => 'companies.destroy',
    ]);

    Route::resource('dealerships', DealershipController::class)->names([
        'index' => 'dealerships.index',
        'create' => 'dealerships.create',
        'store' => 'dealerships.store',
        'show' => 'dealerships.show',
        'edit' => 'dealerships.edit',
        'update' => 'dealerships.update',
        'destroy' => 'dealerships.destroy',
    ]);
    Route::post('/dealerships/{dealership}/approve', [DealershipController::class, 'approve'])->name('dealerships.approved');


    Route::resource('plans', PlanController::class)->names([
        'index' => 'plans.index',
        'create' => 'plans.create',
        'store' => 'plans.store',
        'show' => 'plans.show',
        'edit' => 'plans.edit',
        'update' => 'plans.update',
        'destroy' => 'plans.destroy',
    ]);


    Route::resource('subscriptions', SubscriptionController::class)->names([
        'index' => 'subscriptions.index',
        'create' => 'subscriptions.create',
        'store' => 'subscriptions.store',
        'show' => 'subscriptions.show',
        'edit' => 'subscriptions.edit',
        'update' => 'subscriptions.update',
        'destroy' => 'subscriptions.destroy',
    ]);

    Route::post('/subscriptions/{subscription}/renew', [SubscriptionController::class, 'renew'])->name('subscriptions.renew');
    Route::get('/subscriptions_payments', [SubscriptionController::class, 'payment'])->name('subscriptions.payments');
    Route::get('/subscriptions_payments/view/{id}', [SubscriptionController::class, 'paymentView'])->name('subscriptions.payments.view');


});



Route::post('/switch-locale', [Controller::class, 'switchLocale'])->name('locale.switch');

Route::get('/lang/{locale}', [Controller::class, 'setLang'])->name('lang.switch');

Route::get('/current-lang', [Controller::class, 'getLang'])->name('lang.current');

require __DIR__ . '/command.php';


