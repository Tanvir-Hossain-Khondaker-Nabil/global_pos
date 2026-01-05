import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Bounce, toast, ToastContainer } from "react-toastify";
import { usePage } from "@inertiajs/react";

export default function Layout({ children }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const { flash } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Function to check if user has permission
    const hasPermission = (permission) => {
        if (!user?.permissions) return true;
        return user.permissions.includes(permission);
    };

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
        <div className="min-h-screen bg-[#F8FAF5] font-sans overflow-x-hidden" style={{ fontFamily: "'Public Sans', sans-serif" }}>
            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div 
                    id="overlay"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                ></div>
            )}

            <Sidebar status={sidebarOpen} setStatus={setSidebarOpen} />
            
            {/* MAIN CONTENT AREA */}
            <main className={`lg:ml-72 flex-1 min-h-screen transition-all flex flex-col ${sidebarOpen ? 'ml-0' : ''}`}>
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <div className="p-4 lg:p-8 space-y-8 flex-1">{children}</div>
            </main>

            {/* FLOATING CHAT BUTTON */}
            <button className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all cursor-pointer z-40" 
                    style={{background: 'linear-gradient(180deg, #1e4d2b 0%, #35a952 100%)'}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
            </button>

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