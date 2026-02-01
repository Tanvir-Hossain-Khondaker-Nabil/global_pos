<?php

namespace App\Models\Concerns;

use App\Scopes\CreatedByScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

trait BelongsToCreator
{
    protected static function bootBelongsToCreator()
    {
        static::addGlobalScope(new CreatedByScope);

        static::creating(function ($model) {
            if (!Auth::check()) return;

            if (Schema::hasColumn($model->getTable(), 'created_by')) {
                $model->created_by = Auth::id();
            }
        });

        // created_by পরিবর্তন আটকাতে চাইলে (optional)
        static::updating(function ($model) {
            if (Schema::hasColumn($model->getTable(), 'created_by')) {
                if ($model->getOriginal('created_by') !== null) {
                    $model->created_by = $model->getOriginal('created_by');
                }
            }
        });
    }
}
