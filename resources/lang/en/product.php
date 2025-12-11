<?php

return [
    'title' => 'Products',
        'subtitle' => 'Manage your all products from here.',
        'product_list' => 'Product List',
        'add_new_product' => 'Add New Product',
        'search_placeholder' => 'Search products...',
        'no_products_found' => 'No products found!',
        'add_new' => 'Add New',
        'edit' => 'Edit',
        'delete' => 'Delete',
        'delete_confirmation' => 'Are you sure you want to delete this product? This action cannot be undone.',
        
        // Table headers
        'product_code' => 'Product Code',
        'product_name' => 'Product Name',
        'category' => 'Category',
        'brand' => 'Brand',
        'attributes' => 'Attributes',
        'total_stock' => 'Total Stock',
        'variants' => 'Variants',
        'actions' => 'Actions',
        
        // Product details
        'default_variant' => 'Default Variant',
        'units' => 'units',
        'attribute' => 'attribute',
        'attributes_plural' => 'attributes',
        'stock' => 'Stock',
        'price' => 'Price',
        'description' => 'Description',
        'not_available' => 'N/A',
        'brand' => 'Brand',
        'pick_brand' => '--Pick a brand--',
        
        // Status messages
        'product_added' => 'Product added successfully!',
        'product_updated' => 'Product updated successfully!',
        'product_deleted' => 'Product deleted successfully!',
        'from_title' => 'Add New Product',
        'update_title' => 'Update Product',
        'from_subtitle' => 'Add or update product with variants',
        
        // Form fields
        'from_product_name' => 'Product Name',
        'from_category' => 'Category',
        'from_product_code' => 'Product Code',
        'from_description' => 'Description',
        'pick_category' => '--Pick a category--',
        'enter_product_name' => 'Enter product name',
        'enter_product_code' => 'Enter product code',
        'enter_description' => 'Enter product description',
        
        // Attributes section
        'product_attributes' => 'Product Attributes',
        'select_attributes' => 'Select Attributes',
        'hide_attributes' => 'Hide Attributes',
        'select_attribute_values' => 'Select Attribute Values',
        'selected_attributes' => 'Selected Attributes',
        'apply_attributes' => 'Apply Attributes',
        'selected_count' => 'Selected',
        'attributes' => 'attributes',
        
        // Variants section
        'product_variants' => 'Product Variants',
        'variant' => 'Variant',
        'no_attributes_selected' => 'No attributes selected',
        'variant_attributes' => 'Variant Attributes',
        'delete_variant' => 'Delete variant',
        'variant_pricing' => 'Variant Pricing',
        'add_variant' => 'Add Variant',
        'variant_count' => 'variant(s)',
        
        // Buttons
        'save_product' => 'Save Product',
        'update_product' => 'Update Product',
        'saving' => 'Saving...',
        
        // Validation messages
        'product_name_required' => 'Product name is required',
        'category_required' => 'Category is required',
        'product_code_required' => 'Product code is required',
        'variants_required' => 'At least one variant must have attributes selected',
        'variant_attributes_required' => 'Please select attributes for this variant',
        'fix_validation_errors' => 'Please fix the validation errors',
        'something_went_wrong' => 'Something went wrong. Please try again!',
        
        // Success messages
        'product_added_success' => 'Product added successfully!',
        'product_updated_success' => 'Product updated successfully!',
        
        // Product Type
        'product_type' => 'Product Type',
        'regular_product' => 'Regular Product',
        'in_house_product' => 'In-House Production',
        'regular_desc' => 'Purchase from supplier, needs stock management through purchase orders',
        'in_house_desc' => 'Internally produced, auto-stock management in In-House warehouse',
        
        // In-House Product Settings
        'in_house_settings' => 'In-House Production Settings',
        'production_cost' => 'Production Cost',
        'shadow_production_cost' => 'Shadow Production Cost',
        'sale_price' => 'Sale Price',
        'shadow_sale_price' => 'Shadow Sale Price',
        'initial_stock' => 'Initial Stock Quantity',
        'in_house_note' => 'Note: This product will be automatically added to "In-House Production" warehouse with the specified initial stock quantity. No purchase order needed. Stock will be managed internally.',
        'shadow_cost' => 'Shadow Cost',
        
        // Summary
        'summary' => 'Summary',
        'in_house_product_short' => 'In-House Product',
        
        // Additional validation
        'production_cost_required' => 'Production cost is required',
        'shadow_cost_required' => 'Shadow production cost is required',
        'sale_price_required' => 'Sale price is required',
        'shadow_sale_price_required' => 'Shadow sale price is required',
        'initial_stock_invalid' => 'Initial stock cannot be negative',
];