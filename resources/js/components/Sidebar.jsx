import React, { useState } from "react";
import { baseMenu } from "../Data/Menu";
import { Link, usePage } from "@inertiajs/react";
import { X, ChevronDown, ChevronRight } from "lucide-react";
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

    // Translation mapping function
    const getTranslatedTitle = (englishTitle) => {
        const translationMap = {
            // Existing translations
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
            
            // New HR translations
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

    return (
        <div
            className={`min-w-[280px] bg-white h-screen z-20 shadow-md lg:shadow-0 print:hidden fixed lg:static overflow-auto ${
                status ? "left-0" : "-left-full"
            } duration-300 top-0 ${locale === 'bn' ? 'bangla-font' : ''}`}
        >
            {/* Logo Section - Fixed */}
            <div className="h-[80px] flex items-center justify-between lg:justify-start px-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    {/* Logo Image - Properly sized */}
                    <div className="flex items-center justify-center">
                        <img 
                            src="https://i.ibb.co.com/DHPRjDkT/Whats-App-Image-2025-12-11-at-2-57-24-PM-1.jpg" 
                            className="h-12 w-auto object-contain" 
                            alt="M/s. Motor" 
                        />
                    </div>
                    
                    {/* Company Name */}
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-gray-800">
                            M/s. Motor
                        </span>
                        <span className="text-xs text-gray-500">
                            Cycle Enterprise
                        </span>
                    </div>
                </div>
                
                {/* Close Button (Mobile) */}
                <button
                    className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setStatus(!status)}
                >
                    <X size={20} className="text-gray-600" />
                </button>
            </div>

            {/* Menu */}
            <div className="py-4 overflow-y-auto h-[calc(100vh-80px)]">
                <ul>
                    {baseMenu.map((item, index) => {
                        if (item.role === "all" || item.role === auth.role) {
                            const isActive = currentRoute === item.active || hasActiveChild(item);
                            const translatedTitle = getTranslatedTitle(item.title);
                            const hasChildren = item.children && item.children.length > 0;
                            const isSubmenuOpen = openSubmenus[index];

                            return (
                                <li key={index} className="mb-1">
                                    {hasChildren ? (
                                        <>
                                            <button
                                                onClick={() => toggleSubmenu(index)}
                                                className={`flex items-center justify-between w-full px-4 py-3 mx-2 rounded-lg duration-300 transition-colors 
                                                    ${isActive
                                                        ? "bg-primary/10 text-primary font-semibold"
                                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-500">
                                                        {item.icon}
                                                    </span>
                                                    <span className={`${locale === 'bn' ? 'text-sm leading-relaxed' : 'text-sm'}`}>
                                                        {translatedTitle}
                                                    </span>
                                                </div>
                                                {isSubmenuOpen ? (
                                                    <ChevronDown size={16} className="text-gray-400" />
                                                ) : (
                                                    <ChevronRight size={16} className="text-gray-400" />
                                                )}
                                            </button>
                                            
                                            {/* Submenu */}
                                            {isSubmenuOpen && (
                                                <ul className="ml-10 pl-2">
                                                    {item.children.map((child, childIndex) => {
                                                        const isChildActive = currentRoute === child.active;
                                                        const translatedChildTitle = getTranslatedTitle(child.title);
                                                        
                                                        return (
                                                            <li key={childIndex}>
                                                                <Link
                                                                    href={child.route}
                                                                    className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-lg duration-300 transition-colors text-sm
                                                                        ${isChildActive
                                                                            ? "bg-primary/10 text-primary font-medium"
                                                                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                                                        }`}
                                                                >
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                                                    <span className={`${locale === 'bn' ? 'text-xs leading-relaxed' : ''}`}>
                                                                        {translatedChildTitle}
                                                                    </span>
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </>
                                    ) : (
                                        <Link
                                            href={item.route}
                                            className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg duration-300 transition-colors 
                                                ${isActive
                                                    ? "bg-primary/10 text-primary font-semibold"
                                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                                }`}
                                        >
                                            <span className="text-gray-500">
                                                {item.icon}
                                            </span>
                                            <span className={`${locale === 'bn' ? 'text-sm leading-relaxed' : 'text-sm'}`}>
                                                {translatedTitle}
                                            </span>
                                        </Link>
                                    )}
                                </li>
                            );
                        }
                        return null;
                    })}
                </ul>
            </div>
        </div>
    );
}