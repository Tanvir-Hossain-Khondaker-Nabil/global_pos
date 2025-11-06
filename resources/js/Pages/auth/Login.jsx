import React from 'react'
import GuestLayout from '../../layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

function Login() {

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
    <div>
      {/* login form */}
      <form onSubmit={handleLogin}>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Email*</legend>
          <input value={data.email} onChange={(e) => setData('email', e.target.value)} type="email" className="input" placeholder="Enter email" />
          {errors.email && <div className="text-red-600">{errors.email}</div>}
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Password*</legend>
          <input value={data.password} onChange={(e) => setData('password', e.target.value)} type="password" className="input" placeholder="Enter password" />
          {errors.password && <div className="text-red-600">{errors.password}</div>}
        </fieldset>
        <label className="label mt-4">
          <input type="checkbox" onChange={(e) => setData("remember", e.target.checked)} checked={data.remember} className="checkbox checkbox-sm" />
          Remember me
        </label>
        <button type='submit' disabled={processing} className="btn btn-primary w-full mt-4">Login</button>
      </form>

      {/* page title */}
      <Head title='Login account' />
    </div>
  )
}

Login.layout = (page) => <GuestLayout>{page}</GuestLayout>;
export default Login