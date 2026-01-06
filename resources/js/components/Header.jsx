import { Link, usePage, router } from "@inertiajs/react";
import React, { useState, useEffect } from "react";
import Image from "../components/Image";
import { Bell, Home, LogOut, Menu, Search, User, Shield } from "lucide-react";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Header({ sidebarOpen, setSidebarOpen }) {
    const { auth } = usePage().props;
    const [isShadowUser, setIsShadowUser] = useState(false);

    // Initialize state after component mounts
    useEffect(() => {
        if (auth && auth.type) {
            setIsShadowUser(auth.type === 'shadow');
        }
    }, [auth]);

    const handleToggleUserType = () => {
        router.post(route('user.toggle.type'), {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setIsShadowUser(!isShadowUser);
            }
        });
    };

    if (!auth) {
        return (
            <nav className="h-16 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 border-b border-gray-100 sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <div className="skeleton h-8 w-32"></div>
                </div>
                <div className="skeleton h-10 w-10 rounded-full"></div>
            </nav>
        );
    }

    return (
        <nav className="h-16 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 border-b border-gray-100 sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)} 
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-slate-600 transition-colors"
                >
                    <Menu size={20} />
                </button>
                <div className="hidden sm:flex items-center gap-2 text-[10px] lg:text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Home size={14} />
                    Dashboard / <span className="text-[#1e4d2b]">Overview</span>
                </div>
                
                {/* Language Switcher */}
                <div className="flex items-center">
                    <LanguageSwitcher />
                </div>
            </div>
            
            <div className="flex items-center gap-4 lg:gap-6">
                <div className="relative group hidden md:block">
                    <input 
                        type="text" 
                        placeholder="Search data..." 
                        className="bg-slate-50 border border-slate-100 rounded-xl py-2 pl-10 pr-4 text-xs w-48 lg:w-64 outline-none focus:ring-2 ring-[#35a952]/20 transition-all"
                    />
                    <Search className="absolute left-3.5 top-2.5 text-slate-400 w-4 h-4" />
                </div>
                
                <div className="flex items-center gap-2 lg:gap-4">
                    <button className="p-2 text-slate-500 hover:text-[#1e4d2b] hover:bg-slate-50 rounded-xl transition-all relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full ring-2 ring-white ring-offset-2 ring-offset-gray-100 overflow-hidden">
                                <Image path={auth.profile} />
                            </div>
                        </div>
                        
                        <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 mt-4 shadow-lg">
                            <li className="pointer-events-none border-b border-gray-100 mb-2 py-3">
                                <div className="space-x-3">
                                    <div className="avatar">
                                        <div className="w-8 h-8 rounded-full overflow-hidden">
                                            <Image path={auth.profile} />
                                        </div>
                                    </div>
                                    <div>
                                        <h1 className="text-sm text-gray-900 font-medium">
                                            {auth.name}
                                        </h1>
                                        <span className="text-xs font-normal text-gray-500 capitalize">
                                            {auth.role}
                                        </span>
                                    </div>
                                </div>
                            </li>
                            <li>
                                <Link href={route("profile.view")}>
                                    <User size={14} />
                                    <span>Profile</span>
                                </Link>
                            </li>
                            <li>
                                <Link href={route("businessProfile.view")}>
                                    <User size={14} />
                                    <span>Business Profile</span>
                                </Link>
                            </li>
                            <li>
                                <Link href={route("security.view")}>
                                    <Shield size={14} />
                                    <span>Security</span>
                                </Link>
                            </li>
                            <li>
                                <button
                                    onClick={handleToggleUserType}
                                    className={`btn btn-sm ${isShadowUser ? 'bg-[#1e4d2b] text-white text-white' : 'bg-amber-500 text-white'} gap-2`}
                                    title={`Switch to ${isShadowUser ? 'Shadow' : 'General'} mode`}
                                >
                                    <Shield size={16} />
                                    {isShadowUser ? 'General Mode' : 'Shadow Mode'}
                                </button>
                            </li>
                            <li>
                                <Link
                                    href={route("logout")}
                                    onClick={(e) => {
                                        if (!confirm("Are you sure you want to logout?")) {
                                            e.preventDefault();
                                        }
                                    }}
                                >
                                    <LogOut size={14} />
                                    <span>Logout</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </nav>
    );
}