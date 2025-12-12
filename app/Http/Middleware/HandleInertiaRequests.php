<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Inertia\Middleware;
use App\Models\Requisition;
use Carbon\Carbon;

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

        $user = $request->user();

        // NULL চেক যোগ করুন
        if ($user) {
            logger()->info($user->getAllPermissions()->pluck('name'));
        }

        return array_merge(parent::share($request), [
            'locale' => fn() => App::getLocale(),
            'availableLocales' => fn() => $availableLocales,
            'language' => fn() => $this->getLanguageStrings(App::getLocale()),
            'currentRoute' => Route::currentRouteName(),
            'appName' => config('app.name'),

            // Authentication data - Combined structure
            'auth' => [
                'user' => $user ? array_merge(
                    $user->only(['id', 'name', 'email', 'type', 'role', 'profile']),
                    [
                        'roles' => $user->getRoleNames(),
                        'permissions' => $user->getAllPermissions()->pluck('name'),
                    ]

                ) : null,
            ],

            'can' => $user
                ? $user->getAllPermissions()->pluck('name')->flip()
                : [],

            // Flash messages - Expanded
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
                'warning' => fn() => $request->session()->get('warning'),
                'info' => fn() => $request->session()->get('info'),
            ],
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

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }
}