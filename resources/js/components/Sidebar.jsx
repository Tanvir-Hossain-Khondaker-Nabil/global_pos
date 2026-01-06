import React, { useState, useEffect, useRef } from "react";
import { baseMenu } from "../Data/Menu";
import { Link, usePage } from "@inertiajs/react";
import { 
    X, 
    ChevronDown, 
    LayoutDashboard, 
    LogOut,
    User,
    Settings,
    Home,
    ShoppingCart,
    Package,
    Users,
    BarChart3,
    CreditCard,
    Building,
    FileText,
    Calendar,
    DollarSign,
    Award,
    Shield,
    Bell,
    HelpCircle,
    Search,
    Menu,
    ChevronRight
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

// Icon mapping for common menu items
const iconComponents = {
    'dashboard': LayoutDashboard,
    'user': User,
    'settings': Settings,
    'home': Home,
    'shopping-cart': ShoppingCart,
    'package': Package,
    'users': Users,
    'bar-chart': BarChart3,
    'credit-card': CreditCard,
    'building': Building,
    'file-text': FileText,
    'calendar': Calendar,
    'dollar-sign': DollarSign,
    'award': Award,
    'shield': Shield,
    'bell': Bell,
    'help-circle': HelpCircle
};

export default function Sidebar({ status, setStatus }) {
    const { auth, currentRoute } = usePage().props;
    const { t, locale } = useTranslation();
    const [openMenus, setOpenMenus] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [activeMenu, setActiveMenu] = useState(null);
    const sidebarRef = useRef(null);

    // Get icon component
    const getIconComponent = (iconName) => {
        const IconComponent = iconComponents[iconName] || LayoutDashboard;
        return <IconComponent size={18} />;
    };

    // Toggle menu (for both parent and child menus)
    const toggleMenu = (menuId) => {
        setOpenMenus(prev => ({
            ...prev,
            [menuId]: !prev[menuId]
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

    // Filter menu items based on search
    const filterMenuItems = (items) => {
        if (!searchQuery) return items;
        
        return items.filter(item => {
            const title = getTranslatedTitle(item.title).toLowerCase();
            const matchesTitle = title.includes(searchQuery.toLowerCase());
            
            let matchesChildren = false;
            if (item.children) {
                matchesChildren = item.children.some(child => {
                    const childTitle = getTranslatedTitle(child.title).toLowerCase();
                    return childTitle.includes(searchQuery.toLowerCase());
                });
            }
            
            return matchesTitle || matchesChildren;
        });
    };

    // Handle click outside to close sidebar on mobile
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (status && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setStatus(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [status, setStatus]);

    const menuCategories = groupMenuByCategory();

    return (
        <>
            {/* Mobile Overlay */}
            {status && (
                <div 
                    className="fixed inset-0 bg-black/50 lg:hidden z-40 transition-opacity duration-300"
                    onClick={() => setStatus(false)}
                />
            )}

            <aside 
                ref={sidebarRef}
                id="sidebar" 
                className={`w-72 fixed h-full z-50 transition-all duration-300 ${
                    status ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                } lg:translate-x-0 lg:shadow-xl`}
                style={{background: 'linear-gradient(180deg, #0f2d1a 0%, #1e4d2b 100%)'}}
            >
                <div className="p-6 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-xl shadow-lg">
                                <LayoutDashboard className="w-6 h-6 text-[#1e4d2b]" />
                            </div>
                            <h1 className="font-bold text-lg uppercase tracking-tight text-white">
                                Wiki Pos
                            </h1>
                        </div>
                        <button 
                            onClick={() => setStatus(false)} 
                            className="lg:hidden text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6 relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                            <input
                                type="text"
                                placeholder={locale === 'bn' ? 'মেনু সার্চ করুন...' : 'Search menu...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Active Dashboard Indicator */}
                    {currentRoute === 'dashboard' && (
                        <div className="bg-gradient-to-r from-[#35a952]/20 to-[#35a952]/10 backdrop-blur-sm text-white rounded-xl px-4 py-3 flex items-center gap-3 font-bold text-xs uppercase tracking-wider mb-6 border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-[#35a952] animate-pulse"></div>
                            <span>DASHBOARD</span>
                        </div>
                    )}
                    
                    {/* Navigation Menu */}
                    <nav className="flex-1 overflow-y-auto no-scrollbar space-y-6 text-sm font-medium pr-2 sidebar-scroll">
                        {Object.entries(menuCategories).map(([category, items]) => {
                            const filteredItems = filterMenuItems(items);
                            if (filteredItems.length === 0) return null;

                            return (
                                <div key={category} className="space-y-2">
                                    <p className="text-[10px] uppercase text-white/50 font-bold px-3 mb-1 tracking-widest">
                                        {category}
                                    </p>
                                    
                                    <div className="space-y-1">
                                        {filteredItems.map((item, index) => {
                                            const isActive = currentRoute === item.active || hasActiveChild(item);
                                            const translatedTitle = getTranslatedTitle(item.title);
                                            const hasChildren = item.children && item.children.length > 0;
                                            const menuId = `${category}-${index}`;
                                            const isMenuOpen = openMenus[menuId];

                                            return (
                                                <div key={menuId} className="relative group">
                                                    {/* Menu Item */}
                                                    <div className={`relative rounded-xl transition-all duration-200 ${
                                                        isActive 
                                                            ? 'bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm border border-white/10' 
                                                            : 'hover:bg-white/5'
                                                    }`}>
                                                        {hasChildren ? (
                                                            <button
                                                                onClick={() => toggleMenu(menuId)}
                                                                className="flex items-center justify-between w-full px-4 py-3 group text-left"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`transition-transform duration-200 ${
                                                                        isActive ? 'text-white' : 'text-white/70 group-hover:text-white'
                                                                    }`}>
                                                                        {getIconComponent(item.icon || 'dashboard')}
                                                                    </span>
                                                                    <span className={`font-medium ${
                                                                        locale === 'bn' ? 'text-sm leading-relaxed' : ''
                                                                    } ${isActive ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>
                                                                        {translatedTitle}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {hasChildren && (
                                                                        <ChevronRight 
                                                                            size={16} 
                                                                            className={`text-white/50 transition-transform duration-200 ${
                                                                                isMenuOpen ? 'rotate-90' : ''
                                                                            }`} 
                                                                        />
                                                                    )}
                                                                </div>
                                                            </button>
                                                        ) : (
                                                            <Link
                                                                href={item.route}
                                                                className="flex items-center gap-3 px-4 py-3 group"
                                                            >
                                                                <span className={`transition-transform duration-200 ${
                                                                    isActive ? 'text-white' : 'text-white/70 group-hover:text-white'
                                                                }`}>
                                                                    {getIconComponent(item.icon || 'dashboard')}
                                                                </span>
                                                                <span className={`font-medium ${
                                                                    locale === 'bn' ? 'text-sm leading-relaxed' : ''
                                                                } ${isActive ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>
                                                                    {translatedTitle}
                                                                </span>
                                                            </Link>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Dropdown Submenu */}
                                                    {hasChildren && isMenuOpen && (
                                                        <div className="ml-6 mt-1 space-y-1 animate-fadeIn">
                                                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#35a952] to-transparent"></div>
                                                            {item.children.map((child, childIndex) => {
                                                                const isChildActive = currentRoute === child.active;
                                                                const translatedChildTitle = getTranslatedTitle(child.title);
                                                                
                                                                return (
                                                                    <Link
                                                                        key={childIndex}
                                                                        href={child.route}
                                                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm group relative ${
                                                                            isChildActive
                                                                                ? "bg-gradient-to-r from-[#35a952]/20 to-[#35a952]/10 text-white"
                                                                                : "text-white/70 hover:text-white hover:bg-white/5"
                                                                        }`}
                                                                    >
                                                                        <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                                                                            isChildActive 
                                                                                ? 'bg-[#35a952] scale-125' 
                                                                                : 'bg-white/30 group-hover:bg-white/50'
                                                                        }`}></div>
                                                                        <span className={`${locale === 'bn' ? 'text-xs leading-relaxed' : ''}`}>
                                                                            {translatedChildTitle}
                                                                        </span>
                                                                        {isChildActive && (
                                                                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-[#35a952] animate-pulse"></div>
                                                                            </div>
                                                                        )}
                                                                    </Link>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* No Search Results */}
                        {searchQuery && Object.values(menuCategories).every(items => filterMenuItems(items).length === 0) && (
                            <div className="text-center py-8">
                                <Search className="w-12 h-12 text-white/20 mx-auto mb-3" />
                                <p className="text-white/50 text-sm">
                                    {locale === 'bn' ? 'কোন মেনু পাওয়া যায়নি' : 'No menu items found'}
                                </p>
                                <p className="text-white/30 text-xs mt-1">
                                    {locale === 'bn' ? 'অন্য কীওয়ার্ড দিয়ে চেষ্টা করুন' : 'Try a different keyword'}
                                </p>
                            </div>
                        )}
                    </nav>

                    {/* User Info & Logout */}
                    <div className="mt-auto pt-6 border-t border-white/10">
                        {/* User Info */}
                        <div className="flex items-center gap-3 mb-4 px-3 py-2 rounded-lg bg-white/5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#35a952] to-[#1e4d2b] flex items-center justify-center text-white font-bold text-xs">
                                {auth.user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">
                                    {auth.user?.name || 'User'}
                                </p>
                                <p className="text-white/50 text-xs truncate">
                                    {auth.role || 'Administrator'}
                                </p>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <Link
                            href={route("logout")}
                            onClick={(e) => {
                                if (!confirm(locale === 'bn' ? "আপনি কি লগআউট করতে চান?" : "Are you sure you want to logout?")) {
                                    e.preventDefault();
                                }
                            }}
                            className="w-full bg-gradient-to-r from-red-500/20 to-red-600/10 hover:from-red-500/30 hover:to-red-600/20 border border-red-500/20 rounded-xl px-4 py-3 transition-all duration-200 flex items-center justify-center gap-2 text-white text-sm font-semibold group"
                        >
                            <LogOut size={16} className="group-hover:rotate-180 transition-transform duration-300" />
                            <span>{locale === 'bn' ? 'লগআউট' : 'LOGOUT'}</span>
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Mobile Menu Toggle Button */}
            <button
                onClick={() => setStatus(true)}
                className="fixed bottom-4 right-4 lg:hidden z-40 bg-gradient-to-r from-[#1e4d2b] to-[#35a952] text-white p-3 rounded-full shadow-2xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
            >
                <Menu size={24} />
            </button>

            {/* Add custom styles for animations */}
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
                .sidebar-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
                }
                .sidebar-scroll::-webkit-scrollbar {
                    width: 4px;
                }
                .sidebar-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .sidebar-scroll::-webkit-scrollbar-thumb {
                    background-color: rgba(255, 255, 255, 0.2);
                    border-radius: 20px;
                }
            `}</style>
        </>
    );
}