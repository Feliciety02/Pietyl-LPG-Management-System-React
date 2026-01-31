<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.users.view')) {
            abort(403);
        }

        $filters = $request->only(['q', 'role', 'status', 'per', 'page']);
        $per = max(1, min(100, (int) ($filters['per'] ?? 10)));

        $query = User::query()->with(['roles', 'employee']);

        if (!empty($filters['q'])) {
            $q = trim((string) $filters['q']);
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        if (!empty($filters['role']) && $filters['role'] !== 'all') {
            $query->whereHas('roles', function ($roleQuery) use ($filters) {
                $roleQuery->where('name', $filters['role']);
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
                'role' => $u->primaryRoleName(),
                'employee' => $u->employee ? [
                    'id' => $u->employee->id,
                    'name' => $u->employee->fullName(),
                ] : null,
            ];
        });

        $roles = Role::query()
            ->orderBy('name')
            ->get(['id', 'name', 'description']);

        return Inertia::render('AdminPage/Users', [
            'users' => $users,
            'filters' => $filters,
            'roles' => $roles,
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
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::exists('roles', 'name')],
            'is_active' => 'nullable|boolean',
        ]);

        $created = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $created->syncRoles([$validated['role']]);

        return redirect()->back()->with('success', 'User created successfully.');
    }

}
