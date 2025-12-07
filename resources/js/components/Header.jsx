import { Link, usePage, router } from "@inertiajs/react";
import React, { useState, useEffect } from "react";
import Image from "../components/Image";
import { Lock, LogOut, Menu, Plus, User, Shield, Languages } from "lucide-react";
import LanguageSwitcher from "../components/LanguageSwitcher"; // Import the LanguageSwitcher

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
                // Update local state after successful toggle
                setIsShadowUser(!isShadowUser);
            }
        });
    };

    // Show loading state if auth is not available yet
    if (!auth) {
        return (
            <div className="h-[80px] flex items-center justify-between gap-4 px-6 print:hidden">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="btn btn-sm btn-square btn-primary lg:hidden"
                    >
                        <Menu size={14} />
                    </button>
                    <div className="skeleton h-8 w-32"></div>
                </div>
                <div className="skeleton h-10 w-10 rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="h-[80px] flex items-center justify-between gap-4 px-6 print:hidden">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="btn btn-sm btn-square btn-primary lg:hidden"
                >
                    <Menu size={14} />
                </button>
                
           

                {/* Language Switcher */}
                <div className="flex items-center">
                    <LanguageSwitcher />
                </div>
            </div>

            {/* Right side - Profile */}
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-900">
                    Hello, <strong>{auth.name}</strong>
                </span>
                <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="avatar">
                        <div className="ring-white ring-offset-base-100 w-10 rounded-full ring-2 ring-offset-2">
                            <Image path={auth.profile} />
                        </div>
                    </div>

                    <ul
                        tabIndex={0}
                        className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 mt-4 shadow-lg"
                    >
                        <li className="pointer-events-none border-b border-gray-100 mb-2 py-3">
                            <div className="space-x-3">
                                <div className="avatar">
                                    <div className="ring-primary ring-offset-base-100 w-8 rounded-full ring-2 ring-offset-2">
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
                            <Link href={route("security.view")}>
                                <Lock size={14} />
                                <span>Security</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={route("logout")}
                                onClick={(e) => {
                                    if (
                                        !confirm(
                                            "Are you sure you want to logout?"
                                        )
                                    ) {
                                        e.preventDefault();
                                    }
                                }}
                            >
                                <LogOut size={14} />
                                <span>Logout</span>
                            </Link>
                        </li>
                        <li>
                            <button
                                onClick={handleToggleUserType}
                                className={`btn btn-sm ${isShadowUser ? 'btn-primary' : 'btn-warning'} gap-2`}
                                title={`Switch to ${isShadowUser ? 'Shadow' : 'General'} mode`}
                            >
                                <Shield size={16} />
                                {isShadowUser ? 'General Mode' : 'Shadow Mode'}
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}