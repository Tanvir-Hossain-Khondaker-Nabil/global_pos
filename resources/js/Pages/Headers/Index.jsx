import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  Store,
  FileText,
  Calendar,
  User
} from 'lucide-react';

export default function Index({ auth, headers, outlets }) {
  const [search, setSearch] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const filteredHeaders = headers.data.filter(header => {
    const matchesSearch = search === '' || 
      header.title.toLowerCase().includes(search.toLowerCase()) ||
      header.sitebar_name.toLowerCase().includes(search.toLowerCase()) ||
      (header.outlet?.name || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesOutlet = selectedOutlet === '' || 
      header.outlet_id === parseInt(selectedOutlet);
    
    return matchesSearch && matchesOutlet;
  });

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this header?')) {
      router.delete(route('headers.destroy', id), {
        preserveScroll: true,
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  return (
    
      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
              {/* Header and Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Outlet Headers</h3>
                  <p className="text-sm text-gray-500">Configure header settings for each outlet</p>
                </div>
                
                <Link
                  href={route('headers.create')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Plus size={18} />
                  Create Header
                </Link>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Search headers..."
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Outlet</label>
                  <select
                    value={selectedOutlet}
                    onChange={(e) => setSelectedOutlet(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">All Outlets</option>
                    {outlets.map(outlet => (
                      <option key={outlet.id} value={outlet.id}>
                        {outlet.name} ({outlet.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Headers Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Outlet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sidebar Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Favicon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHeaders.length > 0 ? (
                      filteredHeaders.map((header) => (
                        <tr key={header.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Store size={16} className="text-green-600" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {header.outlet?.name || 'N/A'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {header.outlet?.code || ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{header.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{header.sitebar_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {header.fav_icon ? (
                              <img 
                                src={header.fav_icon_url} 
                                alt="Favicon" 
                                className="w-8 h-8 rounded"
                              />
                            ) : (
                              <span className="text-xs text-gray-400">No favicon</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar size={14} />
                              {new Date(header.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <Link
                                href={route('headers.show', header.id)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="View"
                              >
                                <Eye size={16} />
                              </Link>
                              <Link
                                href={route('headers.edit', header.id)}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </Link>
                              <button
                                onClick={() => handleDelete(header.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center">
                          <div className="text-gray-500">
                            {headers.data.length === 0 ? (
                              <div className="space-y-2">
                                <FileText className="w-12 h-12 mx-auto text-gray-300" />
                                <p>No headers found.</p>
                                <Link
                                  href={route('headers.create')}
                                  className="inline-block mt-2 text-green-600 hover:text-green-700 font-medium"
                                >
                                  Create your first header →
                                </Link>
                              </div>
                            ) : (
                              <div>
                                <Search className="w-12 h-12 mx-auto text-gray-300" />
                                <p>No headers match your filters.</p>
                                <button
                                  onClick={() => {
                                    setSearch('');
                                    setSelectedOutlet('');
                                  }}
                                  className="mt-2 text-sm text-green-600 hover:text-green-700"
                                >
                                  Clear filters
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {headers.data.length > 0 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {headers.from} to {headers.to} of {headers.total} results
                  </div>
                  <div className="flex gap-2">
                    {headers.links.map((link, index) => (
                      <Link
                        key={index}
                        href={link.url || '#'}
                        className={`px-3 py-1 rounded ${
                          link.active
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                        disabled={!link.url}
                      >
                        {link.label.replace('&laquo;', '«').replace('&raquo;', '»')}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}