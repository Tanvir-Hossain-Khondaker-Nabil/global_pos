<?php
// app/Models/Leave.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Leave extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'type', // 'sick', 'casual', 'earned', 'maternity', 'paternity', 'unpaid'
        'start_date',
        'end_date',
        'total_days',
        'reason',
        'status', // 'pending', 'approved', 'rejected', 'cancelled'
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
        'is_half_day',
        'half_day_type', // 'first_half', 'second_half'
        'attachment',
        'notes'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'is_half_day' => 'boolean',
        'total_days' => 'decimal:2'
    ];

    protected $appends = [
        'leave_type_name',
        'status_badge',
        'duration'
    ];

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
    
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
    
    public function rejector()
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    // Accessors
    public function getLeaveTypeNameAttribute()
    {
        $types = [
            'sick' => 'Sick Leave',
            'casual' => 'Casual Leave',
            'earned' => 'Earned Leave',
            'maternity' => 'Maternity Leave',
            'paternity' => 'Paternity Leave',
            'unpaid' => 'Unpaid Leave'
        ];
        
        return $types[$this->type] ?? ucfirst($this->type);
    }
    
    public function getStatusBadgeAttribute()
    {
        $badges = [
            'pending' => 'warning',
            'approved' => 'success',
            'rejected' => 'danger',
            'cancelled' => 'secondary'
        ];
        
        return $badges[$this->status] ?? 'secondary';
    }
    
    public function getDurationAttribute()
    {
        if ($this->is_half_day) {
            return 'Half Day';
        }
        
        $days = $this->total_days;
        if ($days == 1) {
            return '1 Day';
        }
        
        return "{$days} Days";
    }
    
    // Calculate total days excluding Fridays
    public function calculateWorkingDays()
    {
        $start = \Carbon\Carbon::parse($this->start_date);
        $end = \Carbon\Carbon::parse($this->end_date);
        
        $days = 0;
        for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
            // Skip Fridays (weekend)
            if ($date->dayOfWeek != \Carbon\Carbon::FRIDAY) {
                $days += 1;
            }
        }
        
        // Adjust for half day
        if ($this->is_half_day) {
            $days = $days - 0.5;
        }
        
        return max(0.5, $days); // Minimum half day
    }
    
    // Scope queries
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
    
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }
    
    public function scopeForEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }
    
    public function scopeForPeriod($query, $startDate, $endDate)
    {
        return $query->where(function($q) use ($startDate, $endDate) {
            $q->whereBetween('start_date', [$startDate, $endDate])
              ->orWhereBetween('end_date', [$startDate, $endDate])
              ->orWhere(function($q2) use ($startDate, $endDate) {
                  $q2->where('start_date', '<=', $startDate)
                     ->where('end_date', '>=', $endDate);
              });
        });
    }
    
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }
}