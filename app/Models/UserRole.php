<?php

// app/Models/UserRole.php (optional, only if you want a pivot model)

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class UserRole extends Pivot
{
    use HasFactory;

    protected $table = 'user_roles';

    protected $fillable = [
        'user_id',
        'role_id',
    ];
}
