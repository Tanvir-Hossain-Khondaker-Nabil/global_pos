import React, { useState, useRef, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';

const LanguageSwitcher = ({ className = '' }) => {
    const { props } = usePage();
    const { locale, availableLocales } = props;
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const switchLanguage = (newLocale) => {
        router.post('/switch-locale', { locale: newLocale }, {
            preserveState: true,
            preserveScroll: true,
        });
        setIsOpen(false);
    };

    return (
        <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
            <div>
                <button
                    type="button"
                    className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className={locale === 'bn' ? 'bangla-font' : ''}>
                        {availableLocales[locale]?.native || 'Select Language'}
                    </span>
                    <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {isOpen && (
                <div className="origin-top-left absolute -right-10 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                        {Object.entries(availableLocales).map(([code, lang]) => (
                            <button
                                key={code}
                                onClick={() => switchLanguage(code)}
                                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${locale === code ? 'bg-gray-50 text-blue-600' : 'text-gray-700'} ${code === 'bn' ? 'bangla-font' : ''}`}
                            >
                                <div className="flex items-center">
                                    <span className="mr-2 text-sm">
                                        {code === 'en' ? '🇺🇸' : code === 'bn' ? '🇧🇩' : '🌐'}
                                    </span>
                                    {lang.native}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;