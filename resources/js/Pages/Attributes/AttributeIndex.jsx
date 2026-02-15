import React, { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import {
  Plus,
  Trash,
  Edit,
  X,
  Settings2,
  Hash,
  ChevronDown,
  ChevronUp,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

// Sub-components for better separation of concerns
const AttributeFormModal = ({
  isOpen,
  editingAttribute,
  attributeForm,
  onClose,
  onSubmit,
  onAddValueField,
  onValueChange,
  onRemoveValueField
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      {/* Changed backdrop - removed blur effect */}
      <div
        className="fixed inset-0 backdrop-blur-sm bg-opacity-50 animate-fade-in"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl border-2 border-gray-900 shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden animate-slide-up z-10">
        <div className="bg-gray-900 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Settings2 size={16} className="text-red-500" />
            <h2 className="text-white text-sm font-bold uppercase">
              {editingAttribute ? 'Edit Attribute' : 'New Attribute'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(85vh-64px)]">
          <form onSubmit={onSubmit} className="p-5">
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                Attribute Name
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg font-medium focus:border-red-500 focus:ring-1 focus:ring-red-500"
                value={attributeForm.data.name}
                onChange={(e) => attributeForm.setData('name', e.target.value)}
                placeholder="e.g. Engine Size"
                autoFocus
              />
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Hash size={14} className="text-gray-600" />
                  <h3 className="text-xs font-bold uppercase text-gray-600">Values</h3>
                </div>
                <button
                  type="button"
                  onClick={onAddValueField}
                  className="px-3 py-1.5 bg-gray-900 hover:bg-red-600 text-white font-bold text-xs uppercase rounded flex items-center gap-1"
                >
                  <Plus size={12} />
                  Add Value
                </button>
              </div>

              <div className="space-y-2">
                {attributeForm.data.values.map((v, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      className="flex-1 p-2.5 border border-gray-300 rounded font-medium focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      value={v.value}
                      onChange={(e) => onValueChange(i, e.target.value)}
                      placeholder="Enter value"
                    />
                    {attributeForm.data.values.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveValueField(i)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-xs rounded-lg shadow transition-colors"
              >
                {editingAttribute ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const AttributeCardHeader = ({
  attribute,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete
}) => (
  <div
    onClick={() => onToggleExpand(attribute.id)}
    className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
  >
    <div className="flex justify-between items-center">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-lg font-bold text-gray-900">{attribute.name}</h3>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 font-mono text-xs rounded">
            {attribute.code}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {attribute.values.slice(0, 4).map((v) => (
            <div key={v.id} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full">
              <span className="font-medium text-sm">{v.value}</span>
              <span className="text-gray-500 text-xs font-mono">({v.code})</span>
            </div>
          ))}
          {attribute.values.length > 4 && (
            <span className="px-3 py-1.5 bg-gray-200 text-gray-600 font-medium text-sm rounded-full">
              +{attribute.values.length - 4} more
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(attribute);
          }}
          className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs rounded flex items-center gap-1"
        >
          <Edit size={12} />
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(attribute);
          }}
          className="px-3 py-1.5 border border-red-200 hover:border-red-600 hover:bg-red-50 text-red-600 hover:text-red-700 font-medium text-xs rounded flex items-center gap-1"
        >
          <Trash size={12} />
          Delete
        </button>
        <div className="ml-1">
          {isExpanded ? (
            <ChevronUp size={18} className="text-gray-400" />
          ) : (
            <ChevronDown size={18} className="text-gray-400" />
          )}
        </div>
      </div>
    </div>
  </div>
);

const AttributeValuesTable = ({
  attribute,
  addingValues,
  onAddValue,
  onNewValueChange,
  onSubmitNewValue,
  onDeleteValue,
  onCancelAddValue
}) => (
  <div className="border-t border-gray-100">
    <div className="p-5">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="h-64 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="text-left p-3 font-bold uppercase text-gray-600 text-xs border-b border-gray-200">
                  Display Value
                </th>
                <th className="text-left p-3 font-bold uppercase text-gray-600 text-xs border-b border-gray-200">
                  Code
                </th>
                <th className="text-right p-3 font-bold uppercase text-gray-600 text-xs border-b border-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {attribute.values.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-6 text-center text-gray-500 text-sm">
                    No values added yet
                  </td>
                </tr>
              ) : (
                attribute.values.map((value) => (
                  <tr key={value.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900 text-sm">
                      {value.value}
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs">
                        {value.code}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onDeleteValue(attribute.id, value.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {addingValues[attribute.id] && (
        <div className="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <form onSubmit={(e) => onSubmitNewValue(attribute.id, e)} className="flex gap-3 items-center">
            <input
              type="text"
              className="flex-1 p-2.5 border border-gray-300 rounded font-medium focus:border-red-500 focus:ring-1 focus:ring-red-500"
              value={addingValues[attribute.id].value}
              onChange={(e) => onNewValueChange(attribute.id, e.target.value)}
              placeholder="Enter new value"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => onCancelAddValue(attribute.id)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  </div>
);

const EmptyState = ({ onCreate }) => (
  <div className="text-center py-10 bg-white rounded-lg shadow border border-gray-200">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Settings2 size={28} className="text-gray-400" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">No Attributes Yet</h3>
    <p className="text-gray-600 text-sm mb-6">Create your first attribute to get started</p>
    <button
      onClick={onCreate}
      className="px-5 py-2.5 bg-gray-900 hover:bg-red-600 text-white font-bold uppercase text-xs rounded-lg shadow transition-colors flex items-center gap-1.5 mx-auto"
    >
      <Plus size={14} />
      Create First Attribute
    </button>
  </div>
);

// Search Component
const SearchBar = ({ searchTerm, setSearchTerm, handleSearch, totalResults }) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [typingTimeout, setTypingTimeout] = useState(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocalSearchTerm(value);

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout for debouncing
    const timeout = setTimeout(() => {
      setSearchTerm(value);
      handleSearch(value);
    }, 500);

    setTypingTimeout(timeout);
  };

  const handleClearSearch = () => {
    setLocalSearchTerm('');
    setSearchTerm('');
    handleSearch('');
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Search attributes by name or code..."
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          value={localSearchTerm}
          onChange={handleInputChange}
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Search className="w-4 h-4 text-gray-400" size={16} />
        </div>
        {localSearchTerm && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        )}
      </div>
      {searchTerm && (
        <div className="mt-1 text-xs text-gray-500">
          Found {totalResults} attribute{totalResults !== 1 ? 's' : ''} matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};

// Pagination Component with working Previous and Next buttons
const Pagination = ({ links, currentPage, total, from, to, handlePageChange }) => {
  // Find previous and next links
  const prevLink = links.find(link => link.label.toLowerCase().includes('previous') || link.label === '‹');
  const nextLink = links.find(link => link.label.toLowerCase().includes('next') || link.label === '›');
  
  // Filter page links (excluding previous, next, and ellipsis)
  const pageLinks = links.filter(link => 
    !link.label.toLowerCase().includes('previous') && 
    !link.label.toLowerCase().includes('next') &&
    link.label !== '‹' && 
    link.label !== '›' &&
    link.label !== '…'
  );

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
      <div className="text-sm text-gray-600">
        Showing <span className="font-medium">{from}</span> to <span className="font-medium">{to}</span> of{' '}
        <span className="font-medium">{total}</span> results
      </div>

      <div className="flex items-center gap-2">
        {/* Previous Button */}
        {prevLink && prevLink.url ? (
          <button
            onClick={() => handlePageChange(prevLink.url)}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
        ) : (
          <button
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-400 bg-gray-50 cursor-not-allowed"
            disabled
          >
            <ChevronLeft size={16} />
            Previous
          </button>
        )}

        {/* Page Numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {pageLinks.map((link, index) => {
            // Skip previous and next links for page numbers
            if (link.label.toLowerCase().includes('previous') || 
                link.label.toLowerCase().includes('next') ||
                link.label === '‹' || 
                link.label === '›') {
              return null;
            }

            return link.url ? (
              <button
                key={index}
                onClick={() => handlePageChange(link.url)}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  link.active
                    ? 'bg-red-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </button>
            ) : (
              <span
                key={index}
                className="px-3 py-1.5 text-sm text-gray-400"
              >
                {link.label}
              </span>
            );
          })}
        </div>

        {/* Next Button */}
        {nextLink && nextLink.url ? (
          <button
            onClick={() => handlePageChange(nextLink.url)}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Next
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-400 bg-gray-50 cursor-not-allowed"
            disabled
          >
            Next
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

// Custom hooks for better state management
const useAttributeForm = () => {
  return useForm({
    id: '',
    name: '',
    values: [{ value: '' }]
  });
};

const useAttributeManagement = (attributes) => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [addingValues, setAddingValues] = useState({});

  const attributeForm = useAttributeForm();

  const toggleCardExpansion = (attributeId) => {
    setExpandedCard(expandedCard === attributeId ? null : attributeId);
  };

  const handleAddValueField = () => {
    attributeForm.setData('values', [...attributeForm.data.values, { value: '' }]);
  };

  const handleValueChange = (index, newValue) => {
    const newValues = [...attributeForm.data.values];
    newValues[index].value = newValue;
    attributeForm.setData('values', newValues);
  };

  const handleRemoveValueField = (index) => {
    const newValues = attributeForm.data.values.filter((_, i) => i !== index);
    attributeForm.setData('values', newValues);
  };

  const submitAttribute = (e) => {
    e.preventDefault();

    const url = editingAttribute
      ? route('attributes.update', { attribute: editingAttribute.id })
      : route('attributes.store');

    const method = editingAttribute ? 'put' : 'post';

    router[method](url, attributeForm.data, {
      onSuccess: () => {
        attributeForm.reset();
        setShowFormModal(false);
        setEditingAttribute(null);
        setExpandedCard(null);
      }
    });
  };

  const handleCreate = () => {
    attributeForm.reset();
    attributeForm.setData('values', [{ value: '' }]);
    setEditingAttribute(null);
    setShowFormModal(true);
  };

  const handleEdit = (attribute) => {
    attributeForm.setData({
      id: attribute.id,
      name: attribute.name,
      values: attribute.values.map(val => ({
        id: val.id,
        value: val.value
      }))
    });
    setEditingAttribute(attribute);
    setShowFormModal(true);
  };

  const handleCancel = () => {
    attributeForm.reset();
    setShowFormModal(false);
    setEditingAttribute(null);
  };

  const handleDeleteAttribute = (attribute) => {
    if (confirm(`Are you sure you want to delete "${attribute.name}"?`)) {
      router.delete(route('attributes.destroy', { attribute: attribute.id }));
      if (expandedCard === attribute.id) {
        setExpandedCard(null);
      }
    }
  };

  const handleAddValueToAttribute = (attributeId) => {
    setAddingValues(prev => ({
      ...prev,
      [attributeId]: { value: '' }
    }));
  };

  const handleNewValueChange = (attributeId, value) => {
    setAddingValues(prev => ({
      ...prev,
      [attributeId]: {
        ...prev[attributeId],
        value: value
      }
    }));
  };

  const submitNewValue = (attributeId, e) => {
    e.preventDefault();
    const valueData = addingValues[attributeId];

    router.post(route('attributes.values.store', { attribute: attributeId }), valueData, {
      onSuccess: () => {
        setAddingValues(prev => {
          const newState = { ...prev };
          delete newState[attributeId];
          return newState;
        });
      }
    });
  };

  const handleDeleteValue = (attributeId, valueId) => {
    if (confirm('Are you sure you want to delete this value?')) {
      router.delete(route('attributes.values.destroy', {
        attribute: attributeId,
        value: valueId
      }));
    }
  };

  const handleCancelAddValue = (attributeId) => {
    setAddingValues(prev => {
      const newState = { ...prev };
      delete newState[attributeId];
      return newState;
    });
  };

  return {
    showFormModal,
    expandedCard,
    editingAttribute,
    addingValues,
    attributeForm,
    toggleCardExpansion,
    handleAddValueField,
    handleValueChange,
    handleRemoveValueField,
    submitAttribute,
    handleCreate,
    handleEdit,
    handleCancel,
    handleDeleteAttribute,
    handleAddValueToAttribute,
    handleNewValueChange,
    submitNewValue,
    handleDeleteValue,
    handleCancelAddValue
  };
};

// Main Component
export default function AttributeIndex({ attributes }) {
  const { locale } = useTranslation();
  const {
    showFormModal,
    expandedCard,
    editingAttribute,
    addingValues,
    attributeForm,
    toggleCardExpansion,
    handleAddValueField,
    handleValueChange,
    handleRemoveValueField,
    submitAttribute,
    handleCreate,
    handleEdit,
    handleCancel,
    handleDeleteAttribute,
    handleAddValueToAttribute,
    handleNewValueChange,
    submitNewValue,
    handleDeleteValue,
    handleCancelAddValue
  } = useAttributeManagement(attributes.data);

  // State for search
  const [searchTerm, setSearchTerm] = useState('');

  // Extract pagination data from Inertia props
  const {
    data,
    links,
    meta: {
      current_page: currentPage,
      from,
      to,
      total,
      per_page: perPage
    } = {}
  } = attributes;

  // Handle search
  const handleSearch = (term) => {
    router.get(route('attributes.index'), { search: term }, {
      preserveState: true,
      replace: true
    });
  };

  // Handle pagination
  const handlePageChange = (url) => {
    router.visit(url, {
      preserveState: true,
      preserveScroll: true
    });
  };

  // Handle initial search from URL
  useEffect(() => {
    const urlSearch = new URLSearchParams(window.location.search).get('search');
    if (urlSearch) {
      setSearchTerm(urlSearch);
    }
  }, []);

  return (
    <div className={`p-4 min-h-screen bg-gray-50 ${locale === 'bn' ? 'bangla-font' : ''} transition-all duration-200`}>
      <AttributeFormModal
        isOpen={showFormModal}
        editingAttribute={editingAttribute}
        attributeForm={attributeForm}
        onClose={handleCancel}
        onSubmit={submitAttribute}
        onAddValueField={handleAddValueField}
        onValueChange={handleValueChange}
        onRemoveValueField={handleRemoveValueField}
      />

      <div className="max-w-6xl mx-auto">
        {/* Header with Search and Create Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Attributes</h1>
            <p className="text-sm text-gray-500">Manage your product attributes and values</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Search Bar */}
            <div className="flex-1 md:w-64">
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleSearch={handleSearch}
                totalResults={total}
              />
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              className="px-5 py-2.5 bg-gray-900 hover:bg-red-600 text-white font-bold uppercase text-xs rounded-lg shadow transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus size={14} />
              New Attribute
            </button>
          </div>
        </div>

        {/* Attributes List */}
        <div className="space-y-4">
          {data.map((attribute) => (
            <div key={attribute.id} className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
              <AttributeCardHeader
                attribute={attribute}
                isExpanded={expandedCard === attribute.id}
                onToggleExpand={toggleCardExpansion}
                onEdit={handleEdit}
                onDelete={handleDeleteAttribute}
              />

              {expandedCard === attribute.id && (
                <AttributeValuesTable
                  attribute={attribute}
                  addingValues={addingValues}
                  onAddValue={handleAddValueToAttribute}
                  onNewValueChange={handleNewValueChange}
                  onSubmitNewValue={submitNewValue}
                  onDeleteValue={handleDeleteValue}
                  onCancelAddValue={handleCancelAddValue}
                />
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {data.length === 0 && (
          <div className="mt-6">
            <EmptyState onCreate={handleCreate} />
          </div>
        )}

        {/* Pagination */}
        {data.length > 0 && links && (
          <Pagination
            links={links}
            currentPage={currentPage}
            total={total}
            from={from}
            to={to}
            handlePageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}