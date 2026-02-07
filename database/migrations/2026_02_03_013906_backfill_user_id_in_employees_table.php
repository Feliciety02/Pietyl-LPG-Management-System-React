<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $users = DB::table('users')->whereNotNull('employee_id')->get(['id', 'employee_id']);
        foreach ($users as $user) {
            DB::table('employees')
                ->where('id', $user->employee_id)
                ->whereNull('user_id')
                ->update(['user_id' => $user->id]);
        }
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
