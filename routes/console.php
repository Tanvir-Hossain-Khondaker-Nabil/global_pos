<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('investments:process-monthly-returns')
    ->lastDayOfMonth('23:50') 
    ->timezone('Asia/Dhaka')
    ->withoutOverlapping();
