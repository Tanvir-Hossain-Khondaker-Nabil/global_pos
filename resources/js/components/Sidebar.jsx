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
  AlertCircle,
  CheckCircle,
  Eye,
  LogIn,
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

/** ---------------------------
 * ✅ MENU (permission based)
 * --------------------------- */

// Outlet লগইন না করা অবস্থার বেস মেনু
const outletOverviewMenuBase = [
  {
    title: "Dashboard",
    icon: "home",
    route: "home",
    active: "home",
    category: "Main",
    permission: "dashboard.view",
  },
  {
    title: "Outlet Management",
    icon: "store",
    route: "outlets.index",
    routeParams: null,
    active: "outlets.index",
    category: "Outlets",
    permission: "outlets.view",
  },
];

// Overview mode এ (outlet login নাই) Owner/Admin দের জন্য Investments দেখাতে চাইলে
const investmentsOverviewMenu = [
  { title: "Investors", icon: "users", route: "investors.index", active: "investors.index", category: "Investments", permission: "investors.view" },
  { title: "Add Investor", icon: "user-plus", route: "investors.create", active: "investors.create", category: "Investments", permission: "investors.create" },
  { title: "Investments", icon: "wallet-minimal", route: "investments.index", active: "investments.index", category: "Investments", permission: "investments.view" },
  { title: "Add Investment", icon: "wallet-minimal", route: "investments.create", active: "investments.create", category: "Investments", permission: "investments.create" },
  { title: "Investment Returns", icon: "dollar-sign", route: "investmentReturns.index", active: "investmentReturns.index", category: "Investments", permission: "investments.returns.view" },
];

// ✅ Overview mode এ User/Role দেখাতে চাইলে
const adminOverviewMenu = [
  { title: "Users", icon: "user", route: "userlist.view", active: "userlist.view", category: "Admin", permission: "users.view" },
  { title: "Roles", icon: "user", route: "roles.index", active: "roles.index", category: "Admin", permission: "roles.view" },
];

// ✅ Overview mode এ Outlet মেনু (Outlet/Outlet Management) দেখাতে চাইলে
const outletsOverviewExtraMenu = [
  { title: "Outlet", icon: "store", route: "outlets.index", active: "outlets.index", category: "Outlets", permission: "outlets.view" },
];

// Outlet লগইন করা অবস্থার ফুল মেনু
const outletLoggedInMenu = [
  // Dashboard
  { title: "Dashboard", icon: "home", route: "home", active: "home", category: "Main", permission: "dashboard.view" },

  // Sales
  { title: "Add Sale (Inventory)", icon: "baggage-claim", route: "sales.create", active: "sales.create", category: "Sales", permission: "sales.create" },
  { title: "Add Sale (POS)", icon: "baggage-claim", route: "sales.add", active: "sales.add", category: "Sales", permission: "sales.create" },
  { title: "All Orders (Inventory)", icon: "badge-cent", route: "sales.index", active: "sales.index", category: "Sales", permission: "sales.view" },
  { title: "All Orders (POS)", icon: "badge-cent", route: "salesPos.index", active: "salesPos.index", category: "Sales", permission: "sales.view" },
  { title: "All Sales Items", icon: "badge-cent", route: "salesItems.list", active: "salesItems.list", category: "Sales", permission: "sales.view" },
  { title: "All Sales Return", icon: "badge-cent", route: "salesReturn.list", active: "salesReturn.list", category: "Sales", permission: "salesReturn.list" },

  // Purchase
  { title: "Purchase", icon: "receipt", route: "purchase.list", active: "purchase.list", category: "Purchase", permission: "purchase.view" },
  { title: "Local Purchase", icon: "receipt", route: "purchase.list_index", routeParams: null, active: "purchase.list_index", category: "Purchase", permission: "purchase.view" },
  { title: "Add Purchase", icon: "arrow-right-left", route: "purchase.create", active: "purchase.create", category: "Purchase", permission: "purchase.create" },
  { title: "All Purchase Items", icon: "arrow-right-left", route: "purchase.items", active: "purchase.items", category: "Purchase", permission: "purchase.view" },

  // Purchase Return
  { title: "Purchase Return", icon: "receipt", route: "purchase-return.list", active: "purchase-return.list", category: "Purchase", permission: "purchase.return" },
  { title: "Add Purchase Return", icon: "arrow-right-left", route: "purchase-return.create", active: "purchase-return.create", category: "Purchase", permission: "purchase.return" },

  // Inventory
  { title: "Damages List", icon: "damages", route: "damages.index", active: "damages.index", category: "Inventory", permission: "damages.index" },
  { title: "Warehouse", icon: "warehouse", route: "warehouse.list", active: "warehouse.list", category: "Inventory", permission: "warehouse.view" },
  { title: "Supplier", icon: "shopping-basket", route: "supplier.view", active: "supplier.view", category: "Inventory", permission: "supplier.view" },
  { title: "Attribute", icon: "shopping-basket", route: "attributes.index", active: "attributes.index", category: "Inventory", permission: "attributes.view" },
  { title: "Products", icon: "shopping-basket", route: "product.list", active: "product.list", category: "Inventory", permission: "product.view" },
  { title: "Add Products", icon: "shopping-bag", route: "product.add", active: "product.add", category: "Inventory", permission: "product.create" },
  { title: "Categories", icon: "box", route: "category.view", active: "category.view", category: "Inventory", permission: "category.view" },
  { title: "Brands", icon: "box", route: "brands.index", active: "brands.index", category: "Inventory", permission: "brands.view" },

  // Investments (⚠️ outlet user হলে outlet login অবস্থায় এটাকে আমরা runtime এ hide করবো)
  { title: "Investors", icon: "users", route: "investors.index", active: "investors.index", category: "Investments", permission: "investors.view" },
  { title: "Add Investor", icon: "user-plus", route: "investors.create", active: "investors.create", category: "Investments", permission: "investors.create" },
  { title: "Investments", icon: "wallet-minimal", route: "investments.index", active: "investments.index", category: "Investments", permission: "investments.view" },
  { title: "Add Investment", icon: "wallet-minimal", route: "investments.create", active: "investments.create", category: "Investments", permission: "investments.create" },
  { title: "Investment Returns", icon: "dollar-sign", route: "investmentReturns.index", active: "investmentReturns.index", category: "Investments", permission: "investments.returns.view" },

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
  { title: "Notifications", icon: "box", route: "notifications.index", active: "notifications.index", category: "Partners", permission: "notifications.index" },
  { title: "Dealerships", icon: "box", route: "dealerships.index", active: "dealerships.index", category: "Partners", permission: "dealerships.view" },

  // CRM
  { title: "Customer", icon: "user-plus", route: "customer.index", active: "customer.index", category: "CRM", permission: "customer.view" },
  { title: "Companies", icon: "user-plus", route: "companies.index", active: "companies.index", category: "CRM", permission: "companies.view" },

  // HR
  { title: "Employees", icon: "users", route: "employees.index", active: "employees.index", category: "HR", permission: "employees.view" },
  { title: "Attendance", icon: "calendar", route: "attendance.index", active: "attendance.index", category: "HR", permission: "attendance.view" },
  { title: "Salary", icon: "credit-card", route: "salary.index", active: "salary.index", category: "HR", permission: "salary.view" },
  { title: "Allowances", icon: "trending-up", route: "allowances.index", active: "allowances.index", category: "HR", permission: "allowances.view" },
  { title: "Ranks", icon: "star", route: "ranks.index", active: "ranks.index", category: "HR", permission: "ranks.view" },
  { title: "Bonus", icon: "gift", route: "bonus.index", active: "bonus.index", category: "HR", permission: "bonus.view" },
  { title: "SMS", icon: "gift", route: "sms-templates.index", active: "sms-templates.index", category: "HR", permission: "sms.view" },

  // ❌ IMPORTANT: Outlet login থাকা অবস্থায় Admin/Outlets মেনু দেখাবেন না
  // তাই এগুলো এখানে রাখার দরকার নেই (বা থাকলেও runtime এ hide হবে)
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
  "alert-circle": AlertCircle,
  "check-circle": CheckCircle,
  eye: Eye,
  "log-in": LogIn,
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
  const isLoggedIntoOutlet = !!auth?.user?.is_logged_into_outlet;

  // ✅ outlet user detect: outlet_id থাকলে outlet user
  const isOutletUser = !!auth?.user?.outlet_id;

  const can = (perm) => {
    if (!perm) return true;
    if (isSuperAdmin) return true;
    return permissions.includes(perm);
  };

  const getIconComponent = (iconName) => {
    const IconComponent = iconComponents[iconName] || LayoutDashboard;
    return <IconComponent size={18} />;
  };

  const toggleMenu = (menuId) =>
    setOpenMenus((p) => ({ ...p, [menuId]: !p[menuId] }));

  const getTranslatedTitle = (englishTitle) => {
    const translationMap = {
      // Main
      Dashboard: t("auth.dashboard", "Dashboard"),
      "Outlet Management": t("auth.outlet_management", "Outlet Management"),

      // Sales
      "Add Sale (Inventory)": t("auth.add_sale_inventory", "Add Sale (Inventory)"),
      "Add Sale (POS)": t("auth.add_sale_pos", "Add Sale (POS)"),
      "All Orders (Inventory)": t("auth.all_orders_inventory", "All Orders (Inventory)"),
      "All Orders (POS)": t("auth.all_orders_pos", "All Orders (POS)"),
      "All Sales Items": t("auth.all_sales_items", "All Sales Items"),
      "All Sales Return": t("auth.all_sales_return", "All Sales Return"),

      // Purchase
      Purchase: t("auth.purchase", "Purchase"),
      "Local Purchase": t("auth.local_purchase", "Local Purchase"),
      "Add Purchase": t("auth.add_purchase", "Add Purchase"),
      "All Purchase Items": t("auth.all_purchase_items", "All Purchase Items"),
      "Purchase Return": t("auth.purchase_return", "Purchase Return"),
      "Add Purchase Return": t("auth.add_purchase_return", "Add Purchase Return"),

      // Inventory
      Warehouse: t("auth.warehouse", "Warehouse"),
      Supplier: t("auth.supplier", "Supplier"),
      Attribute: t("auth.attribute", "Attribute"),
      Products: t("auth.products", "Products"),
      "Add Products": t("auth.add_products", "Add Products"),
      Categories: t("auth.categories", "Categories"),
      Brands: t("auth.brands", "Brands"),

      // Investments
      Investors: t("auth.investors", "Investors"),
      "Add Investor": t("auth.add_investor", "Add Investor"),
      Investments: t("auth.investments", "Investments"),
      "Add Investment": t("auth.add_investment", "Add Investment"),
      "Investment Returns": t("auth.investment_returns", "Investment Returns"),

      // Finance
      "Expense Category": t("auth.expense_category", "Expense Category"),
      Expense: t("auth.expense", "Expense"),
      Transactions: t("auth.transactions", "Transactions"),
      Accounts: t("auth.accounts", "Accounts"),
      Ledgers: t("auth.ledgers", "Ledgers"),

      // Subscriptions
      Plan: t("auth.plan", "Plan"),
      "Plan Modules": t("auth.plan_modules", "Plan Modules"),
      Subscriptions: t("auth.subscriptions", "Subscriptions"),
      "Subscriptions Payments": t("auth.subscriptions_payments", "Subscriptions Payments"),

      // Partners
      Dealerships: t("auth.dealerships", "Dealerships"),

      // CRM
      Customer: t("auth.customer", "Customer"),
      Companies: t("auth.companies", "Companies"),

      // Admin
      Users: t("auth.users", "Users"),
      Roles: t("auth.roles", "Roles"),

      // HR
      Employees: t("auth.employees", "Employees"),
      Attendance: t("auth.attendance", "Attendance"),
      Salary: t("auth.salary", "Salary"),
      Allowances: t("auth.allowances", "Allowances"),
      Ranks: t("auth.ranks", "Ranks"),
      Bonus: t("auth.bonus", "Bonus"),
      SMS: t("auth.sms", "SMS"),

      // Outlets
      Outlet: t("auth.outlet", "Outlet"),

      // Categories
      Main: t("auth.category_main", "Main"),
      Sales: t("auth.category_sales", "Sales"),
      Purchase: t("auth.category_purchase", "Purchase"),
      Inventory: t("auth.category_inventory", "Inventory"),
      Investments: t("auth.category_investments", "Investments"),
      Finance: t("auth.category_finance", "Finance"),
      Subscriptions: t("auth.category_subscriptions", "Subscriptions"),
      Partners: t("auth.category_partners", "Partners"),
      CRM: t("auth.category_crm", "CRM"),
      Admin: t("auth.category_admin", "Admin"),
      HR: t("auth.category_hr", "HR"),
      Outlets: t("auth.category_outlets", "Outlets"),
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

  const filterMenuItems = (items) => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();

    return items.filter((item) => {
      const title = getTranslatedTitle(item.title).toLowerCase();
      const matchesTitle = title.includes(q);

      const matchesChildren = item.children
        ? item.children.some((child) =>
            getTranslatedTitle(child.title).toLowerCase().includes(q)
          )
        : false;

      return matchesTitle || matchesChildren;
    });
  };

  const groupMenuByCategory = (menuItems) => {
    const categories = {};
    menuItems.forEach((item) => {
      // ✅ Permission gate
      if (!can(item.permission)) return;

      /**
       * ✅ আপনার নতুন রিকোয়ারমেন্ট:
       * Outlet login অবস্থায় => Users/Roles/Outlets menu দেখাবেন না
       */
      if (isLoggedIntoOutlet && (item.category === "Admin" || item.category === "Outlets")) return;

      /**
       * ✅ আগের রিকোয়ারমেন্ট:
       * Outlet user + outlet login => Investments লুকিয়ে ফেলুন
       */
      if (isOutletUser && isLoggedIntoOutlet && item.category === "Investments") return;

      const category = item.category || "General";
      categories[category] ||= [];
      categories[category].push(item);
    });
    return categories;
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

  /**
   * ✅ menuToShow ডিসিশন:
   * - outlet login থাকলে => outletLoggedInMenu
   * - outlet login না থাকলে => overview menu
   *   - কিন্তু user এর outlet_id না থাকলে (Owner/Admin) =>
   *     overview তে Investments + Admin + Outlets দেখাবেন
   */
  const menuToShow = useMemo(() => {
    if (isLoggedIntoOutlet) return outletLoggedInMenu;

    // Overview mode
    const base = [...outletOverviewMenuBase];

    // ✅ outlet_id না থাকলে overview এ Investments + Admin + Outlets দেখান
    if (!isOutletUser) {
      base.push(...investmentsOverviewMenu);
      base.push(...adminOverviewMenu);
      base.push(...outletsOverviewExtraMenu);
    }

    return base;
  }, [isLoggedIntoOutlet, isOutletUser]);

  const menuCategories = useMemo(() => {
    const grouped = groupMenuByCategory(menuToShow);

    // search filter apply per category
    const out = {};
    Object.entries(grouped).forEach(([cat, items]) => {
      const filtered = filterMenuItems(items);
      if (filtered.length) out[cat] = filtered;
    });
    return out;
  }, [menuToShow, searchQuery, locale, permissions, isSuperAdmin, isLoggedIntoOutlet, isOutletUser]); // eslint-disable-line

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
                    {locale === "bn" ? "আউটলেট ওভারভিউ" : "Outlet Overview"}
                  </p>
                  <p className="text-white/70 text-xs">
                    {locale === "bn"
                      ? "সম্পূর্ণ ফিচার এক্সেস করতে আউটলেটে লগইন করুন"
                      : "Login to an outlet to access all features"}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Link
                  href={route("outlets.index")}
                  className="inline-flex items-center justify-center w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                >
                  <Store size={16} className="mr-2" />
                  {locale === "bn" ? "আউটলেট ম্যানেজ করুন" : "Manage Outlets"}
                </Link>
              </div>
            </div>
          )}

          {/* Search - শুধু outlet লগইন করা থাকলে দেখান */}
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
                    const isActive =
                      currentRoute === item.active ||
                      (item.children ? item.children.some((c) => currentRoute === c.active) : false);

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
                          <Link
                            href={item.route ? getRouteUrl(item) : "#"}
                            className="flex items-center gap-3 px-4 py-3 group"
                            onClick={() => setStatus(false)}
                          >
                            <span className={`${isActive ? "text-white" : "text-white/70 group-hover:text-white"}`}>
                              {getIconComponent(item.icon || "dashboard")}
                            </span>
                            <span
                              className={`font-medium ${
                                locale === "bn" ? "text-sm leading-relaxed" : ""
                              } ${isActive ? "text-white" : "text-white/90 group-hover:text-white"}`}
                            >
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
                  {locale === "bn" ? "শুধুমাত্র আউটলেট ওভারভিউ" : "Outlet Overview Only"}
                </p>
                <p className="text-white/60 text-xs">
                  {locale === "bn"
                    ? "সম্পূর্ণ মেনু দেখতে আউটলেটে লগইন করুন"
                    : "Login to an outlet to see full menu"}
                </p>
              </div>
            )}
          </nav>

          {/* Current Outlet Info (যখন লগইন করা থাকে) */}
          {isLoggedIntoOutlet && auth?.user?.current_outlet && (
            <div className="relative group">
              <div className="mt-3 mb-2 px-3 py-2 bg-gradient-to-r from-white/5 to-white/3 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500/80 to-emerald-600/80 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <Store size={12} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-xs truncate">
                      {auth.user.current_outlet.name}
                    </p>
                    <p className="text-white/50 text-[10px] truncate">
                      {auth.user.current_outlet.code}
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating action button */}
              <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Link
                  href={route("outlets.logout")}
                  method="post"
                  as="button"
                  className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg border border-white/10"
                  title={locale === "bn" ? "আউটলেট লগআউট" : "Logout from Outlet"}
                >
                  <LogOut size={10} className="text-white" />
                </Link>
              </div>

              {/* Tooltip on hover */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="bg-[#1e4d2b] text-white text-xs px-3 py-1.5 rounded-lg shadow-lg border border-white/10 whitespace-nowrap">
                  {locale === "bn" ? "বর্তমান আউটলেট" : "Current Outlet"}
                  <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#1e4d2b]"></div>
                </div>
              </div>
            </div>
          )}
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
