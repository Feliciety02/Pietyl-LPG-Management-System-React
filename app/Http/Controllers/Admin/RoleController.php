<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

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
        $user = $request->user();
        if (!$user || !$user->can('admin.roles.view')) {
            abort(403);
        }

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
        } elseif ($filters['scope'] === 'archived') {
            $query->onlyTrashed();
        } elseif ($filters['scope'] === 'all_with_archived') {
            $query->withTrashed();
        }

        $roles = $query
            ->withCount(['users', 'permissions'])
            ->with(['users:id,name,email', 'permissions:id,name'])
            ->orderBy('name')
            ->paginate($per)
            ->withQueryString();

        $roles->getCollection()->transform(function (Role $role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'label' => $role->description,
                'users_count' => $role->users_count ?? 0,
                'permissions_count' => $role->permissions_count ?? 0,
                'is_system' => in_array($role->name, self::SYSTEM_ROLES, true),
                'is_archived' => $role->trashed(),
                'archived_at' => $role->deleted_at?->format('Y-m-d H:i'),
                'updated_at' => $role->updated_at?->format('Y-m-d H:i'),
                'users' => $role->users->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'last_active_at' => null,
                    ];
                })->values()->all(),
                'permissions' => $role->permissions
                    ? $role->permissions->pluck('name')->values()->all()
                    : [],
            ];
        });

        $permissions = Permission::query()
            ->where('guard_name', config('auth.defaults.guard', 'web'))
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('AdminPage/Roles', [
            'roles' => $roles,
            'filters' => $filters,
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.roles.create')) {
            abort(403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')],
            'label' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'source_role_id' => ['nullable', 'integer', 'exists:roles,id'],
        ]);

        $role = Role::create([
            'name' => $data['name'],
            'guard_name' => config('auth.defaults.guard', 'web'),
            'description' => $data['label'] ?? $data['description'] ?? null,
        ]);

        if (!empty($data['source_role_id'])) {
            $source = Role::find($data['source_role_id']);
            if ($source) {
                $role->syncPermissions($source->permissions);
            }
        }

        $this->refreshPermissionCache();

        return back();
    }

    public function update(Request $request, Role $role)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.roles.update')) {
            abort(403);
        }

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

        if ($role->isProtectedAdmin()) {
            return back()->withErrors(['role' => 'The admin role is protected and cannot be modified.']);
        }

        $role->update([
            'name' => $data['name'],
            'description' => $data['label'] ?? $data['description'] ?? null,
        ]);

        return back();
    }

    public function archive(Role $role)
    {
        $user = request()->user();
        if (!$user || !$user->can('admin.roles.archive')) {
            abort(403);
        }

        if (in_array($role->name, self::SYSTEM_ROLES, true)) {
            return back()->withErrors(['role' => 'System roles cannot be archived.']);
        }

        $role->delete();

        return back();
    }

    public function restore(int $role)
    {
        $user = request()->user();
        if (!$user || !$user->can('admin.roles.restore')) {
            abort(403);
        }

        $model = Role::withTrashed()->findOrFail($role);

        $model->restore();

        return back();
    }

    public function updatePermissions(Request $request, Role $role)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.roles.permissions')) {
            abort(403);
        }

        $data = $request->validate([
            'permissions' => ['array'],
            'permissions.*' => ['string'],
        ]);

        $guard = config('auth.defaults.guard', 'web');

        $names = $data['permissions'] ?? [];

        $permissions = Permission::query()
            ->where('guard_name', $guard)
            ->whereIn('name', $names)
            ->get();

        $role->syncPermissions($permissions);
        $this->refreshPermissionCache();

        return back();
    }

    private function refreshPermissionCache(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
