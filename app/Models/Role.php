<?php

// app/Models/Role.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'guard_name',
        'description',
    ];

    public function isProtectedAdmin(): bool
    {
        return $this->name === 'admin';
    }
}
