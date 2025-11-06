<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BarcodePrintController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExchangeController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\ExtraCashController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\SalesListController;
use App\Http\Controllers\SectorController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Guest routes
Route::middleware('guest')->controller(AuthController::class)->group(function () {
    Route::get('/', 'loginView')->name('login');
    Route::post('/login', 'login')->name('login.post');
});


// auth routes
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('home');

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

    // products
    Route::controller(ProductController::class)->prefix('/product')->group(function () {
        Route::get('/', 'index')->name('product.list');
        Route::get('/add', 'add_index')->name('product.add');
        Route::post('/add', 'update')->name('product.add.post');
        Route::get('/del/{id}', 'del')->name('product.del');
    });

    // sales
    Route::controller(SalesController::class)->group(function () {
        Route::get('/add', 'addView')->name('sales.add');
        Route::post('/add/product/varaint', 'productVaraint')->name('sales.add.varaint');
        Route::post('/add/product-cart', 'productAddCart')->name('sales.add.cart');
        Route::post('/add/product-cart-scanner', 'productAddCartByscanner')->name('sales.add.cart.scanner');
        Route::get('/add/cart-de;/{id}', 'destroy')->name('sales.dele');
        Route::get('/add/clear', 'clearCat')->name('sales.cart.clear');
        Route::post('/add/cart/update', 'updatecat')->name('sales.cart.update');
        Route::post('/add/done', 'salesDone')->name('sales.done');
        Route::post('/add/customer/add', 'customer_store')->name('sales.cart.customer.add');
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
});
