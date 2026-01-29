<?php

namespace App\Models\Concerns;

use App\Scopes\OwnerScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant()
    {
        static::addGlobalScope(new OwnerScope);
        static::addGlobalScope(new OutletScope);

        static::creating(function ($model) {

            if (!Auth::check()) return;

            $user = Auth::user();

            if (
                Schema::hasColumn($model->getTable(), 'owner_id') &&
                ($model->isFillable('owner_id') || isset($model->owner_id))
            ) {
                $model->owner_id = $user->ownerId();
            }

            if (
                Schema::hasColumn($model->getTable(), 'outlet_id') &&
                ($model->isFillable('outlet_id') || isset($model->outlet_id)) &&
                $user->current_outlet_id
            ) {
                $model->outlet_id = $user->current_outlet_id;
            }

            if (
                Schema::hasColumn($model->getTable(), 'created_by') &&
                ($model->isFillable('created_by') || isset($model->created_by))
            ) {
                $model->created_by = $user->id;
            }
        });

        static::updating(function ($model) {

            if (Schema::hasColumn($model->getTable(), 'owner_id')) {
                if ($model->getOriginal('owner_id') !== null) {
                    $model->owner_id = $model->getOriginal('owner_id');
                }
            }

            if (Schema::hasColumn($model->getTable(), 'outlet_id')) {
                if ($model->getOriginal('outlet_id') !== null) {
                    $model->outlet_id = $model->getOriginal('outlet_id');
                }
            }
        });
    }
}
