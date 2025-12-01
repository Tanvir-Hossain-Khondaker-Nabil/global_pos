import React from 'react'
import GuestLayout from '../../layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { useTranslation } from "../../hooks/useTranslation";

function Login() {
    const { t, locale } = useTranslation();

    // form handle
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false
    })

    const handleLogin = (e) => {
        e.preventDefault();
        post(route('login.post'), data);
    }

    return (
        <div className={locale === 'bn' ? 'bangla-font' : ''}>
            {/* login form */}
            <form onSubmit={handleLogin}>
                <fieldset className="fieldset">
                    <legend className="fieldset-legend">
                        {t('auth.email', 'Email')}*
                    </legend>
                    <input 
                        value={data.email} 
                        onChange={(e) => setData('email', e.target.value)} 
                        type="email" 
                        className="input" 
                        placeholder={t('auth.enter_email', 'Enter email')} 
                    />
                    {errors.email && <div className="text-red-600">{errors.email}</div>}
                </fieldset>
                <fieldset className="fieldset">
                    <legend className="fieldset-legend">
                        {t('auth.password', 'Password')}*
                    </legend>
                    <input 
                        value={data.password} 
                        onChange={(e) => setData('password', e.target.value)} 
                        type="password" 
                        className="input" 
                        placeholder={t('auth.enter_password', 'Enter password')} 
                    />
                    {errors.password && <div className="text-red-600">{errors.password}</div>}
                </fieldset>
                <label className="label mt-4">
                    <input 
                        type="checkbox" 
                        onChange={(e) => setData("remember", e.target.checked)} 
                        checked={data.remember} 
                        className="checkbox checkbox-sm" 
                    />
                    {t('auth.remember_me', 'Remember me')}
                </label>
                <button 
                    type='submit' 
                    disabled={processing} 
                    className="btn btn-primary w-full mt-4"
                >
                    {processing ? 'Logging in...' : t('auth.login_button', 'Login')}
                </button>
            </form>

            {/* page title */}
            <Head title={t('auth.login_title', 'Login account')} />
        </div>
    )
}

Login.layout = (page) => <GuestLayout>{page}</GuestLayout>;
export default Login