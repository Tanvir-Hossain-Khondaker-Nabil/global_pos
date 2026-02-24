<?php

namespace App\Http\Middleware;

use App\Models\System;
use App\Models\User;
use Closure;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSystemHold
{
    public function handle(Request $request, Closure $next): Response
    {
        $system = System::find(1);
        $user = Auth::user();
        $user = User::findOrFail($user->id);

        if ($user->isSuperAdmin()) {
            return $next($request);
        } else {

            if ($system && $system->status == 'inactive') {
                abort(
                    503,
                    $system->hold_reason ?? 'System is temporarily unavailable.'
                );
            }
        }

        return $next($request);
    }
}
