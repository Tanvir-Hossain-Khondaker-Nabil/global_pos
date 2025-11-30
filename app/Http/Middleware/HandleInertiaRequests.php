<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Define the props that are shared by default.
     */
    public function share(Request $request): array
    {
        $availableLocales = [
            'en' => ['name' => 'English', 'native' => 'English'],
            'bn' => ['name' => 'Bengali', 'native' => 'বাংলা']
        ];

        return array_merge(parent::share($request), [
            'locale' => fn () => App::getLocale(),
            'availableLocales' => fn () => $availableLocales,
            'language' => fn () => $this->getLanguageStrings(App::getLocale()),
            'flash' => [
                'error' => fn () => $request->session()->get('error'),
                'success' => fn () => $request->session()->get('success'),
            ],
            'auth' => $request->user() ? [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'type' => $request->user()->type,
                'role' => $request->user()->role,
                'profile' => $request->user()->profile,
            ] : null,
            'currentRoute' => Route::currentRouteName(),
            'appName' => config('app.name'),
        ]);
    }

    /**
     * Get language strings for the current locale
     */
    protected function getLanguageStrings($locale)
    {
        $translations = [];
        
        $langPath = resource_path("lang/{$locale}");
        
        if (is_dir($langPath)) {
            foreach (glob("{$langPath}/*.php") as $file) {
                $filename = pathinfo($file, PATHINFO_FILENAME);
                $translations[$filename] = require $file;
            }
        }
        
        return $translations;
    }
}