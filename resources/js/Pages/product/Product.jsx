import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { Eye, Frown, Pen, Plus, Trash2 } from "lucide-react";

export default function Product({ product, filters }) {
    const { auth } = usePage().props;

    // handle search
    const searchForm = useForm({
        search: filters.search || "",
    });
    const handleSearch = (e) => {
        const value = e.target.value;

        searchForm.setData("search", value);

        const queryString = value ? { search: value } : {};

        router.get(route("product.list"), queryString, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title="Product list"
                subtitle="Manage your all product from here."
            >
                <div className="flex items-center gap-3">
                    <input
                        type="search"
                        onChange={handleSearch}
                        value={searchForm.data.search}
                        placeholder="Search.."
                        className="input input-sm"
                    />
                    {auth.role === "admin" && (
                        <button
                            onClick={() => router.visit(route("product.add"))}
                            className="btn btn-primary btn-sm"
                        >
                            <Plus size={15} /> Add new
                        </button>
                    )}
                </div>
            </PageHeader>

            <div className="overflow-x-auto">
                {product.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th></th>
                                <th>Product Code</th>
                                <th>Product</th>
                                <th>Gross Price</th>
                                <th>Discount</th>
                                <th>Stock</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {product.data.map((user, index) => (
                                <tr key={index}>
                                    <th>{index + 1}</th>
                                    <td>{user.product_no}</td>
                                    <td>{user.name}</td>
                                    <td>{user.gross_price} Tk</td>
                                    <td>{user.discount || 0} %</td>
                                    <td className="flex flex-items gap-1 flex-wrap max-w-[300px]">
                                        {user?.sizes.map((val, i) => (
                                            <div
                                                key={i}
                                                className="border border-dashed border-box p-1 border-neutral flex items-center gap-1 flex-wrap"
                                            >
                                                <p className="text-neutral uppercase font-semibold">
                                                    {val.name}
                                                    {":"}
                                                </p>
                                                <div className="flex flex-wrap text-neutral items-center gap-1">
                                                    {val?.colors.map(
                                                        (val, i) => (
                                                            <div
                                                                key={i}
                                                                className="text-xs border-r border-gray-400 pr-1.5 mr-0.5 last:border-r-0"
                                                            >
                                                                <span className="uppercase">
                                                                    {val?.name}
                                                                    {"("}
                                                                    {val?.stock}
                                                                    {")"}
                                                                </span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            {auth.role === "admin" && (
                                                <>
                                                    <Link
                                                        href={route(
                                                            "product.add",
                                                            { id: user.id }
                                                        )}
                                                        className="btn btn-xs btn-info"
                                                    >
                                                        <Pen size={10} /> Edit
                                                    </Link>
                                                    <Link
                                                        href={route(
                                                            "product.del",
                                                            {
                                                                id: user.id,
                                                            }
                                                        )}
                                                        onClick={(e) => {
                                                            if (
                                                                !confirm(
                                                                    "Are you sure you want to delete this product?"
                                                                )
                                                            ) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className="btn btn-xs btn-error"
                                                    >
                                                        <Trash2 size={10} />{" "}
                                                        Delete
                                                    </Link>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-10 flex flex-col justify-center items-center gap-2">
                        <Frown size={20} className="text-gray-500" />
                        <h1 className="text-gray-500 text-sm">
                            Data not found!
                        </h1>
                        <button
                            onClick={() => router.visit(route("product.add"))}
                            className="btn btn-primary btn-sm"
                        >
                            <Plus size={15} /> Add new
                        </button>
                    </div>
                )}
            </div>

            {/* pagination */}
            <Pagination data={product} />
        </div>
    );
}
