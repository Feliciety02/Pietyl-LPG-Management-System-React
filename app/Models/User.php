<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Role> $roles
 * @method \Illuminate\Database\Eloquent\Relations\BelongsToMany roles()
 * @method string|null primaryRoleName()
 */
class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'employee_id',
        'name',
        'email',
        'password',
        'is_active',
        'must_change_password',
        'password_changed_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'must_change_password' => 'boolean',
        'email_verified_at' => 'datetime',
        'password_changed_at' => 'datetime',
        'two_factor_secret' => 'encrypted',
        'two_factor_confirmed_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->hasOne(Employee::class, 'user_id');
    }

    public function primaryRoleName(): ?string
    {
        if ($this->relationLoaded('roles')) {
            $role = $this->roles->sortBy('name')->first();
            return $role ? $role->name : null;
        }

        return $this->roles()->orderBy('name')->value('name');
    }

    public function requiresTwoFactor(): bool
    {
        return $this->hasAnyRole(['admin', 'accountant', 'inventory_manager']);
    }

    public function hasTwoFactorEnabled(): bool
    {
        return !empty($this->two_factor_secret) && $this->two_factor_confirmed_at !== null;
    }

    public function requiresPasswordChange(): bool
    {
        return (bool) $this->must_change_password;
    }
}
