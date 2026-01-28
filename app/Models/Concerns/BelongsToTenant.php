<?php

namespace App\Models\Concerns;

use App\Scopes\OwnerScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant()
    {
        static::addGlobalScope(new OwnerScope);
        static::addGlobalScope(new OutletScope);

        static::creating(function ($model) {
            if (!Auth::check()) return;

            $user = Auth::user();

            // ✅ Tenant owner
            if ($model->isFillable('owner_id') || isset($model->owner_id)) {
                $model->owner_id = $user->ownerId();
            }

            // ✅ Outlet (if user has outlet selected)
            if ($user->current_outlet_id && ($model->isFillable('outlet_id') || isset($model->outlet_id))) {
                $model->outlet_id = $user->current_outlet_id;
            }

            // ✅ Audit: who created
            if ($model->isFillable('created_by') || isset($model->created_by)) {
                $model->created_by = $user->id;
            }
        });

        static::updating(function ($model) {
            // ✅ Lock tenant columns
            if ((isset($model->owner_id) || $model->isFillable('owner_id')) && $model->getOriginal('owner_id') !== null) {
                $model->owner_id = $model->getOriginal('owner_id');
            }

            if ((isset($model->outlet_id) || $model->isFillable('outlet_id')) && $model->getOriginal('outlet_id') !== null) {
                $model->outlet_id = $model->getOriginal('outlet_id');
            }
        });
    }
}
