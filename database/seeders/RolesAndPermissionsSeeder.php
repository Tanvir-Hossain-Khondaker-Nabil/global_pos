<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create ALL permissions including Brands and Roles
        $permissions = [
            // ========== DASHBOARD ==========
            'dashboard.view',
            
            // ========== USER MANAGEMENT ==========
            'users.view',
            'users.create', 
            'users.edit',
            'users.delete',
            
            // ========== CUSTOMER MANAGEMENT ==========
            'customer.view',
            'customer.create',
            'customer.edit',
            'customer.delete',
            'customer.show',
            
            // ========== CATEGORY/SECTOR MANAGEMENT ==========
            'category.view',
            'category.create',
            'category.edit',
            'category.delete',
            
            // ========== SUPPLIER MANAGEMENT ==========
            'supplier.view',
            'supplier.create',
            'supplier.edit',
            'supplier.delete',
            'supplier.show',
            
            // ========== PRODUCT MANAGEMENT ==========
            'product.view',
            'product.create',
            'product.edit',
            'product.delete',
            
            // ========== BRANDS MANAGEMENT ========== ✅ ADDED
            'brands.view',
            'brands.create',
            'brands.edit',
            'brands.delete',
            'brands.show',
            
            // ========== ROLES MANAGEMENT ========== ✅ ADDED
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
            'roles.show',
            
            // ========== SALES MANAGEMENT ==========
            'sales.view',
            'sales.create',
            'sales.edit',
            'sales.delete',
            'sales.print',
            'sales.download_pdf',
            'sales.items.view',
            'sales.items.delete',
            'sales.payments.create',
            'sales.update',
            'sales.rejected',
            
            // ========== SALES LIST/REPORTS ==========
            'sales_list.view',
            'sales_list.delete',
            'sales_list.status_update',
            'sales_list.due_collect',
            
            // ========== EXPENSE MANAGEMENT ==========
            'expense.view',
            'expense.create',
            'expense.delete',
            'expense.category_view',
            'expense.category_create',
            
            // ========== EXTRA CASH ==========
            'extra_cash.view',
            'extra_cash.create',
            'extra_cash.delete',
            
            // ========== PROFILE MANAGEMENT ==========
            'profile.view',
            'profile.update',
            'security.view',
            'security.update',
            
            // ========== BARCODE ==========
            'barcode.print',
            
            // ========== ATTRIBUTES ==========
            'attributes.view',
            'attributes.create',
            'attributes.edit',
            'attributes.delete',
            'attributes.values.create',
            'attributes.values.delete',
            
            // ========== PAYMENTS & LEDGER ==========
            'payments.view',
            'payments.ledger_view',
            'payments.show',
            'ledger.view',
            'ledger.customer_view',
            'ledger.supplier_view',
            'ledger.clear_due',
            'ledger.advance_payment',
            
            // ========== WAREHOUSE MANAGEMENT ==========
            'warehouse.view',
            'warehouse.create',
            'warehouse.show',
            'warehouse.edit',
            'warehouse.update',
            'warehouse.delete',
            
            // ========== PURCHASE MANAGEMENT ==========
            'purchase.view',
            'purchase.create',
            'purchase.show',
            'purchase.edit',
            'purchase.update',
            'purchase.delete',
            'purchase.update_payment',
            'purchase.approve',
            'purchase.items_view',
            'purchase.statistics_view',
            'purchase.recent_view',
            'purchase.export_pdf',
            
            // ========== PURCHASE RETURNS ==========
            'purchase_return.view',
            'purchase_return.create',
            'purchase_return.show',
            'purchase_return.edit',
            'purchase_return.update',
            'purchase_return.delete',
            'purchase_return.approve',
            'purchase_return.complete',
            
            // ========== COMPANY MANAGEMENT ==========
            'companies.view',
            'companies.create',
            'companies.show',
            'companies.edit',
            'companies.update',
            'companies.delete',
            
            // ========== DEALERSHIP MANAGEMENT ==========
            'dealerships.view',
            'dealerships.create',
            'dealerships.show',
            'dealerships.edit',
            'dealerships.update',
            'dealerships.delete',
            'dealerships.approve',
            
            // ========== PLAN MANAGEMENT ==========
            'plans.view',
            'plans.create',
            'plans.show',
            'plans.edit',
            'plans.update',
            'plans.delete',
            
            // ========== SUBSCRIPTION MANAGEMENT ==========
            'subscriptions.view',
            'subscriptions.create',
            'subscriptions.show',
            'subscriptions.edit',
            'subscriptions.update',
            'subscriptions.delete',
            'subscriptions.renew',
            'subscriptions.payments_view',
            
            // ========== ATTENDANCE MANAGEMENT ==========
            'attendance.view',
            'attendance.create',
            'attendance.edit',
            'attendance.delete',
            'attendance.checkin',
            'attendance.checkout',
            'attendance.manual_entry',
            'attendance.monthly_report',
            'attendance.top_performers',
            'attendance.early_out',
            
            // ========== SALARY MANAGEMENT ==========
            'salary.view',
            'salary.create',
            'salary.edit',
            'salary.delete',
            'salary.calculate',
            'salary.pay',
            'salary.payslip',
            'salary.report',
            'salary.bulk_action',
            'salary.test_form',
            'salary.test_create',
            'salary.process_award_payments',
            
            // ========== LEAVE MANAGEMENT ==========
            'leave.view',
            'leave.create',
            'leave.edit',
            'leave.delete',
            'leave.store',
            'leave.show',
            'leave.approve',
            'leave.reject',
            'leave.cancel',
            'leave.balance_view',
            'leave.dashboard_view',
            
            // ========== PROVIDENT FUND ==========
            'provident_fund.view',
            'provident_fund.create',
            'provident_fund.edit',
            'provident_fund.delete',
            'provident_fund.summary_view',
            'provident_fund.statement_view',
            'provident_fund.update_percentage',
            
            // ========== ALLOWANCE MANAGEMENT ==========
            'allowances.view',
            'allowances.create',
            'allowances.edit',
            'allowances.delete',
            'allowances.update',
            'allowances.apply_settings',
            'allowances.update_user',
            
            // ========== RANK MANAGEMENT ==========
            'ranks.view',
            'ranks.create',
            'ranks.edit',
            'ranks.delete',
            'ranks.update',
            'ranks.users_view',
            'ranks.promote_user',
            
            // ========== AWARD MANAGEMENT ==========
            'awards.view',
            'awards.create',
            'awards.edit',
            'awards.delete',
            'awards.update',
            'awards.show',
            'awards.assign_monthly',
            'awards.assign_to_employee',
            'awards.employee_awards_view',
            'awards.mark_paid',
            'awards.mark_unpaid',
            'awards.destroy_employee_award',
            'awards.statistics_view',
            
            // ========== EMPLOYEE MANAGEMENT ==========
            'employees.view',
            'employees.create',
            'employees.edit',
            'employees.delete',
            'employees.update',
            'employees.update_password',
            'employees.update_salary',
            
            // ========== BONUS MANAGEMENT ==========
            'bonus.view',
            'bonus.create',
            'bonus.edit',
            'bonus.delete',
            'bonus.update',
            'bonus.show',
            'bonus.apply_form',
            'bonus.apply',
            'bonus.apply_eid',
            'bonus.apply_festival',
            
            // ========== MODULES MANAGEMENT ==========
            'modules.view',
            'modules.create',
            'modules.edit',
            'modules.delete',
            'modules.update',
            'modules.show',
            
            
            // ========== EXCHANGE ==========
            'exchange.view',
            'exchange.create',
            'exchange.edit',
            'exchange.delete',
            
            // ========== PDF GENERATION ==========
            'pdf.download',
            'pdf.view',
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(['name' => $permission]);
        }

        // ========== CREATE ROLES ==========
        
        // Super Admin role with ALL permissions
        $superAdmin = Role::updateOrCreate(['name' => 'Super Admin']);
        $superAdmin->givePermissionTo(Permission::all());

        // Admin role with ALL permissions
        $admin = Role::updateOrCreate(['name' => 'Admin']);
        $admin->givePermissionTo(Permission::all());

        // Manager role with operational permissions (including brands and roles view)
        $manager = Role::updateOrCreate(['name' => 'Manager']);
        $manager->givePermissionTo([
            'dashboard.view',
            
            // Customer
            'customer.view', 'customer.create', 'customer.edit', 'customer.show',
            
            // Category
            'category.view', 'category.create', 'category.edit',
            
            // Supplier
            'supplier.view', 'supplier.create', 'supplier.edit', 'supplier.show',
            
            // Product
            'product.view', 'product.create', 'product.edit',
            
            // Brands - ✅ ADDED
            'brands.view', 'brands.show',
            
            // Roles - ✅ ADDED (only view, not create/edit/delete)
            'roles.view',
            
            // Sales
            'sales.view', 'sales.create', 'sales.edit', 'sales.print',
            'sales_list.view', 'sales_list.due_collect',
            
            // Expense
            'expense.view', 'expense.create', 'expense.category_view',
            
            // Extra Cash
            'extra_cash.view', 'extra_cash.create',
            
            // Profile
            'profile.view', 'profile.update', 'security.view', 'security.update',
            
            // Barcode
            'barcode.print',
            
            // Payments
            'payments.view', 'payments.ledger_view',
            
            // Warehouse
            'warehouse.view', 'warehouse.show',
            
            // Purchase
            'purchase.view', 'purchase.create', 'purchase.show',
            
            // Companies
            'companies.view', 'companies.show',
            
            // Dealerships
            'dealerships.view', 'dealerships.show',
            
            // Plans
            'plans.view', 'plans.show',
            
            // Subscriptions
            'subscriptions.view', 'subscriptions.show',
            
            // Attendance
            'attendance.view', 'attendance.checkin', 'attendance.checkout',
            
            // Salary
            'salary.view', 'salary.payslip', 'salary.report',
            
            // Leave
            'leave.view', 'leave.create', 'leave.show',
            
            // Awards
            'awards.view', 'awards.employee_awards_view',
            
            // Employees
            'employees.view',
        ]);

        // Sales Executive role
        $salesExecutive = Role::updateOrCreate(['name' => 'Sales Executive']);
        $salesExecutive->givePermissionTo([
            'dashboard.view',
            'customer.view', 'customer.create',
            'product.view',
            'brands.view', // ✅ ADDED
            'sales.view', 'sales.create', 'sales.print',
            'sales_list.view',
            'profile.view', 'profile.update',
            'payments.view',
            'attendance.view', 'attendance.checkin', 'attendance.checkout',
        ]);

        // Accountant role
        $accountant = Role::updateOrCreate(['name' => 'Accountant']);
        $accountant->givePermissionTo([
            'dashboard.view',
            'customer.view', 'customer.edit',
            'sales_list.view', 'sales_list.due_collect',
            'expense.view', 'expense.create',
            'extra_cash.view', 'extra_cash.create',
            'payments.view', 'payments.ledger_view',
            'ledger.view', 'ledger.customer_view', 'ledger.supplier_view',
            'ledger.clear_due', 'ledger.advance_payment',
            'salary.view', 'salary.calculate', 'salary.pay', 'salary.payslip', 'salary.report',
            'profile.view', 'profile.update',
        ]);

        // Stock Manager role
        $stockManager = Role::updateOrCreate(['name' => 'Stock Manager']);
        $stockManager->givePermissionTo([
            'dashboard.view',
            'product.view', 'product.create', 'product.edit',
            'brands.view', 'brands.create', 'brands.edit', // ✅ ADDED
            'warehouse.view', 'warehouse.show', 'warehouse.create',
            'purchase.view', 'purchase.create', 'purchase.show',
            'purchase_return.view', 'purchase_return.create',
            'profile.view', 'profile.update',
        ]);

        // Regular User/Employee role
        $employee = Role::updateOrCreate(['name' => 'Employee']);
        $employee->givePermissionTo([
            'dashboard.view',
            'profile.view', 'profile.update',
            'attendance.view', 'attendance.checkin', 'attendance.checkout',
            'leave.view', 'leave.create',
            'salary.view', 'salary.payslip',
            'awards.employee_awards_view',
        ]);

        // ========== CREATE USERS ==========
        
        // Create Super Admin User
        $superAdminUser = User::updateOrCreate(
            ['email' => 'superadmin@system.com'],
            [
                'name' => 'Super Admin',
                'password' => bcrypt('password123'),
                'email_verified_at' => now(),
            ]
        );
        $superAdminUser->syncRoles([$superAdmin]);

        // Create Admin User
        $adminUser = User::updateOrCreate(
            ['email' => 'admin@system.com'],
            [
                'name' => 'Admin User',
                'password' => bcrypt('password123'),
                'email_verified_at' => now(),
            ]
        );
        $adminUser->syncRoles([$admin]);

        // Create Manager User
        $managerUser = User::updateOrCreate(
            ['email' => 'manager@system.com'],
            [
                'name' => 'Manager User',
                'password' => bcrypt('password123'),
                'email_verified_at' => now(),
            ]
        );
        $managerUser->syncRoles([$manager]);

        // Create Sales Executive User
        $salesUser = User::updateOrCreate(
            ['email' => 'sales@system.com'],
            [
                'name' => 'Sales Executive',
                'password' => bcrypt('password123'),
                'email_verified_at' => now(),
            ]
        );
        $salesUser->syncRoles([$salesExecutive]);

        // Create Accountant User
        $accountantUser = User::updateOrCreate(
            ['email' => 'accountant@system.com'],
            [
                'name' => 'Accountant User',
                'password' => bcrypt('password123'),
                'email_verified_at' => now(),
            ]
        );
        $accountantUser->syncRoles([$accountant]);

        // Create Stock Manager User
        $stockUser = User::updateOrCreate(
            ['email' => 'stock@system.com'],
            [
                'name' => 'Stock Manager',
                'password' => bcrypt('password123'),
                'email_verified_at' => now(),
            ]
        );
        $stockUser->syncRoles([$stockManager]);

        // Create Employee User
        $regularUser = User::updateOrCreate(
            ['email' => 'employee@system.com'],
            [
                'name' => 'Regular Employee',
                'password' => bcrypt('password123'),
                'email_verified_at' => now(),
            ]
        );
        $regularUser->syncRoles([$employee]);

        // Clear cache again
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }
}