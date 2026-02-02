<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Console\Scheduling\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

app()->booted(function () {

    $schedule = app(Schedule::class);

    // ✅ Monthly investment process
    $schedule->command('investments:process-monthly-returns')
        ->lastDayOfMonth('23:50')
        ->timezone('Asia/Dhaka')
        ->withoutOverlapping();

    // ✅ Daily installment notification (recommended time)
    $schedule->command('installments:due-notification')
        ->dailyAt('09:00')
        ->timezone('Asia/Dhaka')
        ->withoutOverlapping();
});
