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
        title: "Dashboard",
        icon: <Home size={16} />,
        route: route("home"),
        active: "home",
        role: "all",
    },
    {
        title: "Add Sales",
        icon: <BaggageClaim size={16} />,
        route: route("sales.create"),
        active: "sales.add",
        role: "all",
    },
    {
        title: "All Sales",
        icon: <BadgeCent size={16} />,
        route: route("sales.list.all"),
        active: "sales.list.all",
        role: "all",
    },
    // New Purchase Menu Items
    {
        title: "Purchase",
        icon: <Receipt size={16} />,
        route: route("purchase.list"),
        active: "purchase.list",
        role: "all",
    },
    {
        title: "Add Purchase",
        icon: <ArrowRightLeft size={16} />,
        route: route("purchase.create"),
        active: "purchase.create",
        role: "admin",
    },
    // New Warehouse Menu Item
    {
        title: "Warehouse",
        icon: <Warehouse size={16} />,
        route: route("warehouse.list"),
        active: "warehouse.list",
        role: "all",
    },
    {
        title: "Supplier",
        icon: <ShoppingBasket size={16} />,
        route: route("supplier.view"),
        active: "supplier.view",
        role: "all",
    },
    {
        title: "Products",
        icon: <ShoppingBasket size={16} />,
        route: route("product.list"),
        active: "product.list",
        role: "all",
    },
    {
        title: "Add Products",
        icon: <ShoppingBag size={16} />,
        route: route("product.add"),
        active: "product.add",
        role: "admin",
    },
    {
        title: "Categorys",
        icon: <Box size={16} />,
        route: route("category.view"),
        active: "category.view",
        role: "all",
    },
    {
        title: "Extra cash",
        icon: <BanknoteArrowUp size={16} />,
        route: route("extra.cash.all"),
        active: "extra.cash.all",
        role: "all",
    },
    {
        title: "Expense",
        icon: <WalletMinimal size={16} />,
        route: route("expenses.list"),
        active: "expenses.list",
        role: "all",
    },
    {
        title: "Barcode",
        icon: <Barcode size={16} />,
        route: route("barcode.print"),
        active: "barcode.print",
        role: "admin",
    },
    {
        title: "Customer",
        icon: <UserPlus size={16} />,
        route: route("customer.index"),
        active: "customer.index",
        role: "all",
    },
    {
        title: "Users",
        icon: <User size={16} />,
        route: route("userlist.view"),
        active: "userlist.view",
        role: "admin",
    },
];

export { baseMenu };