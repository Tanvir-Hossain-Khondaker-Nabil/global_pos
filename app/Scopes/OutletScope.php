<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class OutletScope implements Scope
{
    public function apply(Builder $builder, Model $model)
    {
        // Only apply scope if user is authenticated and has current outlet
        if (Auth::check() && Auth::user()->current_outlet_id) {
            $builder->where('outlet_id', Auth::user()->current_outlet_id);
        }
    }
}