import React from 'react'
import PageHeader from '../../components/PageHeader'
import Image from '../../components/Image'
import { useForm, usePage } from '@inertiajs/react'

export default function Profile() {
    const { auth } = usePage().props

    // handle form
    const { data, setData, errors, processing, post } = useForm({
        profile: '',
        name: auth.name || '',
        phone_no: auth.phone || '',
        address: auth.address || ''
    })

    const handleUpdate = (e) => {
        e.preventDefault()
        post(route('profile.update'), data)
    }


    return (
        <div className='bg-white rounded-box p-5'>
            <PageHeader
                title="Update Your Profile"
                subtitle="Keep your details fresh and make your account truly yours."
            />

            {/* form */}
            <form onSubmit={handleUpdate} className='space-y-4'>
                <div>
                    <div className='flex items-center gap-4'>
                        <div className="avatar">
                            <div className="ring-primary ring-offset-base-100 w-15 rounded-full ring-2 ring-offset-2">
                                <Image path={auth.profile} />
                            </div>
                        </div>
                        <input onChange={(e) => setData('profile', e.target.files[0])} type="file" accept='image/*' className="file-input file-input-ghost" />
                    </div>
                    {errors.profile && <div className="text-red-600">{errors.profile}</div>}
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Your Name*</legend>
                        <input value={data.name} onChange={(e) => setData('name', e.target.value)} type="text" className="input" placeholder="Type here" />
                        {errors.name && <div className="text-red-600">{errors.name}</div>}
                    </fieldset>
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Your Phone</legend>
                        <input value={data.phone_no} onChange={(e) => setData('phone_no', e.target.value)} type="tel" className="input" placeholder="Type here" />
                        {errors.phone_no && <div className="text-red-600">{errors.phone_no}</div>}
                    </fieldset>
                </div>
                <fieldset className="fieldset">
                    <legend className="fieldset-legend">Address</legend>
                    <textarea value={data.address} onChange={(e) => setData('address', e.target.value)} className="textarea h-24" placeholder="Address"></textarea>
                    {errors.address && <div className="text-red-600">{errors.address}</div>}
                </fieldset>

                <button disabled={processing} type='submit' className='btn btn-primary'>
                    Save Change
                </button>
            </form>
        </div>
    )
}
