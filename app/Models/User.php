<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Permission\Models\Role;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'type',
        'role',
        'phone',
        'address',
        'status',
        'parent_id',
        'current_outlet_id',
        'outlet_logged_in_at',
        'total_deposit',
        'role_id'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',

    ];

    const ADMIN_ROLE = 1;
    const COMPANY_ROLE = 2;
    const USER_ROLE = 3;

    protected $casts = [
        'email_verified_at' => 'datetime',
        'outlet_logged_in_at' => 'datetime',
        'current_outlet_id' => 'integer',
    ];


    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }


    // relationship with businesses
    public function business()
    {
        return $this->hasOne(BusinessProfile::class, 'user_id', 'id');
    }

    public function scopeFilter($query, array $filters)
    {
        if ($filters['search'] ?? false) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }
    }

    public function currentOutlet()
    {
        return $this->belongsTo(Outlet::class, 'current_outlet_id');
    }

    // roles relationship

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Check if user is logged into an outlet
     */
    public function isLoggedIntoOutlet(): bool
    {
        return !is_null($this->current_outlet_id) && $this->current_outlet_id > 0;
    }

    /**
     * Get all available outlets for this user
     */
    public function getAvailableOutletsAttribute()
    {
        return Outlet::where('user_id', $this->id)->get();
    }

    /**
     * Check if user can access outlet
     */
    public function canAccessOutlet($outletId): bool
    {
        return $this->availableOutlets->contains('id', $outletId);
    }

    /**
     * Login to an outlet
     */
    public function loginToOutlet($outletId): bool
    {
        if (!$this->canAccessOutlet($outletId)) {
            return false;
        }

        $this->update([
            'current_outlet_id' => $outletId,
            'outlet_logged_in_at' => now(),
        ]);

        return true;
    }

    /**
     * Logout from current outlet
     */
    public function logoutFromOutlet(): void
    {
        $this->update([
            'current_outlet_id' => null,
            'outlet_logged_in_at' => null,
        ]);
    }

    /**
     * Get outlet login duration
     */
    public function getOutletLoginDurationAttribute()
    {
        if (!$this->outlet_logged_in_at) {
            return null;
        }

        return $this->outlet_logged_in_at->diffForHumans();
    }
}
