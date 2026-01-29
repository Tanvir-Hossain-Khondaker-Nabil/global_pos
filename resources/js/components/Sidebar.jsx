import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
  X,
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
  ChevronRight,
  ArrowRightLeft,
  BadgeCent,
  BaggageClaim,
  BanknoteArrowUp,
  Barcode,
  Box,
  ShoppingBag,
  ShoppingBasket,
  UserPlus,
  WalletMinimal,
  Warehouse,
  Receipt,
  Trophy,
  TrendingUp,
  Gift,
  Star,
  BadgeDollarSign,
  Clock,
  Plane,
  BoxIcon,
  TagIcon,
  Store,
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

/** ---------------------------
 * ✅ MENU (permission based)
 * permission = Spatie permission name (middleware permission:)
 * --------------------------- */
const baseMenu = [
  // Dashboard
  { title: "Dashboard", icon: "home", route: "home", active: "home", category: "Main", permission: "dashboard.view" },

  // Sales
  { title: "Add Sale (Inventory)", icon: "baggage-claim", route: "sales.create", active: "sales.create", category: "Sales", permission: "sales.create" },
  { title: "Add Sale (POS)", icon: "baggage-claim", route: "sales.add", active: "sales.add", category: "Sales", permission: "sales.create" },
  { title: "All Orders (Inventory)", icon: "badge-cent", route: "sales.index", active: "sales.index", category: "Sales", permission: "sales.view" },
  { title: "All Orders (POS)", icon: "badge-cent", route: "salesPos.index", routeParams: { pos: "pos" }, active: "salesPos.index", category: "Sales", permission: "sales.view" },
  { title: "All Sales Items", icon: "badge-cent", route: "salesItems.list", active: "salesItems.list", category: "Sales", permission: "sales.view" },
  { title: "All Sales Return", icon: "badge-cent", route: "salesReturn.list", active: "salesReturn.list", category: "Sales", permission: "sales.return" },

  // Purchase
  { title: "Purchase", icon: "receipt", route: "purchase.list", active: "purchase.list", category: "Purchase", permission: "purchase.view" },
  { 
  title: "Local Purchase",
  icon: "receipt",
  route: "purchase.list_index",
  routeParams: null,
  active: "purchase.list_index",
  category: "Purchase",
  permission: "purchase.view",
},

  { title: "Add Purchase", icon: "arrow-right-left", route: "purchase.create", active: "purchase.create", category: "Purchase", permission: "purchase.create" },
  { title: "All Purchase Items", icon: "arrow-right-left", route: "purchase.items", active: "purchase.items", category: "Purchase", permission: "purchase.view" },

  // Purchase Return
  { title: "Purchase Return", icon: "receipt", route: "purchase-return.list", active: "purchase-return.list", category: "Purchase", permission: "purchase.return" },
  { title: "Add Purchase Return", icon: "arrow-right-left", route: "purchase-return.create", active: "purchase-return.create", category: "Purchase", permission: "purchase.return" },

  // Inventory
  { title: "Warehouse", icon: "warehouse", route: "warehouse.list", active: "warehouse.list", category: "Inventory", permission: "warehouse.view" },
  { title: "Supplier", icon: "shopping-basket", route: "supplier.view", active: "supplier.view", category: "Inventory", permission: "supplier.view" },
  { title: "Attribute", icon: "shopping-basket", route: "attributes.index", active: "attributes.index", category: "Inventory", permission: "attributes.view" },
  { title: "Products", icon: "shopping-basket", route: "product.list", active: "product.list", category: "Inventory", permission: "product.view" },
  { title: "Add Products", icon: "shopping-bag", route: "product.add", active: "product.add", category: "Inventory", permission: "product.create" },
  { title: "Categories", icon: "box", route: "category.view", active: "category.view", category: "Inventory", permission: "category.view" },
  { title: "Brands", icon: "box", route: "brands.index", active: "brands.index", category: "Inventory", permission: "brands.view" },

  // Finance
  { title: "Expense Category", icon: "banknote-arrow-up", route: "expenses.category", active: "expenses.category", category: "Finance", permission: "expenses.category.view" },
  { title: "Expense", icon: "wallet-minimal", route: "expenses.list", active: "expenses.list", category: "Finance", permission: "expenses.view" },
  { title: "Transactions", icon: "dollar-sign", route: "payments.index", active: "payments.index", category: "Finance", permission: "transactions.view" },
  { title: "Accounts", icon: "dollar-sign", route: "accounts.index", active: "accounts.index", category: "Finance", permission: "accounts.view" },
  { title: "Ledgers", icon: "box", route: "ledgers.index", active: "ledgers.index", category: "Finance", permission: "ledgers.view" },

  // Subscriptions
  { title: "Plan", icon: "barcode", route: "plans.index", active: "plans.index", category: "Subscriptions", permission: "plan.view" },
  { title: "Plan Modules", icon: "barcode", route: "modules.index", active: "modules.index", category: "Subscriptions", permission: "modules.view" },
  { title: "Subscriptions", icon: "barcode", route: "subscriptions.index", active: "subscriptions.index", category: "Subscriptions", permission: "subscriptions.view" },
  { title: "Subscriptions Payments", icon: "dollar-sign", route: "subscriptions.payments", active: "subscriptions.payments", category: "Subscriptions", permission: "subscriptions.payments" },

  // Partners
  { title: "Dealerships", icon: "box", route: "dealerships.index", active: "dealerships.index", category: "Partners", permission: "dealerships.view" },

  // CRM
  { title: "Customer", icon: "user-plus", route: "customer.index", active: "customer.index", category: "CRM", permission: "customer.view" },
  { title: "Companies", icon: "user-plus", route: "companies.index", active: "companies.index", category: "CRM", permission: "companies.view" },

  // Admin
  { title: "Users", icon: "user", route: "userlist.view", active: "userlist.view", category: "Admin", permission: "users.view" },
  { title: "Roles", icon: "user", route: "roles.index", active: "roles.index", category: "Admin", permission: "roles.view" },

  // HR
  { title: "Employees", icon: "users", route: "employees.index", active: "employees.index", category: "HR", permission: "employees.view" },
  { title: "Attendance", icon: "calendar", route: "attendance.index", active: "attendance.index", category: "HR", permission: "attendance.view" },
  { title: "Salary", icon: "credit-card", route: "salary.index", active: "salary.index", category: "HR", permission: "salary.view" },
  { title: "Allowances", icon: "trending-up", route: "allowances.index", active: "allowances.index", category: "HR", permission: "allowances.view" },
  { title: "Ranks", icon: "star", route: "ranks.index", active: "ranks.index", category: "HR", permission: "ranks.view" },
  { title: "Bonus", icon: "gift", route: "bonus.index", active: "bonus.index", category: "HR", permission: "bonus.view" },
  { title: "SMS", icon: "gift", route: "sms-templates.index", active: "sms-templates.index", category: "HR", permission: "sms.view" },

  // Outlets
  { title: "Outlet", icon: "store", route: "outlets.index", active: "outlets.index", category: "Outlets", permission: "outlets.view" },
];

const iconComponents = {
  dashboard: LayoutDashboard,
  user: User,
  settings: Settings,
  home: Home,
  "shopping-cart": ShoppingCart,
  package: Package,
  users: Users,
  "bar-chart": BarChart3,
  "credit-card": CreditCard,
  building: Building,
  "file-text": FileText,
  calendar: Calendar,
  "dollar-sign": DollarSign,
  award: Award,
  shield: Shield,
  bell: Bell,
  "help-circle": HelpCircle,
  "arrow-right-left": ArrowRightLeft,
  "badge-cent": BadgeCent,
  "baggage-claim": BaggageClaim,
  "banknote-arrow-up": BanknoteArrowUp,
  barcode: Barcode,
  box: Box,
  "shopping-bag": ShoppingBag,
  "shopping-basket": ShoppingBasket,
  "user-plus": UserPlus,
  "wallet-minimal": WalletMinimal,
  warehouse: Warehouse,
  receipt: Receipt,
  trophy: Trophy,
  "trending-up": TrendingUp,
  gift: Gift,
  star: Star,
  "badge-dollar-sign": BadgeDollarSign,
  clock: Clock,
  plane: Plane,
  "box-icon": BoxIcon,
  "tag-icon": TagIcon,
  store: Store,
};

export default function Sidebar({ status, setStatus }) {
  const { auth, currentRoute } = usePage().props;
  const { t, locale } = useTranslation();
  const sidebarRef = useRef(null);

  const [openMenus, setOpenMenus] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ backend থেকে share করুন: auth.user.permissions = ['sales.view', ...]
  const permissions = auth?.user?.permissions || [];
  const isSuperAdmin = !!auth?.user?.is_super_admin;

  // ✅ Outlet gate
  const isLoggedIntoOutlet = isSuperAdmin ? true : !!auth?.user?.is_logged_into_outlet;

  const outletOnlyMenu = [
    {
      title: "Outlet",
      icon: "store",
      route: "outlets.index",
      routeParams: null,
      active: "outlets.index",
      category: "Outlet Management",
      permission: "outlets.view",
    },
  ];

  const can = (perm) => {
    if (!perm) return true;
    if (isSuperAdmin) return true;
    return permissions.includes(perm);
  };

  const getIconComponent = (iconName) => {
    const IconComponent = iconComponents[iconName] || LayoutDashboard;
    return <IconComponent size={18} />;
  };

  const toggleMenu = (menuId) => setOpenMenus((p) => ({ ...p, [menuId]: !p[menuId] }));

  const hasActiveChild = (item) => (item.children ? item.children.some((c) => currentRoute === c.active) : false);

  const getTranslatedTitle = (englishTitle) => {
    const translationMap = {
      Dashboard: t("auth.dashboard", "Dashboard"),
      Outlet: t("auth.outlet", "Outlet"),
      "Outlet Management": t("auth.outlet_management", "Outlet Management"),
      "Add Sale (Inventory)": t("auth.add_sale_inventory", "Add Sale (Inventory)"),
      "Add Sale (POS)": t("auth.add_sale_pos", "Add Sale (POS)"),
      "All Orders (Inventory)": t("auth.all_orders_inventory", "All Orders (Inventory)"),
      "All Orders (POS)": t("auth.all_orders_pos", "All Orders (POS)"),
      "All Sales Items": t("auth.all_sales_items", "All Sales Items"),
      Purchase: t("auth.purchase", "Purchase"),
      "Add Purchase": t("auth.add_purchase", "Add Purchase"),
      "Purchase Return": t("auth.purchase_return", "Purchase Return"),
      "Add Purchase Return": t("auth.add_purchase_return", "Add Purchase Return"),
      Warehouse: t("auth.warehouse", "Warehouse"),
      Supplier: t("auth.supplier", "Supplier"),
      Attribute: t("auth.attribute", "Attribute"),
      Products: t("auth.products", "Products"),
      "Add Products": t("auth.add_products", "Add Products"),
      Categories: t("auth.categories", "Categories"),
      Brands: t("auth.brands", "Brands"),
      "Extra cash": t("auth.extra_cash", "Extra Cash"),
      Expense: t("auth.expense", "Expense"),
      Transactions: t("auth.transactions", "Transactions"),
      Accounts: t("auth.accounts", "Accounts"),
      Ledgers: t("auth.ledgers", "Ledgers"),
      Plan: t("auth.plan", "Plan"),
      "Plan Modules": t("auth.plan_modules", "Plan Modules"),
      Subscriptions: t("auth.subscriptions", "Subscriptions"),
      "Subscriptions Payments": t("auth.subscriptions_payments", "Subscriptions Payments"),
      Dealerships: t("auth.dealerships", "Dealerships"),
      Customer: t("auth.customer", "Customer"),
      Companies: t("auth.companies", "Companies"),
      Users: t("auth.users", "Users"),
      Roles: t("auth.roles", "Roles"),
      Employees: t("auth.employees", "Employees"),
      Attendance: t("auth.attendance", "Attendance"),
      Salary: t("auth.salary", "Salary"),
      Allowances: t("auth.allowances", "Allowances"),
      Ranks: t("auth.ranks", "Ranks"),
      Bonus: t("auth.bonus", "Bonus"),
      SMS: t("auth.sms", "SMS"),
    };

    return translationMap[englishTitle] || englishTitle;
  };

  const getRouteUrl = (item) => {
    try {
      return item.routeParams ? route(item.route, item.routeParams) : route(item.route);
    } catch (e) {
      console.error(`Route error for ${item.route}:`, e);
      return "#";
    }
  };

  const groupMenuByCategory = (menuItems) => {
    const categories = {};
    menuItems.forEach((item) => {
      if (!can(item.permission)) return;

      const category = item.category || "General";
      categories[category] ||= [];
      categories[category].push(item);
    });
    return categories;
  };

  const filterMenuItems = (items) => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();

    return items.filter((item) => {
      const title = getTranslatedTitle(item.title).toLowerCase();
      const matchesTitle = title.includes(q);

      const matchesChildren = item.children
        ? item.children.some((child) => getTranslatedTitle(child.title).toLowerCase().includes(q))
        : false;

      return matchesTitle || matchesChildren;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (status && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setStatus(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [status, setStatus]);

  const menuToShow = isLoggedIntoOutlet ? baseMenu : outletOnlyMenu;

  const menuCategories = useMemo(() => {
    const grouped = groupMenuByCategory(menuToShow);
    // search filter apply per category
    const out = {};
    Object.entries(grouped).forEach(([cat, items]) => {
      const filtered = filterMenuItems(items);
      if (filtered.length) out[cat] = filtered;
    });
    return out;
  }, [menuToShow, searchQuery, locale, permissions, isSuperAdmin]); // eslint-disable-line

  return (
    <>
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
          status ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        } lg:translate-x-0 lg:shadow-xl`}
        style={{ background: "linear-gradient(180deg, #0f2d1a 0%, #1e4d2b 100%)" }}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-xl shadow-lg">
                <img
                  src="https://i.ibb.co.com/6RF2dH2H/Chat-GPT-Image-Jan-14-2026-11-51-18-AM-1.png"
                  className="h-[80px]"
                  alt=""
                />
              </div>
            </div>
            <button
              onClick={() => setStatus(false)}
              className="lg:hidden text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Outlet warning (non-super-admin only) */}
          {!isSuperAdmin && !isLoggedIntoOutlet && (
            <div className="mb-6 bg-gradient-to-r from-amber-500/20 to-amber-600/10 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <Store size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">
                    {locale === "bn" ? "আউটলেট নির্বাচন করুন" : "Select an Outlet"}
                  </p>
                  <p className="text-white/70 text-xs">
                    {locale === "bn" ? "সব ফিচার এক্সেস করতে আউটলেটে লগইন করুন" : "Login to an outlet to access all features"}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Link
                  href={route("outlets.index")}
                  className="inline-flex items-center justify-center w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                >
                  <Store size={16} className="mr-2" />
                  {locale === "bn" ? "আউটলেট নির্বাচন করুন" : "Select Outlet"}
                </Link>
              </div>
            </div>
          )}

          {/* Search */}
          {isLoggedIntoOutlet && (
            <div className="mb-6 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white w-4 h-4" />
                <input
                  type="text"
                  placeholder={locale === "bn" ? "মেনু সার্চ করুন..." : "Search menu..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="no-scrollbar flex-1 overflow-y-auto space-y-6 text-sm font-medium pr-2">
            {Object.entries(menuCategories).map(([category, items]) => (
              <div key={category} className="space-y-2">
                <p className="text-[10px] uppercase text-white font-bold px-3 mb-1 tracking-widest">
                  {getTranslatedTitle(category)}
                </p>

                <div className="space-y-1">
                  {items.map((item, index) => {
                    const isActive = currentRoute === item.active || (item.children ? item.children.some((c) => currentRoute === c.active) : false);
                    const translatedTitle = getTranslatedTitle(item.title);

                    return (
                      <div key={`${category}-${index}`} className="relative group">
                        <div
                          className={`relative rounded-xl transition-all duration-200 ${
                            isActive
                              ? "bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm border border-white/10"
                              : "hover:bg-white/5"
                          }`}
                        >
                          <Link href={getRouteUrl(item)} className="flex items-center gap-3 px-4 py-3 group">
                            <span className={`${isActive ? "text-white" : "text-white/70 group-hover:text-white"}`}>
                              {getIconComponent(item.icon || "dashboard")}
                            </span>
                            <span className={`font-medium ${locale === "bn" ? "text-sm leading-relaxed" : ""} ${isActive ? "text-white" : "text-white/90 group-hover:text-white"}`}>
                              {translatedTitle}
                            </span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {!isSuperAdmin && !isLoggedIntoOutlet && (
              <div className="text-center py-8">
                <Store className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white text-sm font-medium mb-2">
                  {locale === "bn" ? "শুধুমাত্র আউটলেট মেনু" : "Outlet Menu Only"}
                </p>
                <p className="text-white/60 text-xs">
                  {locale === "bn" ? "সম্পূর্ণ মেনু দেখতে আউটলেটে লগইন করুন" : "Login to an outlet to see full menu"}
                </p>
              </div>
            )}
          </nav>

          {/* Logout */}
          <div className="mt-auto pt-6 border-t border-white/10">
            <Link
              href={route("logout")}
              onClick={(e) => {
                if (!confirm(locale === "bn" ? "আপনি কি লগআউট করতে চান?" : "Are you sure you want to logout?")) e.preventDefault();
              }}
              className="w-full bg-gradient-to-r from-red-500/20 to-red-600/10 hover:from-red-500/30 hover:to-red-600/20 border border-red-500/20 rounded-xl px-4 py-3 transition-all duration-200 flex items-center justify-center gap-2 text-white text-sm font-semibold group"
            >
              <LogOut size={16} className="group-hover:rotate-180 transition-transform duration-300" />
              <span>{locale === "bn" ? "লগআউট" : "LOGOUT"}</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Toggle */}
      <button
        onClick={() => setStatus(true)}
        className="fixed bottom-4 right-4 lg:hidden z-40 bg-gradient-to-r from-[#1e4d2b] to-[#35a952] text-white p-3 rounded-full shadow-2xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <Menu size={24} />
      </button>
    </>
  );
}
