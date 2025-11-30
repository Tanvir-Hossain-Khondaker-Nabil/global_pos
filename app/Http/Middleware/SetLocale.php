<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;

class SetLocale
{
    public function handle(Request $request, Closure $next)
    {
        // Check session first, then cookie, then fallback to config
        if (Session::has('locale')) {
            $locale = Session::get('locale');
        } elseif ($request->hasCookie('locale')) {
            $locale = $request->cookie('locale');
            Session::put('locale', $locale);
        } else {
            $locale = config('app.locale', 'en');
        }

        // Validate and set locale
        if (in_array($locale, ['en', 'bn'])) {
            App::setLocale($locale);
        }

        return $next($request);
    }
}