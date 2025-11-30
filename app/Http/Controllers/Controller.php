<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    protected $availableLocales = [
        'en' => ['name' => 'English', 'native' => 'English'],
        'bn' => ['name' => 'Bengali', 'native' => 'বাংলা']
    ];

    public function __construct()
    {
        $this->shareInertiaData();
    }

    protected function shareInertiaData()
    {
        $locale = App::getLocale();
        
        Inertia::share([
            'locale' => $locale,
            'language' => $this->getLanguageStrings($locale),
            'availableLocales' => $this->availableLocales,
        ]);
    }

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
     * Set language locale - PROPER FIX
     */
    public function switchLocale(Request $request)
    {
        $locale = $request->input('locale');
        
        if (array_key_exists($locale, $this->availableLocales)) {
            Session::put('locale', $locale);
            App::setLocale($locale);
            
            $updatedLanguage = $this->getLanguageStrings($locale);
            
            return Inertia::render($this->getCurrentPage($request), [
                'locale' => $locale,
                'language' => $updatedLanguage,
                'flash' => [
                    'success' => "Language changed to {$locale}"
                ]
            ]);
        }
        
        return back()->with('error', 'Invalid language');
    }

    /**
     * Helper to get current page component and props
     */
    protected function getCurrentPage(Request $request)
    {
        $page = $request->header('X-Inertia-Current-Component');
        $props = $request->header('X-Inertia-Current-Props');
        
        if ($page) {
            return $page;
        }
        
        return 'Dashboard';
    }

    public function getLang()
    {
        return response()->json([
            'locale' => App::getLocale(),
            'session_locale' => Session::get('locale'),
            'language' => $this->getLanguageStrings(App::getLocale()),
        ]);
    }
}