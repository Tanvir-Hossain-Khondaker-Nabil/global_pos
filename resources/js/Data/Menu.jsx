import {
    ArrowRightLeft,
    BadgeCent,
    BaggageClaim,
    BanknoteArrowUp,
    Barcode,
    Box,
    Home,
    ShoppingBag,
    ShoppingBasket,
    User,
    UserPlus,
    WalletMinimal,
    Warehouse,
    Receipt,
} from "lucide-react";

// Common menu
const baseMenu = [
    {
        title: "ড্যাশবোর্ড",
        icon: <Home size={16} />,
        route: route("home"),
        active: "home",
        role: "all",
    },
    {
        title: "বিক্রয় যোগ করুন (ইনভেন্টরি)",
        icon: <BaggageClaim size={16} />,
        route: route("sales.create"),
        active: "sales.add",
        role: "all",
    },
    {
        title: "সমস্ত অর্ডার (ইনভেন্টরি)",
        icon: <BadgeCent size={16} />,
        route: route("sales.index"),
        active: "sales.index",
        role: "all",
    },

    {
        title: "সমস্ত বিক্রয় আইটেম",
        icon: <BadgeCent size={16} />,
        route: route("salesItems.list"),
        active: "salesItems.list",
        role: "all",
    },
    // New Purchase Menu Items
    {
        title: "ক্রয়",
        icon: <Receipt size={16} />,
        route: route("purchase.list"),
        active: "purchase.list",
        role: "all",
    },
    {
        title: "ক্রয় যোগ করুন",
        icon: <ArrowRightLeft size={16} />,
        route: route("purchase.create"),
        active: "purchase.create",
        role: "admin",
    },
    // New Warehouse Menu Item
    {
        title: "গুদাম",
        icon: <Warehouse size={16} />,
        route: route("warehouse.list"),
        active: "warehouse.list",
        role: "all",
    },
    {
        title: "সরবরাহকারী",
        icon: <ShoppingBasket size={16} />,
        route: route("supplier.view"),
        active: "supplier.view",
        role: "all",
    },
    {
        title: "পণ্য",
        icon: <ShoppingBasket size={16} />,
        route: route("product.list"),
        active: "product.list",
        role: "all",
    },
    {
        title: "পণ্য যোগ করুন",
        icon: <ShoppingBag size={16} />,
        route: route("product.add"),
        active: "product.add",
        role: "admin",
    },
    {
        title: "ক্যাটাগরি",
        icon: <Box size={16} />,
        route: route("category.view"),
        active: "category.view",
        role: "all",
    },
    {
        title: "অতিরিক্ত ক্যাশ",
        icon: <BanknoteArrowUp size={16} />,
        route: route("extra.cash.all"),
        active: "extra.cash.all",
        role: "all",
    },
    {
        title: "খরচ",
        icon: <WalletMinimal size={16} />,
        route: route("expenses.list"),
        active: "expenses.list",
        role: "all",
    },
    {
        title: "বারকোড",
        icon: <Barcode size={16} />,
        route: route("barcode.print"),
        active: "barcode.print",
        role: "admin",
    },
    {
        title: "গ্রাহক",
        icon: <UserPlus size={16} />,
        route: route("customer.index"),
        active: "customer.index",
        role: "all",
    },
    {
        title: "ব্যবহারকারী",
        icon: <User size={16} />,
        route: route("userlist.view"),
        active: "userlist.view",
        role: "admin",
    },
];

export { baseMenu };