<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.employees.view')) {
            abort(403);
        }

        $filters = $request->only(['q', 'status', 'per', 'page']);
        $per = max(1, min(100, (int) ($filters['per'] ?? 10)));

        $query = Employee::query()->with(['user.roles']);

        if (!empty($filters['q'])) {
            $q = trim((string) $filters['q']);
            $query->where(function ($sub) use ($q) {
                $sub->where('employee_no', 'like', "%{$q}%")
                    ->orWhere('position', 'like', "%{$q}%")
                    ->orWhereHas('user', function ($uq) use ($q) {
                        $uq->where('name', 'like', "%{$q}%")
                           ->orWhere('email', 'like', "%{$q}%");
                    });
            });
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        $employees = $query
            ->orderBy('employee_no')
            ->paginate($per)
            ->withQueryString();

        $employees->through(function (Employee $employee) {
            return [
                'id' => $employee->id,
                'employee_no' => $employee->employee_no,
                'position' => $employee->position,
                'status' => $employee->status,
                'notes' => $employee->notes,
                'phone' => $employee->phone,
                'hired_at' => $employee->hired_at,
                'user' => $employee->user ? [
                    'id' => $employee->user->id,
                    'name' => $employee->user->name,
                    'email' => $employee->user->email,
                    'role' => $employee->user->primaryRoleName(),
                ] : null,
            ];
        });

        // Step 3 change
        // old: whereNull('employee_id')
        // new: whereDoesntHave('employee') because User hasOne Employee via employees.user_id
        $eligibleUsers = User::query()
            ->whereDoesntHave('employee')
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('AdminPage/Employees', [
            'employees' => $employees,
            'filters' => $filters,
            'next_employee_no' => $this->generateEmployeeNo(),
            'eligible_users' => $eligibleUsers,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.employees.create')) {
            abort(403);
        }

        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id|unique:employees,user_id',
            'employee_no' => 'nullable|string|max:50|unique:employees,employee_no',
            'position' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,inactive,resigned,terminated',
        ]);

        $targetUser = User::query()->with('employee')->findOrFail($validated['user_id']);

        // Step 3 change
        // old: if ($targetUser->employee_id) ...
        // new: check the relationship that uses employees.user_id
        if ($targetUser->employee) {
            return redirect()->back()->withErrors([
                'user_id' => 'This user already has an employee record.',
            ]);
        }

        $employeeNo = $validated['employee_no'] ?? null;
        if (!$employeeNo) {
            $employeeNo = $this->generateEmployeeNo();
        }

        // Step 3 change
        // old: create employee without user_id then associate to user.employee_id
        // new: create employee with user_id directly
        $employee = Employee::create([
            'user_id' => $targetUser->id,
            'employee_no' => $employeeNo,
            'position' => $validated['position'] ?? null,
            'status' => $validated['status'] ?? 'active',
        ]);

        $roleName = $this->roleFromPosition($employee->position);

        if ($roleName && Role::where('name', $roleName)->exists()) {
            $targetUser->syncRoles([$roleName]);
        }

        return redirect()->back()->with('success', 'Employee created and user assigned successfully.');
    }

    public function update(Request $request, Employee $employee)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.employees.update')) {
            abort(403);
        }

        $validated = $request->validate([
            'employee_no' => 'nullable|string|max:50|unique:employees,employee_no,' . $employee->id,
            'position' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,inactive,resigned,terminated',
            'phone' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'hired_at' => 'nullable|date',
        ]);

        $employeeNo = $validated['employee_no'] ?? $employee->employee_no;
        if (!$employeeNo) {
            $employeeNo = $this->generateEmployeeNo();
        }

        $employee->update([
            'employee_no' => $employeeNo,
            'position' => $validated['position'] ?? $employee->position,
            'status' => $validated['status'] ?? $employee->status,
            'phone' => $validated['phone'] ?? $employee->phone,
            'notes' => $validated['notes'] ?? $employee->notes,
            'hired_at' => $validated['hired_at'] ?? $employee->hired_at,
        ]);

        if ($employee->user) {
            $roleName = $this->roleFromPosition($employee->position);
            if ($roleName && Role::where('name', $roleName)->exists()) {
                $employee->user->syncRoles([$roleName]);
            }
        }

        return redirect()->back()->with('success', 'Employee updated successfully.');
    }

    private function roleFromPosition(?string $position): ?string
    {
        if (!$position) return null;

        $p = strtolower(trim($position));

        if (str_contains($p, 'cashier')) return 'cashier';
        if (str_contains($p, 'inventory')) return 'inventory_manager';
        if (str_contains($p, 'delivery') || str_contains($p, 'rider')) return 'rider';
        if (str_contains($p, 'accountant')) return 'accountant';
        if (str_contains($p, 'admin') || str_contains($p, 'owner')) return 'admin';

        return null;
    }

    private function generateEmployeeNo(): string
    {
        $latest = Employee::query()
            ->where('employee_no', 'like', 'EMP-%')
            ->orderByDesc('employee_no')
            ->value('employee_no');

        $next = 1;
        if ($latest && preg_match('/EMP-(\d+)/', $latest, $matches)) {
            $next = (int) $matches[1] + 1;
        }

        $candidate = 'EMP-' . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
        while (Employee::where('employee_no', $candidate)->exists()) {
            $next++;
            $candidate = 'EMP-' . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
        }

        return $candidate;
    }
}
