
import { Head } from '@inertiajs/react';

export default function Payslip({ salary }) {
    // যদি salary null হয়
    if (!salary) {
        return (
            <>
                <div className="bg-white p-8 rounded-lg shadow max-w-4xl mx-auto text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Payslip Not Found</h1>
                    <p className="text-gray-600">The requested payslip does not exist or has been deleted.</p>
                    <a 
                        href="/salary" 
                        className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Back to Salary List
                    </a>
                </div>
            </>
        );
    }

    const { employee, ...salaryData } = salary;

    // যদি employee relation না থাকে
    if (!employee) {
        return (
            <>
                <div className="bg-white p-8 rounded-lg shadow max-w-4xl mx-auto text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Employee Data Missing</h1>
                    <p className="text-gray-600">Employee information for this payslip is not available.</p>
                </div>
            </>
        );
    }

    const earnings = [
        { label: 'Basic Salary', amount: salary.basic_salary || 0 },
        { label: 'House Rent', amount: salary.house_rent || 0 },
        { label: 'Medical Allowance', amount: salary.medical_allowance || 0 },
        { label: 'Transport Allowance', amount: salary.transport_allowance || 0 },
        { label: 'Other Allowance', amount: salary.other_allowance || 0 },
        { label: 'Total Allowance', amount: salary.total_allowance || 0 },
    ];

    const bonuses = [
        { label: 'Eid Bonus', amount: salary.eid_bonus || 0 },
        { label: 'Festival Bonus', amount: salary.festival_bonus || 0 },
        { label: 'Performance Bonus', amount: salary.performance_bonus || 0 },
        { label: 'Other Bonus', amount: salary.other_bonus || 0 },
        { label: 'Total Bonus', amount: salary.total_bonus || 0 },
    ];

    const otherEarnings = [
        { label: 'Commission', amount: salary.commission || 0 },
        { label: 'Overtime', amount: salary.overtime_amount || 0 },
    ];

    const deductions = [
        { label: 'Late Deduction', amount: salary.late_deduction || 0 },
        { label: 'Absent Deduction', amount: salary.absent_deduction || 0 },
        { label: 'Tax Deduction', amount: salary.tax_deduction || 0 },
        { label: 'Provident Fund', amount: salary.provident_fund || 0 },
        { label: 'Other Deductions', amount: salary.other_deductions || 0 },
        { label: 'Total Deductions', amount: salary.total_deductions || 0 },
    ];

    // টাকার ফরম্যাট করার ফাংশন
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const printPayslip = () => {
        window.print();
    };

    // মোট বোনাস আছে কিনা চেক
    const hasBonus = salary.total_bonus > 0;
    // মোট অন্যান্য আয় আছে কিনা চেক
    const hasOtherEarnings = salary.commission > 0 || salary.overtime_amount > 0;

    return (
        <>
            <div className="bg-white p-8 rounded-lg shadow max-w-4xl mx-auto">
                {/* Print Button */}
                <div className="text-right mb-6 no-print">
                    <button
                        onClick={printPayslip}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Print Payslip
                    </button>
                </div>

                {/* Company Header */}
                <div className="text-center mb-8 border-b pb-6">
                    <h1 className="text-3xl font-bold text-gray-900">ABC Company Ltd.</h1>
                    <p className="text-gray-600">Salary Payslip</p>
                </div>

                {/* Employee & Salary Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Employee Information</h3>
                        <div className="space-y-2">
                            <p><strong>Name:</strong> {employee.name}</p>
                            <p><strong>Employee ID:</strong> {employee.employee_id}</p>
                            <p><strong>Designation:</strong> {employee.rank?.name || 'N/A'}</p>
                            <p><strong>Department:</strong> {employee.department || 'IT Department'}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Salary Information</h3>
                        <div className="space-y-2">
                            <p><strong>Pay Period:</strong> {salary.month}/{salary.year}</p>
                            <p><strong>Payment Date:</strong> {salary.payment_date ? new Date(salary.payment_date).toLocaleDateString() : 'Not Paid'}</p>
                            <p><strong>Status:</strong> 
                                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                    salary.status === 'paid' ? 'bg-green-100 text-green-800' :
                                    salary.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {salary.status?.toUpperCase() || 'UNKNOWN'}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Earnings, Bonuses & Deductions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Earnings */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 border-b pb-2">Earnings</h3>
                        <div className="space-y-2">
                            {earnings.map((item, index) => (
                                (item.amount > 0 || item.label.includes('Total')) && (
                                    <div key={index} className="flex justify-between">
                                        <span className={item.label.includes('Total') ? 'font-semibold' : ''}>
                                            {item.label}:
                                        </span>
                                        <span className={item.label.includes('Total') ? 'font-semibold' : ''}>
                                            {formatCurrency(item.amount)}
                                        </span>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>

                    {/* Bonuses */}
                    {hasBonus && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3 border-b pb-2">Bonuses</h3>
                            <div className="space-y-2">
                                {bonuses.map((item, index) => (
                                    (item.amount > 0 || item.label.includes('Total')) && (
                                        <div key={index} className="flex justify-between">
                                            <span className={item.label.includes('Total') ? 'font-semibold' : ''}>
                                                {item.label}:
                                            </span>
                                            <span className={item.label.includes('Total') ? 'font-semibold' : ''}>
                                                {formatCurrency(item.amount)}
                                            </span>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Other Earnings */}
                    {hasOtherEarnings && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3 border-b pb-2">Other Earnings</h3>
                            <div className="space-y-2">
                                {otherEarnings.map((item, index) => (
                                    item.amount > 0 && (
                                        <div key={index} className="flex justify-between">
                                            <span>{item.label}:</span>
                                            <span>{formatCurrency(item.amount)}</span>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Deductions */}
                    <div className={hasBonus || hasOtherEarnings ? 'md:col-span-3' : 'md:col-span-2'}>
                        <h3 className="text-lg font-semibold mb-3 border-b pb-2">Deductions</h3>
                        <div className="space-y-2">
                            {deductions.map((item, index) => (
                                (item.amount > 0 || item.label.includes('Total')) && (
                                    <div key={index} className="flex justify-between">
                                        <span className={item.label.includes('Total') ? 'font-semibold' : ''}>
                                            {item.label}:
                                        </span>
                                        <span className={item.label.includes('Total') ? 'font-semibold' : ''}>
                                            {formatCurrency(item.amount)}
                                        </span>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3 text-blue-900">Salary Summary</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Gross Salary:</span>
                                <span className="font-semibold">{formatCurrency(salary.gross_salary || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Deductions:</span>
                                <span className="font-semibold text-red-600">{formatCurrency(salary.total_deductions || 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Net Salary */}
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                        <h3 className="text-xl font-bold text-green-900">Net Salary</h3>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                            {formatCurrency(salary.net_salary || 0)}
                        </p>
                        <p className="text-sm text-green-700 mt-2">
                            Amount in Words: {convertToWords(salary.net_salary || 0)} Taka Only
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-gray-600 text-sm">
                    <p>This is a computer-generated payslip and does not require a signature.</p>
                    <p>Generated on: {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        font-size: 12px !important;
                    }
                    .bg-white {
                        background: white !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 20px !important;
                    }
                    .max-w-4xl {
                        max-width: 100% !important;
                    }
                    .bg-blue-50, .bg-green-50 {
                        background: #f0f8ff !important;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </>
    );
}

// টাকা কথায় কনভার্ট করার ফাংশন (ঐচ্ছিক)
function convertToWords(amount) {
    if (amount === 0) return 'Zero';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    // শুধু মৌলিক সংখ্যার জন্য (পূর্ণ সংখ্যা)
    const num = Math.floor(amount);
    
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    
    return 'Amount in Taka';
}