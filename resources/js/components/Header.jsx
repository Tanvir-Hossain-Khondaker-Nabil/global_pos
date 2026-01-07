import { Link, usePage, router } from "@inertiajs/react";
import React, { useState, useEffect } from "react";
import Image from "../components/Image";
import { Bell, Home, LogOut, Menu, Search, User, Shield, Store, ChevronDown, MapPin } from "lucide-react"; // MapPin import করুন
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Header({ sidebarOpen, setSidebarOpen }) {
    const { auth } = usePage().props;
    const [showOutletDropdown, setShowOutletDropdown] = useState(false);
    const [isShadowUser, setIsShadowUser] = useState(false);

    // Initialize state after component mounts
    useEffect(() => {
        if (auth && auth.user && auth.user.type) {
            setIsShadowUser(auth.user.type === 'shadow');
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

    // Handle outlet login
    const handleOutletLogin = (outletId) => {
        router.post(route('outlets.login', { outlet: outletId }));
    };

    // Handle outlet logout
    const handleOutletLogout = () => {
        if (confirm('Are you sure you want to logout from this outlet?')) {
            router.post(route('outlets.logout'));
        }
    };

    // Handle outlet switch
    const handleOutletSwitch = (outletId) => {
        router.post(route('outlets.switch'), {
            outlet_id: outletId
        });
    };

    if (!auth || !auth.user) {
        return (
            <nav className="h-16 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 border-b border-gray-100 sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <div className="skeleton h-8 w-32"></div>
                </div>
                <div className="skeleton h-10 w-10 rounded-full"></div>
            </nav>
        );
    }

    // Current outlet info - FIXED: access from auth.user.current_outlet
    const currentOutlet = auth.user.current_outlet;
    const isLoggedIntoOutlet = auth.user.is_logged_into_outlet;
    const availableOutlets = auth.user.available_outlets || [];

    return (
        <nav className="h-16 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 border-b border-gray-100 sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)} 
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-slate-600 transition-colors"
                >
                    <Menu size={20} />
                </button>
                
                {/* Current Outlet Display */}
                {currentOutlet && isLoggedIntoOutlet ? (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e4d2b]/10 rounded-lg">
                            <Store size={16} className="text-[#1e4d2b]" />
                            <span className="text-sm font-bold text-[#1e4d2b]">
                                {currentOutlet.name}
                            </span>
                            <span className="text-xs text-gray-500">
                                • {currentOutlet.code}
                            </span>
                        </div>
                        
                        {/* Outlet Actions Dropdown */}
                        <div className="dropdown dropdown-bottom">
                            <button 
                                tabIndex={0} 
                                className="btn btn-xs btn-ghost"
                                onClick={() => setShowOutletDropdown(!showOutletDropdown)}
                            >
                                <ChevronDown size={16} />
                            </button>
                            <ul 
                                tabIndex={0} 
                                className="dropdown-content menu bg-base-100 rounded-box z-1 w-64 p-2 mt-2 shadow-lg"
                            >
                                <li className="pointer-events-none px-3 py-2 border-b border-gray-100">
                                    <div className="text-xs font-bold text-gray-500 uppercase">
                                        Current Outlet
                                    </div>
                                    <div className="font-bold text-[#1e4d2b] mt-1">
                                        {currentOutlet.name}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        <div className="flex items-center gap-2">
                                            <Store size={12} /> {currentOutlet.code}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <MapPin size={12} /> {currentOutlet.address}
                                        </div>
                                    </div>
                                </li>
                                
                                {/* Available Outlets for Switching */}
                                {availableOutlets.length > 0 && (
                                    <>
                                        <li className="pointer-events-none px-3 py-2 mt-2">
                                            <div className="text-xs font-bold text-gray-500 uppercase">
                                                Switch Outlet
                                            </div>
                                        </li>
                                        {availableOutlets
                                            .filter(outlet => outlet.id !== currentOutlet.id)
                                            .map(outlet => (
                                                <li key={outlet.id}>
                                                    <button
                                                        onClick={() => handleOutletSwitch(outlet.id)}
                                                        className="flex justify-between items-center hover:bg-gray-50 w-full text-left py-2 px-1"
                                                    >
                                                        <div>
                                                            <div className="font-medium">{outlet.name}</div>
                                                            <div className="text-xs text-gray-500">{outlet.code}</div>
                                                        </div>
                                                        <ChevronDown size={16} className="transform rotate-90" />
                                                    </button>
                                                </li>
                                            ))
                                        }
                                    </>
                                )}
                                
                                <li className="border-t border-gray-100 mt-2">
                                    <button
                                        onClick={handleOutletLogout}
                                        className="flex items-center gap-2 text-red-600 hover:bg-red-50 w-full py-2 px-1"
                                    >
                                        <LogOut size={14} />
                                        <span>Logout from Outlet</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-gray-500">
                        No outlet selected
                    </div>
                )}
                
                {/* <div className="hidden sm:flex items-center gap-2 text-[10px] lg:text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Home size={14} />
                    Dashboard / <span className="text-[#1e4d2b]">Overview</span>
                </div> */}
                
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
                                <Image path={auth.user.profile} />
                            </div>
                        </div>
                        
                        <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 mt-4 shadow-lg">
                            <li className="pointer-events-none border-b border-gray-100 mb-2 py-3">
                                <div className="space-x-3">
                                    <div className="avatar">
                                        <div className="w-8 h-8 rounded-full overflow-hidden">
                                            <Image path={auth.user.profile} />
                                        </div>
                                    </div>
                                    <div>
                                        <h1 className="text-sm text-gray-900 font-medium">
                                            {auth.user.name}
                                        </h1>
                                        <span className="text-xs font-normal text-gray-500 capitalize">
                                            {auth.user.role}
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