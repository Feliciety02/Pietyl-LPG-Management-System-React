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
        'email',
        'password',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'email_verified_at' => 'datetime',
    ];
    

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function primaryRoleName(): ?string
    {
        return $this->roles()->orderBy('name')->value('name');
    }
}
