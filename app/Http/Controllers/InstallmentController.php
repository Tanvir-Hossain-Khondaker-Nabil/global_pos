<?php

namespace App\Http\Controllers;

use App\Models\Installment;
use Illuminate\Http\Request;

class InstallmentController extends Controller
{
    

    public function getInstallment(Request $request, $id)
    {
        $installments = Installment::orWhere('sale_id', $id)
        ->orWhere('purchase_id', $id)
        ->get();

        return inertia('Installments/ShowInstallment', [
            'installments' => $installments,
        ]);
    }



}
