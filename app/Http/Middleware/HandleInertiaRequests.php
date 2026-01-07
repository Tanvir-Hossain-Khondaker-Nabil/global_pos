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

        // Load user with relationships
        if ($user) {
            // Eager load the current outlet relationship
            $user->load('currentOutlet');
            
            // Debug log
            logger()->info('Current outlet ID: ' . $user->current_outlet_id);
            logger()->info('Current outlet loaded: ' . ($user->currentOutlet ? 'Yes' : 'No'));
            logger()->info($user->getAllPermissions()->pluck('name'));
        }

        // Get current outlet data
        $currentOutlet = null;
        $availableOutlets = [];
        $isLoggedIntoOutlet = false;
        $outletLoggedInAt = null;

        if ($user) {
            // Load current outlet with relationship
            if ($user->currentOutlet) {
                $currentOutlet = [
                    'id' => $user->currentOutlet->id,
                    'name' => $user->currentOutlet->name,
                    'code' => $user->currentOutlet->code,
                    'phone' => $user->currentOutlet->phone,
                    'email' => $user->currentOutlet->email,
                    'address' => $user->currentOutlet->address,
                    'currency' => $user->currentOutlet->currency,
                    'timezone' => $user->currentOutlet->timezone,
                    'is_active' => $user->currentOutlet->is_active,
                    'is_main' => $user->currentOutlet->is_main,
                    'formatted_address' => $user->currentOutlet->formatted_address,
                    'created_at' => $user->currentOutlet->created_at ? $this->formatDate($user->currentOutlet->created_at) : null,
                    'updated_at' => $user->currentOutlet->updated_at ? $this->formatDate($user->currentOutlet->updated_at) : null,
                ];
            }

            // Check if user is logged into an outlet
            $isLoggedIntoOutlet = !is_null($user->current_outlet_id) && $user->current_outlet_id > 0;

            // Handle outlet_logged_in_at (could be string or Carbon instance)
            if ($user->outlet_logged_in_at) {
                try {
                    if ($user->outlet_logged_in_at instanceof \Carbon\Carbon) {
                        $outletLoggedInAt = $user->outlet_logged_in_at->format('Y-m-d H:i:s');
                    } else {
                        // If it's a string, parse it first
                        $outletLoggedInAt = Carbon::parse($user->outlet_logged_in_at)->format('Y-m-d H:i:s');
                    }
                } catch (\Exception $e) {
                    $outletLoggedInAt = null;
                }
            }

            // Get all available outlets for this user
            if ($user->relationLoaded('availableOutlets')) {
                $availableOutlets = $user->availableOutlets->map(function ($outlet) {
                    return [
                        'id' => $outlet->id,
                        'name' => $outlet->name,
                        'code' => $outlet->code,
                        'phone' => $outlet->phone,
                        'email' => $outlet->email,
                        'address' => $outlet->address,
                        'is_active' => $outlet->is_active,
                        'is_main' => $outlet->is_main,
                        'created_at' => $outlet->created_at ? $this->formatDate($outlet->created_at) : null,
                    ];
                })->toArray();
            } else {
                // If not loaded, manually load
                $availableOutlets = \App\Models\Outlet::where('user_id', $user->id)
                    ->get()
                    ->map(function ($outlet) {
                        return [
                            'id' => $outlet->id,
                            'name' => $outlet->name,
                            'code' => $outlet->code,
                            'phone' => $outlet->phone,
                            'email' => $outlet->email,
                            'address' => $outlet->address,
                            'is_active' => $outlet->is_active,
                            'is_main' => $outlet->is_main,
                            'created_at' => $outlet->created_at ? $this->formatDate($outlet->created_at) : null,
                        ];
                    })->toArray();
            }
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
                    $user->only(['id', 'name', 'email', 'type', 'role', 'profile', 'current_outlet_id']),
                    [
                        'roles' => $user->getRoleNames(),
                        'permissions' => $user->getAllPermissions()->pluck('name'),
                        // Outlet related data
                        'current_outlet' => $currentOutlet,
                        'available_outlets' => $availableOutlets,
                        'is_logged_into_outlet' => $isLoggedIntoOutlet,
                        'outlet_logged_in_at' => $outletLoggedInAt,
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

            // Additional shared outlet data
            'outlet' => [
                'current' => $currentOutlet,
                'is_active' => $isLoggedIntoOutlet,
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

    /**
     * Format date safely (handles string and Carbon instances)
     */
    protected function formatDate($date)
    {
        if (!$date) {
            return null;
        }

        try {
            if ($date instanceof \Carbon\Carbon) {
                return $date->format('Y-m-d H:i:s');
            } else {
                return Carbon::parse($date)->format('Y-m-d H:i:s');
            }
        } catch (\Exception $e) {
            return null;
        }
    }

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }
}