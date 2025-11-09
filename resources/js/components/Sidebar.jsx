import React from "react";
import Image from "../components/Image";
import { baseMenu } from "../Data/Menu";
import { Link, usePage } from "@inertiajs/react";
import { X } from "lucide-react";

export default function Sidebar({ status, setStatus }) {
    const { auth, currentRoute } = usePage().props;

    return (
        <div
            className={`min-w-[280px] bg-white h-screen z-20 shadow-md lg:shadow-0 print:hidden fixed lg:static overflow-scroll ${
                status ? "left-0" : "-left-full"
            } duration-300 top-0`}
        >
            {/* logo */}
            <div className="h-[80px] flex items-center justify-between lg:justify-start px-8">
                {/* <Image path="https://nexoryn.com/wp-content/uploads/2025/02/NEXORYN.png" className="h-[30px] w-auto" /> */}
                <img src="https://nexoryn.com/wp-content/uploads/2025/02/NEXORYN.png" className="h-[30px] w-auto" alt="" />
                <button
                    className="btn btn-error btn-xs btn-circle lg:hidden"
                    onClick={() => setStatus(!status)}
                >
                    <X size={10} />
                </button>
            </div>

            {/* menu for admin */}
            <ul>
                {baseMenu.map((item, index) => {
                    // শুধুমাত্র admin এর জন্য অথবা সবার জন্য item দেখাও
                    if (item.role === "all" || item.role === auth.role) {
                        const isActive = currentRoute === item.active;

                        return (
                            <li key={index}>
                                <Link
                                    href={item.route}
                                    className={`flex items-center gap-3 px-8 py-3 rounded-box duration-300 transition-colors 
                            ${
                                isActive
                                    ? "bg-gradient-to-r from-primary/5 to-white border-l-5 border-primary pl-9 bg-primary/5 text-primary font-medium"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                                >
                                    {item.icon}
                                    <span>{item.title}</span>
                                </Link>
                            </li>
                        );
                    }

                    // অন্যদের জন্য কিছুই রেন্ডার হবে না
                    return null;
                })}
            </ul>
        </div>
    );
}
