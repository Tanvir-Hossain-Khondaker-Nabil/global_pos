<?php

return [
    'default' => env('SMS_PROVIDER', 'mimsms'),

    'providers' => [
        'mimsms' => [
            'api_key' => env('MIMSMS_API_KEY', 'sandbox_key'),
            'sender_id' => env('MIMSMS_SENDER_ID', 'NEXORYN'),
            'api_url' => env('MIMSMS_API_URL', 'https://api.mimsms.com/api/v1/send-sms'),
            'sandbox' => env('MIMSMS_SANDBOX_MODE', true),
        ],
    ],

    'templates' => [
        'supplier_welcome' => 'Dear {contact_person}, Welcome to {company_name}! Your supplier account has been created. Email: {email}, Phone: {phone}. Supplier ID: {supplier_id}.',

        'supplier_welcome_with_advance' => 'Dear {contact_person}, Welcome to {company_name}! Your supplier account has been created with an advance of {advance_amount}. Email: {email}, Phone: {phone}. Supplier ID: {supplier_id}.',

        'supplier_advance_payment' => 'Dear {contact_person}, Advance payment of {amount} received. Txn Ref: {txn_ref}. New advance balance: {advance_balance}.',
    ],
];