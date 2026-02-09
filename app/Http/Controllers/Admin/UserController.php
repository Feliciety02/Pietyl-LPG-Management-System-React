<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
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
            'is_active' => 'nullable|boolean',
        ]);

        $tempPassword = Str::random(32);

        User::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'password' => Hash::make($tempPassword),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->back()->with('success', 'User created successfully.');
    }

    public function resetPassword(Request $request, $userId)
    {
        $admin = $request->user();
        if (!$admin || !$admin->can('admin.users.update')) {
            abort(403);
        }

        $validated = $request->validate([
            'admin_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($validated['admin_password'], $admin->password)) {
            return response()->json(['message' => 'Incorrect password.'], 422);
        }

        $target = User::findOrFail($userId);
        $target->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        DB::table('password_reset_audits')->insert([
            'admin_user_id' => $admin->id,
            'target_user_id' => $target->id,
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit($request->userAgent() ?? '', 255),
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Password reset successfully.']);
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
            return response()->json(['message' => 'Incorrect password.'], 422);
        }

        return response()->json(['message' => 'Confirmed.']);
    }
}
