import React from 'react';
import { router, usePage } from '@inertiajs/react';

const LanguageSwitcher = ({ className = '' }) => {
    const { props } = usePage();
    
    const { locale, availableLocales } = props;

    const switchLanguage = (newLocale) => {
        router.post('/switch-locale', { locale: newLocale }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                // The page props are automatically updated by Inertia
                // No need to reload if you're using the useTranslation hook properly
                console.log('Language switched to:', newLocale);
            },
            onError: (errors) => {
                console.error('Failed to switch language:', errors);
            }
        });
    };

    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            {Object.entries(availableLocales).map(([code, lang]) => (
                <button
                    key={code}
                    onClick={() => switchLanguage(code)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                        locale === code 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    } ${code === 'bn' ? 'bangla-font text-lg' : ''}`}
                    type="button"
                >
                    {lang.native}
                </button>
            ))}
        </div>
    );
};

export default LanguageSwitcher;