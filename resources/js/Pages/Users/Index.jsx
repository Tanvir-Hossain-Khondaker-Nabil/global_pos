import React from "react";
import { Head, Link, useForm, router } from "@inertiajs/react";

// Icons
const Search = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const Filter = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const Plus = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);
const Users = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const Shield = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
  </svg>
);
const CheckCircle = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);
const Edit = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const Trash = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

export default function Index({ users, roles, filters, statistics }) {
  const { data, setData, get } = useForm({
    search: filters?.search || "",
    role: filters?.role || "",
    page: filters?.page || 1,
  });

  const handleFilter = () => {
    get(route("userlist.view"), {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleReset = () => {
    setData({
      search: "",
      role: "",
      page: 1,
    });
    get(route("userlist.view"), {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handlePageChange = (page) => {
    setData("page", page);
    get(route("userlist.view"), {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleStatusToggle = (userId) => {
    // Since is_active column doesn't exist, show message
    alert(
      "User status toggle functionality is not available. All users are active by default."
    );
  };

  const handleDelete = (userId, userName) => {
    if (
      confirm(
        `Are you sure you want to delete user "${userName}"? This action cannot be undone.`
      )
    ) {
      router.get(route("userlist.delete", userId), {
        preserveScroll: true,
        onSuccess: () => {
          // Success message is handled by the controller redirect
        },
        onError: (errors) => {
          alert("Failed to delete user. Please try again.");
        },
      });
    }
  };

  // Convert users to array for calculations
  const usersArray = users.data || [];

  const gradient = "linear-gradient(rgb(15, 45, 26) 0%, rgb(30, 77, 43) 100%)";

  return (
    <>
      <Head>
        <title>Users Management</title>
      </Head>

      <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans text-gray-900">
        {/* Header Section */}
        <div
          className="mb-8 rounded-2xl p-6 sm:p-8 text-white shadow-sm border border-emerald-900/10"
          style={{ background: gradient }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold">
                  Users Management
                </h1>
                <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white ring-1 ring-white/20">
                  {statistics.total_users} Users
                </span>
              </div>
              <p className="mt-2 text-white/80">
                Manage user accounts and permissions
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href={route("users.create")}
                className="group flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add User
              </Link>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-xl text-white shadow-sm"
                style={{ background: gradient }}
              >
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">
                  Total Users
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {statistics.total_users}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Shield className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">
                  Administrators
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {statistics.admins_count}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Users className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Sellers</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {statistics.sellers_count}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">
                  Active Users
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {statistics.active_users}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={data.search}
                  onChange={(e) => setData("search", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-4 focus:ring-emerald-200/60 focus:border-emerald-600 transition-all"
                />
              </div>
            </div>

            <div className="w-full sm:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Role
              </label>
              <select
                value={data.role}
                onChange={(e) => setData("role", e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-4 focus:ring-emerald-200/60 focus:border-emerald-600 transition-all"
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-3">
              <button
                onClick={handleFilter}
                className="flex items-center gap-2 h-12 px-6 rounded-xl text-white font-semibold shadow-sm hover:shadow-md transition-all"
                style={{ background: gradient }}
              >
                <Filter className="h-4 w-4" />
                Apply Filters
              </button>
              <button
                onClick={handleReset}
                className="h-12 px-6 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {usersArray.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-emerald-50/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 flex-shrink-0">
                          {user.avatar ? (
                            <img
                              src={`/media/uploads/${user.avatar}`}
                              alt={user.name}
                              className="h-12 w-12 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div
                              className="h-12 w-12 rounded-full flex items-center justify-center border border-emerald-900/10 text-white shadow-sm"
                              style={{ background: gradient }}
                            >
                              <span className="font-semibold text-lg">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="font-semibold text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="text-sm text-gray-500">
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                              role === "admin"
                                ? "bg-rose-100 text-rose-800 ring-rose-200"
                                : role === "seller"
                                ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
                                : role === "buyer"
                                ? "bg-sky-100 text-sky-800 ring-sky-200"
                                : "bg-gray-100 text-gray-800 ring-gray-200"
                            }`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-600"></div>
                          Active
                        </span>

                        <button
                          onClick={() => handleStatusToggle(user.id)}
                          className="ml-3 text-sm font-medium text-emerald-800 hover:text-emerald-950 underline underline-offset-4"
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {user.join_at}
                      {user.last_login && (
                        <div className="text-xs text-gray-400 mt-1">
                          Last login: {user.last_login}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={route("userlist.edit", user.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Link>

                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 transition-colors text-sm font-medium"
                        >
                          <Trash className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {usersArray.length === 0 && (
            <div className="text-center py-16">
              <div className="mx-auto h-16 w-16 text-gray-400">
                <Users className="h-16 w-16" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No users found
              </h3>
              <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                {data.search || data.role
                  ? "No users match your search criteria. Try changing your filters."
                  : "Get started by creating your first user account."}
              </p>
              <div className="mt-6">
                <Link
                  href={route("users.create")}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
                  style={{ background: gradient }}
                >
                  <Plus className="h-4 w-4" />
                  Add User
                </Link>
              </div>
            </div>
          )}

          {/* Pagination */}
          {users.meta && users.meta.total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 px-6 py-4">
              <div className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-semibold">
                  {(users.meta.current_page - 1) * users.meta.per_page + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold">
                  {Math.min(
                    users.meta.current_page * users.meta.per_page,
                    users.meta.total
                  )}
                </span>{" "}
                of <span className="font-semibold">{users.meta.total}</span>{" "}
                users
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(users.meta.current_page - 1)}
                  disabled={users.meta.current_page === 1}
                  className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, users.meta.last_page) },
                    (_, i) => {
                      let pageNum;
                      if (users.meta.last_page <= 5) {
                        pageNum = i + 1;
                      } else if (users.meta.current_page <= 3) {
                        pageNum = i + 1;
                      } else if (
                        users.meta.current_page >=
                        users.meta.last_page - 2
                      ) {
                        pageNum = users.meta.last_page - 4 + i;
                      } else {
                        pageNum = users.meta.current_page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`min-w-[40px] h-10 rounded-xl text-sm font-medium transition-colors ${
                            pageNum === users.meta.current_page
                              ? "text-white shadow-sm"
                              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                          style={
                            pageNum === users.meta.current_page
                              ? { background: gradient }
                              : undefined
                          }
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )}
                </div>

                <button
                  onClick={() => handlePageChange(users.meta.current_page + 1)}
                  disabled={users.meta.current_page === users.meta.last_page}
                  className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
