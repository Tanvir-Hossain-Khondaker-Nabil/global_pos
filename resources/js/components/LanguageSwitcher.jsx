import React from 'react';
import { router, usePage } from '@inertiajs/react';

const LanguageSwitcher = ({ className = '' }) => {
    const { props } = usePage();
    const { locale, availableLocales } = props;

    const switchLanguage = (newLocale) => {
        router.post('/switch-locale', { locale: newLocale }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                console.log('Language switched to:', newLocale);
            },
        });
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>          
            {Object.entries(availableLocales).map(([code, lang]) => {
                const isActive = locale === code;

                return (
                    <button
                        key={code}
                        onClick={() => switchLanguage(code)}
                        type="button"
                        className={`
                            relative px-4 py-2.5 rounded-lg text-sm font-medium 
                            transition-all duration-300 ease-in-out 
                            border-2 backdrop-blur-sm
                            flex items-center justify-center gap-2 min-w-[80px]
                            group hover:scale-105 active:scale-95
                            ${isActive 
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25' 
                                : 'bg-white/80 text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 shadow-sm'
                            }
                            ${code === 'bn' ? 'bangla-font text-[15px]' : ''}
                        `}
                    >
                        {/* Active indicator dot */}
                        {isActive && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full ring-2 ring-blue-500"></span>
                        )}
                        
                        {/* Language flag/icon placeholder */}
                        <span className="text-xs opacity-80">
                            {code === 'en' ? '🇺🇸' : code === 'bn' ? '🇧🇩' : '🌐'}
                        </span>
                        
                        <span className={`${isActive ? 'text-white' : 'text-inherit'}`}>
                            {lang.native}
                        </span>
                        
                        {/* Hover effect */}
                        <div className={`
                            absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 
                            transition-opacity duration-300 -z-10
                            ${isActive 
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700' 
                                : 'bg-gradient-to-r from-blue-50 to-blue-100'
                            }
                        `}></div>
                    </button>
                );
            })}
        </div>
    );
};

export default LanguageSwitcher;