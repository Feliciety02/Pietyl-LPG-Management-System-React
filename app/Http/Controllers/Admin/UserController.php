<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.users.view')) {
            abort(403);
        }

        $filters = $request->only(['q', 'status', 'per', 'page']);
        $per = max(1, min(100, (int) ($filters['per'] ?? 10)));

        $query = User::query();

        if (!empty($filters['q'])) {
            $q = trim((string) $filters['q']);
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('is_active', $filters['status'] === 'active');
        }

        $users = $query
            ->orderBy('name')
            ->paginate($per)
            ->withQueryString();

        $users->through(function (User $u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'is_active' => $u->is_active,
                'created_at' => $u->created_at,
            ];
        });

        return Inertia::render('AdminPage/Users', [
            'users' => $users,
            'filters' => $filters,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.users.create')) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => ['required', 'confirmed', Password::min(12)->letters()->mixedCase()->numbers()->symbols()],
            'is_active' => 'nullable|boolean',
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'password' => Hash::make($validated['password']),
            'is_active' => $validated['is_active'] ?? true,
            'must_change_password' => true,
        ]);

        return redirect()->back()->with('success', 'User created successfully. The user must change their password on first login.');
    }

    public function resetPassword(Request $request, $userId)
    {
        $admin = $request->user();
        if (!$admin || !$admin->can('admin.users.update')) {
            abort(403);
        }

        $validated = $request->validate([
            'admin_password' => 'required|string',
            'new_password' => ['required', 'confirmed', Password::min(12)->letters()->mixedCase()->numbers()->symbols()],
        ]);

        if (!Hash::check($validated['admin_password'], $admin->password)) {
            AuditLog::create([
                'actor_user_id' => $admin->id,
                'action' => 'admin.users.reset_password_failed',
                'entity_type' => 'User',
                'entity_id' => (int) $userId,
                'message' => 'Admin password confirmation failed during password reset.',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            return response()->json(['message' => 'Incorrect password.'], 422);
        }

        $target = User::findOrFail($userId);
        $target->update([
            'password' => Hash::make($validated['new_password']),
            'must_change_password' => true,
            'password_changed_at' => null,
            'remember_token' => Str::random(60),
        ]);

        AuditLog::create([
            'actor_user_id' => $admin->id,
            'action' => 'admin.users.reset_password',
            'entity_type' => 'User',
            'entity_id' => $target->id,
            'message' => 'Admin reset a user password.',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        DB::table('password_reset_audits')->insert([
            'admin_user_id' => $admin->id,
            'target_user_id' => $target->id,
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit($request->userAgent() ?? '', 255),
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Password reset successfully. The user must change it on next login.']);
    }

    public function confirmPassword(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.users.update')) {
            abort(403);
        }

        $validated = $request->validate([
            'password' => 'required|string',
        ]);

        if (!Hash::check($validated['password'], $user->password)) {
            AuditLog::create([
                'actor_user_id' => $user->id,
                'action' => 'admin.password.confirm_failed',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'message' => 'Admin password confirmation failed.',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            return response()->json(['message' => 'Incorrect password.'], 422);
        }

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'admin.password.confirmed',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'message' => 'Admin password confirmation succeeded.',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['message' => 'Confirmed.']);
    }
}
