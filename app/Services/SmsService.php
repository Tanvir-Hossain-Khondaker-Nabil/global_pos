<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    protected $provider;
    protected $config;

    public function __construct($provider = null)
    {
        $this->provider = $provider ?? config('sms.default');
        $this->config = config('sms.providers.' . $this->provider);
    }

    public function sendSms($to, $message, $template = null, $variables = [])
    {
        if ($template && $templateConfig = config("sms.templates.{$template}")) {
            $message = $this->parseTemplate($templateConfig, $variables);
        }

        $to = preg_replace('/[^0-9]/', '', $to);

        if ($this->config['sandbox'] ?? true) {
            Log::info('SMS Sandbox Mode:', [
                'to' => $to,
                'message' => $message,
                'provider' => $this->provider,
                'config' => $this->config,
            ]);

            return [
                'success' => true,
                'message' => 'SMS sent in sandbox mode',
                'sandbox' => true,
            ];
        }

        try {
            $response = $this->sendViaMimsms($to, $message);
            return $response;
        } catch (\Exception $e) {
            Log::error('SMS sending failed: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    protected function sendViaMimsms($to, $message)
    {
        $response = Http::post($this->config['api_url'], [
            'api_key' => $this->config['api_key'],
            'sender_id' => $this->config['sender_id'],
            'mobile_number' => $to,
            'message' => $message,
        ]);

        if ($response->successful()) {
            $data = $response->json();

            if ($data['status'] === 'success') {
                return [
                    'success' => true,
                    'message_id' => $data['message_id'] ?? null,
                    'message' => 'SMS sent successfully',
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $data['message'] ?? 'Failed to send SMS',
                ];
            }
        }

        return [
            'success' => false,
            'message' => 'HTTP request failed',
        ];
    }

    protected function parseTemplate($template, $variables)
    {
        foreach ($variables as $key => $value) {
            $template = str_replace('{' . $key . '}', $value, $template);
        }
        return $template;
    }

    public function sendSupplierWelcome($supplier, $loginUrl = null)
    {
        $variables = [
            'contact_person' => $supplier->contact_person,
            'company_name' => $supplier->company ?: config('app.name'),
            'email' => $supplier->email,
            'phone' => $supplier->phone,
            'supplier_id' => $supplier->id,
            'advance_amount' => number_format($supplier->advance_amount, 2),
        ];

        $template = $supplier->advance_amount > 0
            ? 'supplier_welcome_with_advance'
            : 'supplier_welcome';

        return $this->sendSms($supplier->phone, '', $template, $variables);
    }

    public function sendSupplierAdvanceNotification($supplier, $payment)
    {
        $variables = [
            'contact_person' => $supplier->contact_person,
            'amount' => number_format($payment->amount, 2),
            'txn_ref' => $payment->txn_ref,
            'advance_balance' => number_format($supplier->advance_amount + $payment->amount, 2),
        ];

        return $this->sendSms($supplier->phone, '', 'supplier_advance_payment', $variables);
    }
}