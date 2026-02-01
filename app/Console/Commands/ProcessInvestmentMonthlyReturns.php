<?php

namespace App\Console\Commands;

use App\Models\Investment;
use App\Models\InvestmentReturn;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ProcessInvestmentMonthlyReturns extends Command
{
    protected $signature = 'investments:process-monthly-returns {--date= : Process as of date (YYYY-MM-DD)}';
    protected $description = 'Generate month-end investment returns for active investments';

    public function handle(): int
    {
        $tz = config('app.timezone', 'Asia/Dhaka');

        $asOf = $this->option('date')
            ? Carbon::parse($this->option('date'), $tz)
            : Carbon::now($tz);

        $periodEnd = $asOf->copy()->endOfMonth()->startOfDay(); // date only

        $this->info("Processing month-end returns for period_end = " . $periodEnd->toDateString());

        $count = 0;
        
        $investments = Investment::withoutGlobalScopes()
            ->where('status', 'active')
            ->get();

        foreach ($investments as $inv) {
            DB::transaction(function () use ($inv, $periodEnd, &$count) {

                // ✅ Basic guards
                if ((float)$inv->current_principal <= 0) {
                    
                    $inv->status = 'closed';
                    $inv->save();
                    return;
                }

                
                if ($inv->start_date && Carbon::parse($inv->start_date)->gt($periodEnd)) {
                    return;
                }

                
                if ($inv->end_date && Carbon::parse($inv->end_date)->lt($periodEnd)) {
                    $inv->status = 'completed';
                    $inv->save();
                    return;
                }

                
                if ($inv->last_profit_date && Carbon::parse($inv->last_profit_date)->gte($periodEnd)) {
                    return;
                }

                
                $exists = InvestmentReturn::withoutGlobalScopes()
                    ->where('investment_id', $inv->id)
                    ->where('period_end', $periodEnd->toDateString())
                    ->exists();

                if ($exists) {
                    
                    $inv->last_profit_date = $periodEnd->toDateString();
                    $inv->save();
                    return;
                }

                $principal = (float) $inv->current_principal;
                $rate = (float) $inv->profit_rate;

                
                $profit = round(($principal * $rate) / 100, 2);

                InvestmentReturn::create([
                    'created_by' => $inv->created_by, 
                    'investment_id' => $inv->id,
                    'period_end' => $periodEnd->toDateString(),
                    'principal_snapshot' => $principal,
                    'profit_amount' => $profit,
                    'status' => 'pending',
                    'paid_date' => null,
                ]);

                $inv->last_profit_date = $periodEnd->toDateString();
                $inv->save();

                $count++;
            });
        }

        $this->info("Generated returns: {$count}");
        return self::SUCCESS;
    }
}
