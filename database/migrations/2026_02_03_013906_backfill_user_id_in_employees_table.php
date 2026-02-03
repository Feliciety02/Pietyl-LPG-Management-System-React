<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Copy users.id into employees.user_id where users.employee_id matches employees.id
        DB::table('employees')
            ->join('users', 'users.employee_id', '=', 'employees.id')
            ->whereNull('employees.user_id')
            ->update(['employees.user_id' => DB::raw('users.id')]);
    }

    public function down(): void
    {
        // Rollback only the rows that were backfilled, if you want a safe revert
        // This keeps manually set user_id untouched if ever used later.
        DB::table('employees')
            ->whereNotNull('user_id')
            ->update(['user_id' => null]);
    }
};
