import React from "react";
import { usePage } from "@inertiajs/react";
import Invoice from "./Invoice";

export default function Show({ sale, isShadowUser = false, businessProfile }) {
    const { auth } = usePage().props;

    return (
        <div
            user={auth?.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Invoice #{sale?.invoice_no}
                </h2>
            }
        >
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <Invoice
                        sale={sale}
                        isShadowUser={isShadowUser}
                        businessProfile={businessProfile}
                    />
                </div>
            </div>
        </div>
    );
}
