// resources/js/Pages/attributes/AttributeIndex.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Plus, Trash, Edit, X, Save, RefreshCw, Sparkles, Key } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export default function AttributeIndex({ attributes }) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState(null);
    const [addingValues, setAddingValues] = useState({});
    const [attributeCodeMode, setAttributeCodeMode] = useState('auto'); // 'auto', 'manual'
    const [valueCodeModes, setValueCodeModes] = useState({}); // {index: 'auto'|'manual'}
    const { t, locale } = useTranslation();
    
    const nameInputRef = useRef(null);

    const attributeForm = useForm({
        id: '',
        name: '',
        code: '',
        values: [{ value: '', code: '' }]
    });

    // Generate clean code
    const generateCleanCode = (text) => {
        return text
            .toLowerCase()
            .normalize('NFD') // Normalize unicode characters
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[^a-z0-9\s]/g, '') // Remove special chars
            .trim()
            .replace(/\s+/g, '_'); // Replace spaces
    };

    // Generate short code (first letters or similar)
    const generateShortCode = (text) => {
        const words = text.toLowerCase().trim().split(/\s+/);
        
        if (words.length === 1) {
            // For single words, take first 3-4 letters
            return words[0].substring(0, 4).replace(/[^a-z]/g, '');
        } else {
            // For multiple words, use initials
            return words.map(word => word.charAt(0)).join('').substring(0, 4);
        }
    };

    // Auto-generate attribute code based on name
    const autoGenerateAttributeCode = () => {
        if (attributeForm.data.name.trim()) {
            const cleanCode = generateCleanCode(attributeForm.data.name);
            const shortCode = generateShortCode(attributeForm.data.name);
            
            // Use short code if it's significantly shorter and clean
            const finalCode = shortCode.length >= 2 && shortCode.length <= cleanCode.length 
                ? shortCode 
                : cleanCode;
            
            attributeForm.setData('code', finalCode);
        }
    };

    // Auto-generate value code
    const autoGenerateValueCode = (value, index) => {
        if (value.trim()) {
            const cleanCode = generateCleanCode(value);
            const shortCode = generateShortCode(value);
            
            // Use short code for values when appropriate
            const finalCode = value.length <= 15 ? shortCode : cleanCode;
            
            const newValues = [...attributeForm.data.values];
            newValues[index].code = finalCode;
            attributeForm.setData('values', newValues);
        }
    };

    // Handle attribute name change
    const handleAttributeNameChange = (e) => {
        const newName = e.target.value;
        attributeForm.setData('name', newName);
        
        // Auto-generate code if in auto mode
        if (attributeCodeMode === 'auto' && newName.trim()) {
            setTimeout(() => {
                autoGenerateAttributeCode();
            }, 300); // Small delay for better UX
        }
    };

    // Handle attribute code change
    const handleAttributeCodeChange = (e) => {
        const newCode = e.target.value;
        attributeForm.setData('code', newCode);
        
        // Switch to manual mode when user manually edits
        if (attributeCodeMode === 'auto' && newCode !== generateCleanCode(attributeForm.data.name)) {
            setAttributeCodeMode('manual');
        }
    };

    // Handle value field change
    const handleValueChange = (index, field, newValue) => {
        const newValues = [...attributeForm.data.values];
        newValues[index][field] = newValue;
        attributeForm.setData('values', newValues);

        // Auto-generate code for value if in auto mode
        if (field === 'value' && valueCodeModes[index] !== 'manual') {
            if (newValue.trim()) {
                setTimeout(() => {
                    autoGenerateValueCode(newValue, index);
                }, 300);
            }
        }
    };

    // Handle value code change
    const handleValueCodeChange = (index, newCode) => {
        const newValues = [...attributeForm.data.values];
        newValues[index].code = newCode;
        attributeForm.setData('values', newValues);

        // Switch to manual mode for this value
        if (valueCodeModes[index] !== 'manual') {
            setValueCodeModes(prev => ({
                ...prev,
                [index]: 'manual'
            }));
        }
    };

    // Initialize form modes based on current data
    const initializeModes = () => {
        // Check if current code matches auto-generated pattern
        const currentCode = attributeForm.data.code;
        const autoGeneratedCode = generateCleanCode(attributeForm.data.name);
        
        setAttributeCodeMode(
            !currentCode || currentCode === autoGeneratedCode ? 'auto' : 'manual'
        );

        // Initialize value modes
        const modes = {};
        attributeForm.data.values.forEach((value, index) => {
            const autoValCode = generateCleanCode(value.value);
            modes[index] = !value.code || value.code === autoValCode ? 'auto' : 'manual';
        });
        setValueCodeModes(modes);
    };

    // Handle form submission
    const submitAttribute = (e) => {
        e.preventDefault();
        
        // Validate all codes are unique within attribute
        const valueCodes = attributeForm.data.values.map(v => v.code.toLowerCase());
        const uniqueCodes = new Set(valueCodes);
        
        if (valueCodes.length !== uniqueCodes.size) {
            alert(t('attributes.duplicate_codes', 'Duplicate value codes found. Each value must have a unique code.'));
            return;
        }

        const url = editingAttribute 
            ? route('attributes.update', { attribute: editingAttribute.id })
            : route('attributes.store');
            
        const method = editingAttribute ? 'put' : 'post';

        router[method](url, attributeForm.data, {
            onSuccess: () => {
                attributeForm.reset();
                setShowCreateForm(false);
                setEditingAttribute(null);
                setAttributeCodeMode('auto');
                setValueCodeModes({});
            }
        });
    };

    // Create new attribute
    const handleCreate = () => {
        attributeForm.reset();
        attributeForm.setData('values', [{ value: '', code: '' }]);
        setShowCreateForm(true);
        setEditingAttribute(null);
        setAttributeCodeMode('auto');
        setValueCodeModes({ 0: 'auto' });
        
        // Focus on name input
        setTimeout(() => {
            if (nameInputRef.current) {
                nameInputRef.current.focus();
            }
        }, 100);
    };

    // Edit existing attribute
    const handleEdit = (attribute) => {
        const values = attribute.values.map(val => ({
            id: val.id,
            value: val.value,
            code: val.code
        }));

        attributeForm.setData({
            id: attribute.id,
            name: attribute.name,
            code: attribute.code,
            values: values.length > 0 ? values : [{ value: '', code: '' }]
        });
        
        setEditingAttribute(attribute);
        setShowCreateForm(true);
        
        // Initialize modes after data is set
        setTimeout(() => {
            initializeModes();
        }, 100);
    };

    // Cancel form
    const handleCancel = () => {
        attributeForm.reset();
        setShowCreateForm(false);
        setEditingAttribute(null);
        setAttributeCodeMode('auto');
        setValueCodeModes({});
    };

    // Add value field
    const handleAddValueField = () => {
        const newIndex = attributeForm.data.values.length;
        attributeForm.setData('values', [
            ...attributeForm.data.values, 
            { value: '', code: '' }
        ]);
        setValueCodeModes(prev => ({ ...prev, [newIndex]: 'auto' }));
    };

    // Remove value field
    const handleRemoveValueField = (index) => {
        const newValues = attributeForm.data.values.filter((_, i) => i !== index);
        attributeForm.setData('values', newValues);
        
        // Update modes
        const newModes = { ...valueCodeModes };
        delete newModes[index];
        // Reindex remaining modes
        const updatedModes = {};
        newValues.forEach((_, newIndex) => {
            const oldIndex = newIndex >= index ? newIndex + 1 : newIndex;
            updatedModes[newIndex] = newModes[oldIndex] || 'auto';
        });
        setValueCodeModes(updatedModes);
    };

    // Regenerate all codes
    const handleRegenerateAllCodes = () => {
        // Regenerate attribute code
        if (attributeForm.data.name.trim()) {
            autoGenerateAttributeCode();
        }
        
        // Regenerate all value codes
        const newValues = [...attributeForm.data.values];
        newValues.forEach((value, index) => {
            if (value.value.trim()) {
                autoGenerateValueCode(value.value, index);
            }
        });
        
        // Reset all to auto mode
        setAttributeCodeMode('auto');
        const newModes = {};
        newValues.forEach((_, index) => {
            newModes[index] = 'auto';
        });
        setValueCodeModes(newModes);
    };

    // Handle adding values to existing attribute
    const handleAddValueToAttribute = (attributeId) => {
        setAddingValues(prev => ({
            ...prev,
            [attributeId]: { 
                value: '', 
                code: '',
                mode: 'auto' 
            }
        }));
    };

    // Handle new value change for existing attribute
    const handleNewValueChange = (attributeId, field, value) => {
        const currentValue = addingValues[attributeId];
        
        if (field === 'value' && currentValue?.mode === 'auto') {
            // Auto-generate code when value changes in auto mode
            const newCode = generateCleanCode(value);
            setAddingValues(prev => ({
                ...prev,
                [attributeId]: {
                    ...prev[attributeId],
                    value: value,
                    code: newCode,
                    mode: 'auto'
                }
            }));
        } else {
            setAddingValues(prev => ({
                ...prev,
                [attributeId]: {
                    ...prev[attributeId],
                    [field]: value,
                    mode: field === 'code' ? 'manual' : prev[attributeId]?.mode || 'auto'
                }
            }));
        }
    };

    // Submit new value for existing attribute
    const submitNewValue = (attributeId, e) => {
        e.preventDefault();
        const { mode, ...valueData } = addingValues[attributeId];
        
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

    // Delete operations
    const handleDeleteAttribute = (attribute) => {
        if (confirm(t('attributes.confirm_delete_attribute', `Are you sure you want to delete "${attribute.name}"?`))) {
            router.delete(route('attributes.destroy', { attribute: attribute.id }));
        }
    };

    const handleDeleteValue = (attributeId, valueId) => {
        if (confirm(t('attributes.confirm_delete_value', 'Are you sure you want to delete this value?'))) {
            router.delete(route('attributes.values.destroy', { 
                attribute: attributeId, 
                value: valueId 
            }));
        }
    };

    return (
        <div className={`p-6 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">
                        {t('attributes.management', 'Attributes Management')}
                    </h1>
                    <p className="text-gray-600">
                        {t('attributes.management_description', 'Manage product attributes and their values')}
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="btn bg-[#1e4d2b] text-white hover:bg-[#1a4325]"
                >
                    <Plus size={16} className="mr-2" />
                    {t('attributes.create_attribute', 'Create Attribute')}
                </button>
            </div>

            {/* Create/Edit Attribute Form */}
            {showCreateForm && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {editingAttribute 
                                    ? t('attributes.edit_attribute', 'Edit Attribute')
                                    : t('attributes.create_new_attribute', 'Create New Attribute')
                                }
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {t('attributes.code_auto_generation', 'Codes are auto-generated but can be customized')}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleRegenerateAllCodes}
                                className="btn btn-sm btn-outline"
                                title={t('attributes.regenerate_all_codes', 'Regenerate all codes')}
                            >
                                <RefreshCw size={14} className="mr-1" />
                                {t('attributes.regenerate_all', 'Regenerate All')}
                            </button>
                            <button
                                onClick={handleCancel}
                                className="btn btn-ghost btn-sm"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                    
                    <form onSubmit={submitAttribute}>
                        {/* Attribute Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="space-y-2">
                                <label className="label font-medium">
                                    {t('attributes.attribute_name', 'Attribute Name')} *
                                </label>
                                <input
                                    ref={nameInputRef}
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={attributeForm.data.name}
                                    onChange={handleAttributeNameChange}
                                    placeholder={t('attributes.name_placeholder', 'e.g., Color, Size, Model')}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="label font-medium">
                                        {t('attributes.attribute_code', 'Attribute Code')} *
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                autoGenerateAttributeCode();
                                                setAttributeCodeMode('auto');
                                            }}
                                            className={`btn btn-xs ${attributeCodeMode === 'auto' ? 'bg-blue-100 text-blue-700' : 'btn-ghost'}`}
                                            title={t('attributes.auto_generate_mode', 'Auto-generate mode')}
                                        >
                                            <Sparkles size={12} className="mr-1" />
                                            {t('common.auto', 'Auto')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAttributeCodeMode('manual')}
                                            className={`btn btn-xs ${attributeCodeMode === 'manual' ? 'bg-gray-100 text-gray-700' : 'btn-ghost'}`}
                                            title={t('attributes.manual_mode', 'Manual mode')}
                                        >
                                            <Key size={12} className="mr-1" />
                                            {t('common.manual', 'Manual')}
                                        </button>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    className="input input-bordered w-full font-mono text-sm"
                                    value={attributeForm.data.code}
                                    onChange={handleAttributeCodeChange}
                                    placeholder={t('attributes.code_placeholder', 'e.g., color, size, model')}
                                    required
                                />
                                {attributeCodeMode === 'auto' && (
                                    <p className="text-xs text-gray-500 flex items-center">
                                        <Sparkles size={10} className="mr-1" />
                                        {t('attributes.auto_generated', 'Auto-generated from name')}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Values Section */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <label className="label font-medium">
                                    {t('attributes.attribute_values', 'Attribute Values')} *
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddValueField}
                                    className="btn btn-sm bg-[#1e4d2b] text-white hover:bg-[#1a4325]"
                                >
                                    <Plus size={14} className="mr-1" />
                                    {t('attributes.add_value', 'Add Value')}
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {attributeForm.data.values.map((value, index) => (
                                    <div key={index} className="flex gap-4 items-start p-4 bg-white border border-gray-200 rounded-lg">
                                        <div className="flex-1 space-y-2">
                                            <label className="label text-xs font-medium text-gray-500">
                                                {t('attributes.value', 'Value')} *
                                            </label>
                                            <input
                                                type="text"
                                                className="input input-bordered w-full"
                                                value={value.value}
                                                onChange={(e) => handleValueChange(index, 'value', e.target.value)}
                                                placeholder={t('attributes.value_placeholder', 'e.g., Small, Red, 2023')}
                                                required
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="label text-xs font-medium text-gray-500">
                                                    {t('attributes.code', 'Code')} *
                                                </label>
                                                <div className="flex space-x-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            autoGenerateValueCode(value.value, index);
                                                            setValueCodeModes(prev => ({ ...prev, [index]: 'auto' }));
                                                        }}
                                                        className={`btn btn-xs ${valueCodeModes[index] === 'auto' ? 'bg-blue-100 text-blue-700' : 'btn-ghost'}`}
                                                        title={t('attributes.auto_generate_mode', 'Auto-generate mode')}
                                                    >
                                                        <Sparkles size={10} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setValueCodeModes(prev => ({ ...prev, [index]: 'manual' }))}
                                                        className={`btn btn-xs ${valueCodeModes[index] === 'manual' ? 'bg-gray-100 text-gray-700' : 'btn-ghost'}`}
                                                        title={t('attributes.manual_mode', 'Manual mode')}
                                                    >
                                                        <Key size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                            <input
                                                type="text"
                                                className="input input-bordered w-full font-mono text-sm"
                                                value={value.code}
                                                onChange={(e) => handleValueCodeChange(index, e.target.value)}
                                                placeholder={t('attributes.code_placeholder', 'e.g., sm, red, 2023')}
                                                required
                                            />
                                            {valueCodeModes[index] === 'auto' && value.value && (
                                                <p className="text-xs text-gray-500 flex items-center">
                                                    <Sparkles size={10} className="mr-1" />
                                                    {t('attributes.auto_generated', 'Auto-generated from value')}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveValueField(index)}
                                            disabled={attributeForm.data.values.length === 1}
                                            className="btn btn-sm btn-error mt-6"
                                        >
                                            <Trash size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex gap-3 justify-end border-t pt-6">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="btn btn-ghost"
                            >
                                {t('common.cancel', 'Cancel')}
                            </button>
                            <button
                                type="submit"
                                className="btn bg-[#1e4d2b] text-white hover:bg-[#1a4325]"
                                disabled={attributeForm.processing}
                            >
                                <Save size={16} className="mr-2" />
                                {attributeForm.processing 
                                    ? t('attributes.saving', 'Saving...')
                                    : (editingAttribute 
                                        ? t('attributes.update_attribute', 'Update Attribute')
                                        : t('attributes.create_attribute', 'Create Attribute')
                                      )
                                }
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Attributes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attributes.map((attribute) => (
                    <div key={attribute.id} className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                                    {attribute.name}
                                </h3>
                                <div className="flex items-center space-x-2">
                                    <code className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded font-mono">
                                        {attribute.code}
                                    </code>
                                    <span className="text-xs text-gray-400">
                                        {attribute.values.length} {t('attributes.values', 'values')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleEdit(attribute)}
                                    className="btn btn-sm btn-outline border-gray-300 hover:bg-gray-50"
                                    title={t('attributes.edit_attribute', 'Edit Attribute')}
                                >
                                    <Edit size={14} />
                                </button>
                                <button
                                    onClick={() => handleDeleteAttribute(attribute)}
                                    className="btn btn-sm btn-outline border-error text-error hover:bg-error hover:text-white"
                                    title={t('attributes.delete_attribute', 'Delete Attribute')}
                                >
                                    <Trash size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Values List */}
                        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-2">
                            {attribute.values.map((value) => (
                                <div key={value.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded group hover:bg-gray-100">
                                    <div className="flex items-center space-x-3">
                                        <span className="font-medium text-gray-900">{value.value}</span>
                                        <code className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded font-mono">
                                            {value.code}
                                        </code>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteValue(attribute.id, value.id)}
                                        className="btn btn-xs btn-error opacity-0 group-hover:opacity-100 transition-opacity"
                                        title={t('attributes.delete_value', 'Delete Value')}
                                    >
                                        <Trash size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Value Form */}
                        <div className="border-t pt-4">
                            {addingValues[attribute.id] ? (
                                <form onSubmit={(e) => submitNewValue(attribute.id, e)} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <input
                                                type="text"
                                                className="input input-sm input-bordered w-full"
                                                value={addingValues[attribute.id].value}
                                                onChange={(e) => handleNewValueChange(attribute.id, 'value', e.target.value)}
                                                placeholder={t('attributes.value', 'Value')}
                                                required
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    className="input input-sm input-bordered w-full font-mono"
                                                    value={addingValues[attribute.id].code}
                                                    onChange={(e) => handleNewValueChange(attribute.id, 'code', e.target.value)}
                                                    placeholder={t('attributes.code', 'Code')}
                                                    required
                                                />
                                                {addingValues[attribute.id].mode === 'auto' && (
                                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                                        <Sparkles size={10} className="text-blue-500" />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" className="btn btn-sm bg-[#1e4d2b] text-white hover:bg-[#1a4325] flex-1">
                                            <Plus size={12} className="mr-1" />
                                            {t('attributes.add_value', 'Add Value')}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setAddingValues(prev => {
                                                const newState = { ...prev };
                                                delete newState[attribute.id];
                                                return newState;
                                            })}
                                            className="btn btn-sm btn-ghost"
                                        >
                                            {t('common.cancel', 'Cancel')}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={() => handleAddValueToAttribute(attribute.id)}
                                    className="btn btn-sm btn-outline w-full border-dashed hover:border-solid"
                                >
                                    <Plus size={14} className="mr-2" />
                                    {t('attributes.add_value', 'Add Value')}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {attributes.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                        <Plus size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        {t('attributes.no_attributes_found', 'No attributes found')}
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        {t('attributes.get_started_description', 'Attributes help organize your products. Create attributes like color, size, or model to add variation options.')}
                    </p>
                    <button
                        onClick={handleCreate}
                        className="btn bg-[#1e4d2b] text-white hover:bg-[#1a4325] px-6"
                    >
                        <Plus size={16} className="mr-2" />
                        {t('attributes.create_first_attribute', 'Create Your First Attribute')}
                    </button>
                </div>
            )}
        </div>
    );
}