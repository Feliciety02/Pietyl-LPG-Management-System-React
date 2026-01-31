<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SyncLegacyRoles
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user) {
            return $next($request);
        }

        $hasSpatieRole = DB::table('model_has_roles')
            ->where('model_type', get_class($user))
            ->where('model_id', $user->id)
            ->exists();

        if (!$hasSpatieRole && DB::schema()->hasTable('user_roles')) {
            $legacyRoleIds = DB::table('user_roles')
                ->where('user_id', $user->id)
                ->pluck('role_id')
                ->all();

            if (!empty($legacyRoleIds)) {
                $payload = array_map(function ($roleId) use ($user) {
                    return [
                        'role_id' => $roleId,
                        'model_type' => get_class($user),
                        'model_id' => $user->id,
                    ];
                }, $legacyRoleIds);

                DB::table('model_has_roles')->insertOrIgnore($payload);
            }
        }

        return $next($request);
    }
}
