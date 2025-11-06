import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Bounce, toast, ToastContainer } from "react-toastify";
import { usePage } from "@inertiajs/react";

export default function Layout({ children }) {
    const { flash } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // make flash message
    useEffect(() => {
        if (flash.error) {
            toast.error(flash.error);
        }
        if (flash.success) {
            toast.success(flash.success);
        }
    }, [flash]);

    return (
        <div className="flex bg-[#f3f2f7] h-screen w-full">
            <Sidebar status={sidebarOpen} setStatus={setSidebarOpen} />
            <div className="w-full overflow-y-auto pb-5">
                <Header
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                />
                <div className="px-6">{children}</div>
            </div>

            <ToastContainer
                position="bottom-right"
                autoClose={1000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
                transition={Bounce}
            />
        </div>
    );
}
