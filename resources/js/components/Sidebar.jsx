import React, { useState } from "react";
import { baseMenu } from "../Data/Menu";
import { Link, usePage } from "@inertiajs/react";
import { X, ChevronDown, ChevronRight, LayoutDashboard, LogOut } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

export default function Sidebar({ status, setStatus }) {
    const { auth, currentRoute } = usePage().props;
    const { t, locale } = useTranslation();
    const [openSubmenus, setOpenSubmenus] = useState({});

    // Toggle submenu
    const toggleSubmenu = (index) => {
        setOpenSubmenus(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    // Check if menu item has active child
    const hasActiveChild = (item) => {
        if (!item.children) return false;
        return item.children.some(child => currentRoute === child.active);
    };

    // Get translated title
    const getTranslatedTitle = (englishTitle) => {
        const translationMap = {
            'Dashboard': t('auth.dashboard', 'Dashboard'),
            'Add Sale (Inventory)': t('auth.add_sale_inventory', 'Add Sale (Inventory)'),
            'Add Sale (POS)': t('auth.add_sale_pos', 'Add Sale (POS)'),
            'All Orders (Inventory)': t('auth.all_orders_inventory', 'All Orders (Inventory)'),
            'All Orders (POS)': t('auth.all_orders_pos', 'All Orders (POS)'),
            'All Sales Items': t('auth.all_sales_items', 'All Sales Items'),
            'Purchase': t('auth.purchase', 'Purchase'),
            'Add Purchase': t('auth.add_purchase', 'Add Purchase'),
            'Purchase Return': t('auth.purchase_return', 'Purchase Return'),
            'Add Purchase Return': t('auth.add_purchase_return', 'Add Purchase Return'),
            'Warehouse': t('auth.warehouse', 'Warehouse'),
            'Supplier': t('auth.supplier', 'Supplier'),
            'Attribute': t('auth.attribute', 'Attribute'),
            'Products': t('auth.products', 'Products'),
            'Add Products': t('auth.add_products', 'Add Products'),
            'Categories': t('auth.categories', 'Categories'),
            'Extra cash': t('auth.extra_cash', 'Extra Cash'),
            'Expense': t('auth.expense', 'Expense'),
            'Plan': t('auth.plan', 'Plan'),
            'Plan Modules': t('auth.plan_modules', 'Plan Modules'),
            'Subscriptions': t('auth.subscriptions', 'Subscriptions'),
            'Subscriptions Payments': t('auth.subscriptions_payments', 'Subscriptions Payments'),
            'Transactions': t('auth.transactions', 'Transactions'),
            'Ledgers': t('auth.ledgers', 'Ledgers'),
            'Dealerships': t('auth.dealerships', 'Dealerships'),
            'Customer': t('auth.customer', 'Customer'),
            'Companies': t('auth.companies', 'Companies'),
            'Users': t('auth.users', 'Users'),
            'Employees': t('auth.employees', 'Employees'),
            'Attendance': t('auth.attendance', 'Attendance'),
            'Monthly Report': t('auth.monthly_report', 'Monthly Report'),
            'Top Performers': t('auth.top_performers', 'Top Performers'),
            'Manual Entry': t('auth.manual_entry', 'Manual Entry'),
            'Salary': t('auth.salary', 'Salary'),
            'Salary Report': t('auth.salary_report', 'Salary Report'),
            'Test Salary': t('auth.test_salary', 'Test Salary'),
            'Process Awards': t('auth.process_awards', 'Process Awards'),
            'Leave Management': t('auth.leave_management', 'Leave Management'),
            'Create Leave': t('auth.create_leave', 'Create Leave'),
            'Leave Dashboard': t('auth.leave_dashboard', 'Leave Dashboard'),
            'Leave Balance': t('auth.leave_balance', 'Leave Balance'),
            'Provident Fund': t('auth.provident_fund', 'Provident Fund'),
            'Overall Summary': t('auth.overall_summary', 'Overall Summary'),
            'Allowances': t('auth.allowances', 'Allowances'),
            'Ranks': t('auth.ranks', 'Ranks'),
            'Employee Awards': t('auth.employee_awards', 'Employee Awards'),
            'Award Statistics': t('auth.award_statistics', 'Award Statistics'),
            'Assign Monthly': t('auth.assign_monthly', 'Assign Monthly'),
            'Bonus': t('auth.bonus', 'Bonus'),
            'Apply Eid Bonus': t('auth.apply_eid_bonus', 'Apply Eid Bonus'),
            'Apply Festival Bonus': t('auth.apply_festival_bonus', 'Apply Festival Bonus'),
        };
        
        return translationMap[englishTitle] || englishTitle;
    };

    // Group menu items by category
    const groupMenuByCategory = () => {
        const categories = {};
        
        baseMenu.forEach(item => {
            if (item.role === "all" || item.role === auth.role) {
                const category = item.category || 'General';
                if (!categories[category]) {
                    categories[category] = [];
                }
                categories[category].push(item);
            }
        });
        
        return categories;
    };

    const menuCategories = groupMenuByCategory();

    return (
        <aside 
            id="sidebar" 
            className={`w-72 fixed h-full z-50 transition-transform duration-300 ${
                status ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 shadow-2xl`}
            style={{background: 'linear-gradient(180deg, #1e4d2b 0%, #35a952 100%)'}}
        >
            <div className="p-8 h-full flex flex-col">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-white p-1.5 rounded-xl shadow-lg">
                        <LayoutDashboard className="w-6 h-6 text-[#1e4d2b]" />
                    </div>
                    <h1 className="font-bold text-lg uppercase tracking-tight text-white">
                        Wiki Pos
                    </h1>
                    <button 
                        onClick={() => setStatus(false)} 
                        className="lg:hidden text-white ml-auto"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Active Dashboard link */}
                {currentRoute === 'dashboard' && (
                    <div className="bg-white/20 backdrop-blur-md text-white rounded-xl px-4 py-3 flex items-center gap-3 font-bold text-xs uppercase tracking-wider mb-6 border border-white/10">
                        <LayoutDashboard className="w-4 h-4" /> DASHBOARD
                    </div>
                )}
                
                {/* Navigation Menu */}
                <nav className="flex-1 overflow-y-auto no-scrollbar space-y-6 text-sm font-medium pr-2 sidebar-scroll">
                    {Object.entries(menuCategories).map(([category, items]) => (
                        <div key={category}>
                            <p className="text-[10px] uppercase text-white/50 font-bold px-3 mb-2 tracking-widest">
                                {category}
                            </p>
                            <ul className="space-y-1">
                                {items.map((item, index) => {
                                    const isActive = currentRoute === item.active || hasActiveChild(item);
                                    const translatedTitle = getTranslatedTitle(item.title);
                                    const hasChildren = item.children && item.children.length > 0;
                                    const isSubmenuOpen = openSubmenus[`${category}-${index}`];

                                    if (hasChildren) {
                                        return (
                                            <li key={index}>
                                                <button
                                                    onClick={() => toggleSubmenu(`${category}-${index}`)}
                                                    className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl transition-all group text-white ${
                                                        isActive
                                                            ? "bg-white/20 backdrop-blur-md border border-white/10"
                                                            : "hover:bg-white/10"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="opacity-70 group-hover:opacity-100">
                                                            {item.icon}
                                                        </span>
                                                        <span className={`${locale === 'bn' ? 'text-sm leading-relaxed' : ''}`}>
                                                            {translatedTitle}
                                                        </span>
                                                    </div>
                                                    {isSubmenuOpen ? (
                                                        <ChevronDown size={16} className="text-white/50" />
                                                    ) : (
                                                        <ChevronRight size={16} className="text-white/50" />
                                                    )}
                                                </button>
                                                
                                                {/* Submenu */}
                                                {isSubmenuOpen && (
                                                    <ul className="ml-10 mt-1 space-y-1">
                                                        {item.children.map((child, childIndex) => {
                                                            const isChildActive = currentRoute === child.active;
                                                            const translatedChildTitle = getTranslatedTitle(child.title);
                                                            
                                                            return (
                                                                <li key={childIndex}>
                                                                    <Link
                                                                        href={child.route}
                                                                        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                                                                            isChildActive
                                                                                ? "bg-white/10 text-white font-medium"
                                                                                : "text-white/70 hover:text-white hover:bg-white/5"
                                                                        }`}
                                                                    >
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-white/30"></span>
                                                                        <span className={`${locale === 'bn' ? 'text-xs leading-relaxed' : ''}`}>
                                                                            {translatedChildTitle}
                                                                        </span>
                                                                    </Link>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                )}
                                            </li>
                                        );
                                    }

                                    return (
                                        <li key={index}>
                                            <Link
                                                href={item.route}
                                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group text-white ${
                                                    isActive
                                                        ? "bg-white/20 backdrop-blur-md border border-white/10"
                                                        : "hover:bg-white/10"
                                                }`}
                                            >
                                                <span className="opacity-70 group-hover:opacity-100">
                                                    {item.icon}
                                                </span>
                                                <span className={`${locale === 'bn' ? 'text-sm leading-relaxed' : ''}`}>
                                                    {translatedTitle}
                                                </span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                            <hr className="border-white/10 my-4 mx-2" />
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="mt-auto pt-6 border-t border-white/10 text-center">
                    <p className="text-[11px] text-white/60 mb-2">
                        Logged in as {auth.role || 'Administrator'}
                    </p>
                    <Link
                        href={route("logout")}
                        onClick={(e) => {
                            if (!confirm("Are you sure you want to logout?")) {
                                e.preventDefault();
                            }
                        }}
                        className="w-full text-xs font-bold border border-white/20 rounded-xl px-4 py-2.5 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-white"
                    >
                        <LogOut size={16} />
                        LOGOUT
                    </Link>
                </div>
            </div>
        </aside>
    );
}