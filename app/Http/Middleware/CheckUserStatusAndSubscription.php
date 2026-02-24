<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckUserStatusAndSubscription
{

    public function handle(Request $request, Closure $next)
    {

        if (Auth::check()) {
            $user = Auth::user();
            $user = User::findOrFail($user->id);

            if ($user->isSuperAdmin()) {
                return $next($request);
            } else {

                if ($user->status === 'inactive' || ! $user->hasValidSubscription()) {
                    Auth::logout();

                    $request->session()->invalidate();
                    $request->session()->regenerateToken();

                    return redirect()
                        ->route('login')
                        ->with('error', 'Your account is inactive and subscription has expired.');
                }
            }
        }

        return $next($request);
    }
}
