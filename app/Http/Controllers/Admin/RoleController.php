<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class RoleController extends Controller
{
    private const SYSTEM_ROLES = [
        'admin',
        'inventory_manager',
        'cashier',
        'accountant',
        'rider',
    ];

    public function index(Request $request)
    {
        $filters = [
            'q' => $request->input('q', ''),
            'scope' => $request->input('scope', 'all'),
            'per' => (int) $request->input('per', 10),
            'page' => (int) $request->input('page', 1),
        ];

        $per = max(1, min(100, $filters['per'] ?? 10));

        $query = Role::query();

        if ($filters['q']) {
            $q = $filters['q'];
            $query->where(function ($builder) use ($q) {
                $builder->where('name', 'like', '%' . $q . '%')
                    ->orWhere('description', 'like', '%' . $q . '%');
            });
        }

        if ($filters['scope'] === 'system') {
            $query->whereIn('name', self::SYSTEM_ROLES);
        } elseif ($filters['scope'] === 'custom') {
            $query->whereNotIn('name', self::SYSTEM_ROLES);
        }

        $roles = $query
            ->withCount('users')
            ->with(['users:id,name,email'])
            ->orderBy('name')
            ->paginate($per)
            ->withQueryString();

        $roles->getCollection()->transform(function (Role $role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'label' => $role->description,
                'users_count' => $role->users_count ?? 0,
                'permissions_count' => 0,
                'is_system' => in_array($role->name, self::SYSTEM_ROLES, true),
                'updated_at' => $role->updated_at?->format('Y-m-d H:i'),
                'users' => $role->users->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'last_active_at' => null,
                    ];
                })->values()->all(),
            ];
        });

        return Inertia::render('AdminPage/Roles', [
            'roles' => $roles,
            'filters' => $filters,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')],
            'label' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'source_role_id' => ['nullable', 'integer', 'exists:roles,id'],
        ]);

        Role::create([
            'name' => $data['name'],
            'description' => $data['label'] ?? $data['description'] ?? null,
        ]);

        return back();
    }

    public function update(Request $request, Role $role)
    {
        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('roles', 'name')->ignore($role->id),
            ],
            'label' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $role->update([
            'name' => $data['name'],
            'description' => $data['label'] ?? $data['description'] ?? null,
        ]);

        return back();
    }

    public function archive(Role $role)
    {
        if (in_array($role->name, self::SYSTEM_ROLES, true)) {
            return back()->withErrors(['role' => 'System roles cannot be archived.']);
        }

        $role->delete();

        return back();
    }
}
