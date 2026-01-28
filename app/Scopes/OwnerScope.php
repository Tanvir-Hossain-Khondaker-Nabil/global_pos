<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class OwnerScope implements Scope
{
    public function apply(Builder $builder, Model $model)
    {
        if (!Auth::check()) return;

        $user = Auth::user();

        // Super Admin হলে tenant scope skip
        if (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) return;

        // owner_id কলাম থাকলেই apply
        $builder->where($model->qualifyColumn('owner_id'), $user->ownerId());
    }
}
