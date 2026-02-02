<?php

namespace App\Console\Commands;

use App\Models\Installment;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Console\Command;

class InstallmentCommand extends Command
{
    protected $signature = 'installments:due-notification';

    protected $description = 'Send notification before installment due date';

    public function handle()
    {
        $today = Carbon::today();

        $installments = Installment::where('status', 'due')
            ->whereIn('due_date', [
                $today,
                $today->copy()->addDay(),
                $today->copy()->addDays(2),
            ])
            ->get();

        foreach ($installments as $installment) {

            $exists = Notification::where('installment_id', $installment->id)
                ->whereDate('notify_date', $installment->due_date)
                ->exists();

            if ($exists) {
                continue;
            }

            Notification::create([
                'installment_id' => $installment->id,
                'sale_id'        => $installment->sale_id,
                'purchase_id'    => $installment->purchase_id,
                'title'          => 'Installment Due Reminder',
                'message'        => 'Your installment #' . $installment->installment_no .
                                    ' amount ৳' . $installment->amount .
                                    ' is due on ' . $installment->due_date,
                'notify_date'    => $installment->due_date,
            ]);
        }

        $this->info('Installment due notifications sent.');
    }
}
