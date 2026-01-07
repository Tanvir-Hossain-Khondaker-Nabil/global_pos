<?php

namespace App\Services;

use App\Models\SmsTemplate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class SmsService
{
    protected $gateway;
    protected $config;

    public function __construct($gatewayId = null)
    {
        if ($gatewayId) {
            // Get specific gateway
            $this->gateway = SmsTemplate::find($gatewayId);
            
            // Check if user owns this gateway
            if ($this->gateway && $this->gateway->created_by !== Auth::id()) {
                throw new \Exception('আপনি এই SMS Gateway ব্যবহার করার অনুমতি পাননি।');
            }
        } else {
            // Get current user's gateway
            $this->gateway = $this->getUserGateway();
        }

        if (!$this->gateway) {
            throw new \Exception('কোনো SMS Gateway কনফিগার করা নেই।');
        }

        if (!$this->gateway->is_active) {
            throw new \Exception('SMS Gatewayটি নিষ্ক্রিয় অবস্থায় আছে।');
        }

        if (!$this->gateway->is_configured) {
            throw new \Exception('SMS Gatewayটির কনফিগারেশন অসম্পূর্ণ।');
        }

        // Set configuration
        $this->config = [
            'api_key' => $this->gateway->api_key,
            'api_secret' => $this->gateway->api_secret,
            'sender_id' => $this->gateway->sender_id,
            'api_url' => $this->gateway->api_url,
        ];
    }

    protected function getUserGateway()
    {
        $user = Auth::user();

        if (!$user) {
            throw new \Exception('অনুমোদিত ইউজার পাওয়া যায়নি।');
        }

        // Get only the user's own gateway
        return SmsTemplate::where('created_by', $user->id)
            ->active()
            ->configured()
            ->first();
    }

    public function sendSms($to, $message, $template = null, $variables = [])
    {
        try {
            if ($template) {
                $templateConfig = $this->getTemplate($template);
                if ($templateConfig) {
                    $message = $this->parseTemplate($templateConfig, $variables);
                }
            }

            // Clean phone number
            $to = preg_replace('/[^0-9]/', '', $to);

            Log::info('SMS Request:', [
                'gateway_id' => $this->gateway->id,
                'gateway_name' => $this->gateway->name,
                'to' => $to,
                'message' => $message,
                'sender_id' => $this->config['sender_id'],
                'user_id' => Auth::id(),
            ]);

            $response = $this->sendViaApi($to, $message);

            // Update gateway balance if returned in response
            if (isset($response['balance'])) {
                $this->gateway->update(['balance' => $response['balance']]);
            }

            return $response;
        } catch (\Exception $e) {
            Log::error('SMS sending failed: ' . $e->getMessage(), [
                'gateway_id' => $this->gateway->id,
                'gateway_name' => $this->gateway->name,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
                'gateway' => $this->gateway->name,
            ];
        }
    }

    protected function sendViaApi($to, $message)
    {
        $url = $this->config['api_url'];
        $provider = $this->detectProvider($url);

        switch ($provider) {
            case 'mimsms':
                return $this->sendViaMimsms($to, $message);
            case 'twilio':
                return $this->sendViaTwilio($to, $message);
            case 'nexmo':
                return $this->sendViaNexmo($to, $message);
            case 'clicksend':
                return $this->sendViaClickSend($to, $message);
            default:
                return $this->sendViaGenericApi($to, $message);
        }
    }

    protected function sendViaMimsms($to, $message)
    {
        $response = Http::timeout(30)->post($this->config['api_url'], [
            'api_key' => $this->config['api_key'],
            'sender_id' => $this->config['sender_id'],
            'mobile_number' => $to,
            'message' => $message,
        ]);

        if ($response->successful()) {
            $data = $response->json();

            if (isset($data['status']) && $data['status'] === 'success') {
                return [
                    'success' => true,
                    'message_id' => $data['message_id'] ?? null,
                    'message' => 'SMS সফলভাবে পাঠানো হয়েছে (MIMSMS)',
                    'gateway' => $this->gateway->name,
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $data['message'] ?? 'SMS পাঠানো ব্যর্থ হয়েছে',
                    'gateway' => $this->gateway->name,
                ];
            }
        }

        return [
            'success' => false,
            'message' => 'HTTP রিকোয়েস্ট ব্যর্থ',
            'gateway' => $this->gateway->name,
            'status' => $response->status(),
        ];
    }

    protected function sendViaTwilio($to, $message)
    {
        $response = Http::timeout(30)->withBasicAuth(
            $this->config['api_key'],
            $this->config['api_secret']
        )->post($this->config['api_url'], [
            'To' => $to,
            'From' => $this->config['sender_id'],
            'Body' => $message,
        ]);

        if ($response->successful()) {
            $data = $response->json();
            return [
                'success' => true,
                'message_id' => $data['sid'] ?? null,
                'message' => 'SMS সফলভাবে পাঠানো হয়েছে (Twilio)',
                'gateway' => $this->gateway->name,
            ];
        }

        return [
            'success' => false,
            'message' => 'Twilio এর মাধ্যমে পাঠানো ব্যর্থ',
            'gateway' => $this->gateway->name,
            'error' => $response->body(),
        ];
    }

    protected function sendViaNexmo($to, $message)
    {
        $response = Http::timeout(30)->post($this->config['api_url'], [
            'api_key' => $this->config['api_key'],
            'api_secret' => $this->config['api_secret'],
            'to' => $to,
            'from' => $this->config['sender_id'],
            'text' => $message,
        ]);

        if ($response->successful()) {
            $data = $response->json();

            if (isset($data['messages'][0]['status']) && $data['messages'][0]['status'] == '0') {
                return [
                    'success' => true,
                    'message_id' => $data['messages'][0]['message-id'] ?? null,
                    'message' => 'SMS সফলভাবে পাঠানো হয়েছে (Vonage/Nexmo)',
                    'gateway' => $this->gateway->name,
                ];
            }
        }

        return [
            'success' => false,
            'message' => 'Vonage/Nexmo এর মাধ্যমে পাঠানো ব্যর্থ',
            'gateway' => $this->gateway->name,
        ];
    }

    protected function sendViaClickSend($to, $message)
    {
        $response = Http::timeout(30)->withBasicAuth(
            $this->config['api_key'],
            ''
        )->post($this->config['api_url'], [
            'messages' => [
                [
                    'source' => 'php',
                    'from' => $this->config['sender_id'],
                    'to' => $to,
                    'body' => $message,
                ]
            ]
        ]);

        if ($response->successful()) {
            $data = $response->json();

            if (isset($data['response_code']) && $data['response_code'] == 'SUCCESS') {
                return [
                    'success' => true,
                    'message_id' => $data['data']['messages'][0]['message_id'] ?? null,
                    'message' => 'SMS সফলভাবে পাঠানো হয়েছে (ClickSend)',
                    'gateway' => $this->gateway->name,
                ];
            }
        }

        return [
            'success' => false,
            'message' => 'ClickSend এর মাধ্যমে পাঠানো ব্যর্থ',
            'gateway' => $this->gateway->name,
        ];
    }

    protected function sendViaGenericApi($to, $message)
    {
        $response = Http::timeout(30)->post($this->config['api_url'], [
            'to' => $to,
            'message' => $message,
            'sender' => $this->config['sender_id'],
            'api_key' => $this->config['api_key'],
            'api_secret' => $this->config['api_secret'] ?? null,
        ]);

        if ($response->successful()) {
            return [
                'success' => true,
                'message' => 'SMS সফলভাবে পাঠানো হয়েছে (কাস্টম Gateway)',
                'gateway' => $this->gateway->name,
            ];
        }

        return [
            'success' => false,
            'message' => 'কাস্টম Gateway এর মাধ্যমে পাঠানো ব্যর্থ',
            'gateway' => $this->gateway->name,
        ];
    }

    protected function detectProvider($url)
    {
        $url = strtolower($url);

        if (strpos($url, 'twilio') !== false) return 'twilio';
        if (strpos($url, 'nexmo') !== false) return 'nexmo';
        if (strpos($url, 'vonage') !== false) return 'nexmo';
        if (strpos($url, 'clicksend') !== false) return 'clicksend';
        if (strpos($url, 'mimsms') !== false) return 'mimsms';

        return 'generic';
    }

    protected function getTemplate($templateName)
    {
        $templates = config('sms.templates', []);
        return $templates[$templateName] ?? null;
    }

    protected function parseTemplate($template, $variables)
    {
        foreach ($variables as $key => $value) {
            $template = str_replace('{' . $key . '}', $value, $template);
        }
        return $template;
    }

    public function testConnection($gatewayId = null)
    {
        try {
            if ($gatewayId) {
                $gateway = SmsTemplate::find($gatewayId);
                if (!$gateway) {
                    return [
                        'success' => false,
                        'message' => 'Gateway পাওয়া যায়নি',
                    ];
                }
                
                // Check ownership
                if ($gateway->created_by !== Auth::id()) {
                    return [
                        'success' => false,
                        'message' => 'আপনি এই Gateway টেস্ট করার অনুমতি পাননি',
                    ];
                }
                
                $this->gateway = $gateway;
                $this->config = [
                    'api_key' => $gateway->api_key,
                    'api_secret' => $gateway->api_secret,
                    'sender_id' => $gateway->sender_id,
                    'api_url' => $gateway->api_url,
                ];
            }

            // Try to get balance as connection test
            $balance = $this->getBalance();

            return [
                'success' => true,
                'message' => 'কানেকশন সফল',
                'balance' => $balance,
                'gateway' => $this->gateway->name,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'কানেকশন ব্যর্থ: ' . $e->getMessage(),
                'gateway' => $this->gateway->name ?? 'অজানা',
            ];
        }
    }

    public function getBalance()
    {
        $provider = $this->detectProvider($this->config['api_url']);

        switch ($provider) {
            case 'mimsms':
                return $this->getMimsmsBalance();
            case 'twilio':
                return $this->getTwilioBalance();
            default:
                return 'এই প্রোভাইডারের জন্য ব্যালেন্স চেক উপলব্ধ নয়';
        }
    }

    protected function getMimsmsBalance()
    {
        try {
            $response = Http::timeout(30)->post('https://api.mimsms.com/api/v1/balance', [
                'api_key' => $this->config['api_key'],
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['balance'] ?? 'অজানা';
            }
        } catch (\Exception $e) {
            Log::error('MIMSMS ব্যালেন্স চেক ব্যর্থ: ' . $e->getMessage());
        }

        return 'ব্যালেন্স ফেচ করতে ব্যর্থ';
    }

    protected function getTwilioBalance()
    {
        try {
            $response = Http::timeout(30)->withBasicAuth(
                $this->config['api_key'],
                $this->config['api_secret']
            )->get("https://api.twilio.com/2010-04-01/Accounts/{$this->config['api_key']}/Balance.json");

            if ($response->successful()) {
                $data = $response->json();
                return ($data['balance'] ?? '0') . ' ' . ($data['currency'] ?? 'USD');
            }
        } catch (\Exception $e) {
            Log::error('Twilio ব্যালেন্স চেক ব্যর্থ: ' . $e->getMessage());
        }

        return 'ব্যালেন্স ফেচ করতে ব্যর্থ';
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

    public function sendBulk($recipients, $message, $template = null, $variables = [])
    {
        $results = [];

        foreach ($recipients as $recipient) {
            $result = $this->sendSms($recipient['phone'], $message, $template, $variables);
            $results[] = [
                'phone' => $recipient['phone'],
                'success' => $result['success'],
                'message' => $result['message'],
            ];
            
            // Add small delay to avoid rate limiting
            usleep(100000); // 100ms delay
        }

        return $results;
    }
}