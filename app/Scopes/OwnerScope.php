<?php
// App\Scopes\OwnerScope.php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class OwnerScope implements Scope
{
    public function apply(Builder $builder, Model $model)
    {
        if (!Auth::check()) return;

        $user = Auth::user();

        if (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) {
            return;
        }

        $table = $model->getTable();

        // যদি owner_id থাকে
        if (Schema::hasColumn($table, 'owner_id')) {
            $builder->where(
                $model->qualifyColumn('owner_id'),
                $user->ownerId()
            );
            return;
        }

        // fallback → created_by
        if (Schema::hasColumn($table, 'created_by')) {
            $builder->where(
                $model->qualifyColumn('created_by'),
                $user->id
            );
        }
    }
}

