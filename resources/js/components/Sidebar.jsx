import React from "react";
import { baseMenu } from "../Data/Menu";
import { Link, usePage } from "@inertiajs/react";
import { X } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

export default function Sidebar({ status, setStatus }) {
    const { auth, currentRoute } = usePage().props;
    const { t, locale } = useTranslation();

    // Translation mapping function
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
            'Warehouse': t('auth.warehouse', 'Warehouse'),
            'Supplier': t('auth.supplier', 'Supplier'),
            'Attribute': t('auth.attribute', 'Attribute'),
            'Products': t('auth.products', 'Products'),
            'Add Products': t('auth.add_products', 'Add Products'),
            'Categories': t('auth.categories', 'Categories'),
            'Extra cash': t('auth.extra_cash', 'Extra Cash'),
            'Expense': t('auth.expense', 'Expense'),
            'Barcode': t('auth.barcode', 'Barcode'),
            'Transactions': t('auth.transactions', 'Transactions'),
            'Customer': t('auth.customer', 'Customer'),
            'Users': t('auth.users', 'Users'),
        };
        
        return translationMap[englishTitle] || englishTitle;
    };

    return (
        <div
            className={`min-w-[280px] bg-white h-screen z-20 shadow-md lg:shadow-0 print:hidden fixed lg:static overflow-scroll ${
                status ? "left-0" : "-left-full"
            } duration-300 top-0 ${locale === 'bn' ? 'bangla-font' : ''}`}
        >
            {/* logo */}
            <div className="h-[80px] flex items-center justify-between lg:justify-start px-8">
                <img 
                    src="https://nexoryn.com/wp-content/uploads/2025/02/NEXORYN.png" 
                    className="h-[30px] w-auto" 
                    alt="Nexoryn" 
                />
                <button
                    className="btn btn-error btn-xs btn-circle lg:hidden"
                    onClick={() => setStatus(!status)}
                >
                    <X size={10} />
                </button>
            </div>

            {/* menu */}
            <ul>
                {baseMenu.map((item, index) => {
                    if (item.role === "all" || item.role === auth.role) {
                        const isActive = currentRoute === item.active;
                        const translatedTitle = getTranslatedTitle(item.title);

                        return (
                            <li key={index}>
                                <Link
                                    href={item.route}
                                    className={`flex items-center gap-3 px-8 py-3 rounded-box duration-300 transition-colors 
                                        ${isActive
                                        ? "bg-gradient-to-r from-primary/5 to-white border-l-5 border-primary pl-9 bg-primary/5 text-primary font-medium"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                                >
                                    {item.icon}
                                    <span className={locale === 'bn' ? 'text-sm leading-relaxed' : ''}>
                                        {translatedTitle}
                                    </span>
                                </Link>
                            </li>
                        );
                    }
                    return null;
                })}
            </ul>
        </div>
    );
}