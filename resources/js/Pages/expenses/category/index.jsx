import { Link, router, useForm, usePage } from "@inertiajs/react";
import PageHeader from "../../../components/PageHeader";
import Pagination from "../../../components/Pagination";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

// Safe icon component with fallback
const SafeIcon = ({ icon: Icon, fallback, size = 20, className = "", ...props }) => {
  if (!Icon || typeof Icon === 'undefined') {
    const FallbackComponent = fallback || (() => <span>□</span>);
    return <FallbackComponent size={size} className={className} {...props} />;
  }
  return <Icon size={size} className={className} {...props} />;
};

// Simple fallback icons
const FallbackPlus = ({ size, className }) => <span className={className}>+</span>;
const FallbackX = ({ size, className }) => <span className={className}>×</span>;
const FallbackTrash = ({ size, className }) => <span className={className}>🗑</span>;
const FallbackFrown = ({ size, className }) => <span className={className}>☹</span>;
const FallbackBanknote = ({ size, className }) => <span className={className}>💰</span>;
const FallbackHandCoins = ({ size, className }) => <span className={className}>🤝</span>;
const FallbackLandmark = ({ size, className }) => <span className={className}>🏛</span>;
const FallbackPiggyBank = ({ size, className }) => <span className={className}>🐷</span>;
const FallbackWallet = ({ size, className }) => <span className={className}>👛</span>;

export default function Index({
  todaysExpenseTotal,
  todaysCategoriesCount,
  extracashTotal,
  amount,
  query,
}) {
  // State for icons
  const [icons, setIcons] = useState({});
  const [iconsLoaded, setIconsLoaded] = useState(false);

  const categories = usePage().props.categories.data;
  console.log("Categories:", categories,todaysCategoriesCount);


  // Dynamically load icons
  useEffect(() => {
    const loadIcons = async () => {
      try {
        const lucideIcons = await import("lucide-react");
        setIcons(lucideIcons);
        setIconsLoaded(true);
      } catch (error) {
        console.error("Failed to load icons:", error);
        setIconsLoaded(true); 
      }
    };

    loadIcons();
  }, []);

  // Model state
  const [model, setModel] = useState(false);

  // Search states
  const [startdate, setStartDate] = useState(query?.startdate || "");
  const [date, setDate] = useState(query?.date || "");
  const [initialized, setInitialized] = useState(false);

  // Search effect
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      return;
    }
    
    const searchParams = {};
    if (startdate) searchParams.startdate = startdate;
    if (date) searchParams.date = date;
    
    if (Object.keys(searchParams).length > 0) {
      router.get(route("expenses.list", searchParams));
    }
  }, [date, startdate]);

  // Expense form
  const { setData, data, errors, processing, reset, post } = useForm({
    date: new Date().toISOString().split('T')[0], 
    description: "",
    name: "",
  });

  const formSubmit = (e) => {
    e.preventDefault();
    post(route("expenses.post"), {
      onSuccess: () => {
        reset();
        modelClose();
        toast.success("Expense added successfully!");
      },
      onError: () => {
        toast.error("Failed to add expense!");
      },
    });
  };

  // Close add modal
  const modelClose = () => {
    reset();
    setModel(false);
  };

  // Format currency
  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Calculate total in cash
  const totalInCash = (Number(amount?.totals?.cash) || 0) - (Number(todaysExpenseTotal) || 0);
  const isNegativeCash = totalInCash < 0;

  // Show loading state while icons are loading
  if (!iconsLoaded) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-box p-5">
      <PageHeader
        title="Expense List"
        subtitle="Manage all your expenses from here"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startdate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input input-sm border-gray-300"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input input-sm border-gray-300"
              placeholder="End Date"
            />
            {(date || startdate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setDate("");
                  router.visit(route("expenses.list"));
                }}
                className="btn btn-sm btn-error btn-outline"
                title="Clear filters"
              >
                <SafeIcon 
                  icon={icons.X} 
                  fallback={FallbackX}
                  size={13} 
                />
              </button>
            )}
          </div>

          <button
            onClick={() => setModel(true)}
            className="btn btn-primary btn-sm"
          >
            <SafeIcon 
              icon={icons.Plus} 
              fallback={FallbackPlus}
              size={15} 
            /> Add New Expense
          </button>
        </div>
      </PageHeader>

      <div className="overflow-x-auto mt-4">
        {todaysCategoriesCount > 0 ? (
          <table className="table table-auto w-full border-collapse">
            <thead className="bg-primary text-white">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Slug</th>
                <th className="px-4 py-2">Descriptions</th>
                <th className="px-4 py-2">Created At</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <tr key={category.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-gray-600">{category.slug}</p>
                    </div>
                  </td>
                    <td className="px-4 py-3 max-w-xs truncate" title={category.slug}>
                        {category.slug}
                    </td>

                  <td className="px-4 py-3 max-w-xs truncate" title={category.description}>
                    {category.description}
                  </td>
             
                  <td className="px-4 py-3">{category.created_at}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={route("expenses.del", { id: category.id })}
                      onClick={(e) => {
                        if (!confirm("Are you sure you want to delete this expense?")) {
                          e.preventDefault();
                        }
                      }}
                      className="btn btn-xs btn-error btn-outline"
                    >
                      <SafeIcon 
                        icon={icons.Trash2} 
                        fallback={FallbackTrash}
                        size={12} 
                      /> Delete
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="border border-gray-200 rounded-box px-5 py-10 flex flex-col justify-center items-center gap-3 text-center">
            <SafeIcon 
              icon={icons.Frown} 
              fallback={FallbackFrown}
              size={24} 
              className="text-gray-400" 
            />
            <h1 className="text-gray-500 text-sm">No expenses found!</h1>
            <button
              onClick={() => setModel(true)}
              className="btn btn-primary btn-sm mt-2"
            >
              <SafeIcon 
                icon={icons.Plus} 
                fallback={FallbackPlus}
                size={15} 
              /> Add New Expense
            </button>
          </div>
        )}
      </div>

      {todaysCategoriesCount> 0 && (
        <div className="mt-4">
          <Pagination data={categories} />
        </div>
      )}

      {/* Summary Section */}
      <div className="border-t border-gray-200 p-5 mt-6">
        <h1 className="text-lg font-semibold text-gray-700 mb-4">
          Today's Summary
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="border border-dashed border-primary rounded-box p-4 flex items-start gap-3 bg-blue-50">
            <SafeIcon 
              icon={icons.Landmark} 
              fallback={FallbackLandmark}
              size={20} 
              className="text-primary mt-1" 
            />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Banking</p>
              <h1 className="text-lg font-bold text-gray-800">
                {formatCurrency(amount?.totals?.bank)} Tk
              </h1>
            </div>
          </div>

          <div className="border border-dashed border-primary rounded-box p-4 flex items-start gap-3 bg-blue-50">
            <SafeIcon 
              icon={icons.Wallet} 
              fallback={FallbackWallet}
              size={20} 
              className="text-primary mt-1" 
            />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Mobile Banking</p>
              <h1 className="text-lg font-bold text-gray-800">
                {formatCurrency(amount?.totals?.mobilebanking)} Tk
              </h1>
            </div>
          </div>

          <div className="border border-dashed border-primary rounded-box p-4 flex items-start gap-3 bg-blue-50">
            <SafeIcon 
              icon={icons.HandCoins} 
              fallback={FallbackHandCoins}
              size={20} 
              className="text-primary mt-1" 
            />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cash</p>
              <h1 className="text-lg font-bold text-gray-800">
                {formatCurrency(amount?.totals?.cash)} Tk
              </h1>
            </div>
          </div>

          <div className="border border-dashed border-primary rounded-box p-4 flex items-start gap-3 bg-blue-50">
            <SafeIcon 
              icon={icons.PiggyBank} 
              fallback={FallbackPiggyBank}
              size={20} 
              className="text-primary mt-1" 
            />
            <div>
              <p className="text-sm font-medium text-gray-600">Extra Cash</p>
              <h1 className="text-lg font-bold text-gray-800">
                {formatCurrency(extracashTotal)} Tk
              </h1>
            </div>
          </div>

          <div className="border border-dashed border-error rounded-box p-4 flex items-start gap-3 bg-red-50">
            <SafeIcon 
              icon={icons.BanknoteX} 
              fallback={FallbackBanknote}
              size={20} 
              className="text-error mt-1" 
            />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expense</p>
              <h1 className="text-lg font-bold text-error">
                {formatCurrency(todaysExpenseTotal)} Tk
              </h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-dashed border-primary rounded-box p-4 flex items-start gap-3 bg-green-50">
            <SafeIcon 
              icon={icons.BanknoteX} 
              fallback={FallbackBanknote}
              size={20} 
              className="text-primary mt-1" 
            />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <h1 className="text-lg font-bold text-primary">
                {formatCurrency(amount?.grandTotal)} Tk
              </h1>
            </div>
          </div>

          <div className={`border border-dashed rounded-box p-4 flex items-center justify-between ${
            isNegativeCash ? 'border-error bg-red-50' : 'border-primary bg-blue-50'
          }`}>
            <div className="flex items-center gap-3">
              <SafeIcon 
                icon={icons.HandCoins} 
                fallback={FallbackHandCoins}
                size={20} 
                className={isNegativeCash ? 'text-error' : 'text-primary'} 
              />
              <p className="text-sm font-medium text-gray-600">Total In Cash</p>
            </div>
            <h1 className={`text-lg font-bold ${isNegativeCash ? 'text-error' : 'text-primary'}`}>
              {formatCurrency(totalInCash)} Tk
              {isNegativeCash && (
                <span className="text-xs font-normal ml-2">(Deficit)</span>
              )}
            </h1>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      <dialog className={`modal ${model ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-md">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
            <h1 className="text-lg font-semibold text-gray-900">
              Add New Expense Category
            </h1>
            <button
              onClick={modelClose}
              className="btn btn-circle btn-xs btn-ghost text-gray-500 hover:text-error"
            >
              <SafeIcon 
                icon={icons.X} 
                fallback={FallbackX}
                size={16} 
              />
            </button>
          </div>

          <form onSubmit={formSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Date *</span>
              </label>
              <input
                type="date"
                value={data.date}
                onChange={(e) => setData("date", e.target.value)}
                className="input input-bordered w-full"
                required
              />
              {errors.date && (
                <p className="text-error text-sm mt-1">{errors.date}</p>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Details</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="Enter expense details..."
                value={data.details}
                onChange={(e) => setData("details", e.target.value)}
              />
              {errors.details && (
                <p className="text-error text-sm mt-1">{errors.details}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Amount *</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={data.amount}
                  onChange={(e) => setData("amount", e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="0.00"
                  required
                />
                {errors.amount && (
                  <p className="text-error text-sm mt-1">{errors.amount}</p>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">SH Amount *</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={data.sh_amount}
                  onChange={(e) => setData("sh_amount", e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="0.00"
                  required
                />
                {errors.sh_amount && (
                  <p className="text-error text-sm mt-1">{errors.sh_amount}</p>
                )}
              </div>
            </div>

            <div className="modal-action">
              <button
                type="button"
                onClick={modelClose}
                className="btn btn-ghost"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="btn btn-primary"
              >
                {processing ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  'Add Expense'
                )}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}