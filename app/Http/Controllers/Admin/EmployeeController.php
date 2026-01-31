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
                $sub->where('first_name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhere('employee_no', 'like', "%{$q}%");
            });
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        $employees = $query
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate($per)
            ->withQueryString();

        $employees->through(function (Employee $employee) {
            return [
                'id' => $employee->id,
                'employee_no' => $employee->employee_no,
                'first_name' => $employee->first_name,
                'last_name' => $employee->last_name,
                'position' => $employee->position,
                'status' => $employee->status,
                'notes' => $employee->notes,
                'phone' => $employee->phone,
                'email' => $employee->email,
                'user' => $employee->user ? [
                    'id' => $employee->user->id,
                    'email' => $employee->user->email,
                    'role' => $employee->user->primaryRoleName(),
                ] : null,
            ];
        });

        return Inertia::render('AdminPage/Employees', [
            'employees' => $employees,
            'filters' => $filters,
            'next_employee_no' => $this->generateEmployeeNo(),
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.employees.create')) {
            abort(403);
        }

        $validated = $request->validate([
            'employee_no' => 'nullable|string|max:50|unique:employees,employee_no',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255|unique:employees,email',
            'status' => 'nullable|in:active,inactive,resigned,terminated',
            'hired_at' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $employeeNo = $validated['employee_no'] ?? null;
        if (!$employeeNo) {
            $employeeNo = $this->generateEmployeeNo();
        }

        $email = $validated['email'] ?? null;
        if (!$email) {
            $email = $this->makePlaceholderEmail($employeeNo);
        }

        Employee::create([
            'employee_no' => $employeeNo,
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'position' => $validated['position'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'email' => $email,
            'status' => $validated['status'] ?? 'active',
            'hired_at' => $validated['hired_at'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Employee created successfully.');
    }

    public function update(Request $request, Employee $employee)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.employees.update')) {
            abort(403);
        }

        $validated = $request->validate([
            'employee_no' => 'nullable|string|max:50|unique:employees,employee_no,' . $employee->id,
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255|unique:employees,email,' . $employee->id,
            'status' => 'nullable|in:active,inactive,resigned,terminated',
            'hired_at' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $employeeNo = $validated['employee_no'] ?? $employee->employee_no;
        if (!$employeeNo) {
            $employeeNo = $this->generateEmployeeNo();
        }

        $email = $validated['email'] ?? $employee->email;
        if (!$email) {
            $email = $this->makePlaceholderEmail($employeeNo);
        }

        $employee->update([
            'employee_no' => $employeeNo,
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'position' => $validated['position'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'email' => $email,
            'status' => $validated['status'] ?? $employee->status,
            'hired_at' => $validated['hired_at'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Employee updated successfully.');
    }

    public function linkUser(Request $request, Employee $employee)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.employees.update')) {
            abort(403);
        }

        $validated = $request->validate([
            'email' => 'required|email|max:255',
            'role' => 'required|in:cashier,inventory_manager,rider,accountant,admin',
        ]);

        $target = User::where('email', $validated['email'])->first();
        if (!$target) {
            return redirect()->back()->withErrors([
                'email' => 'No user found with that email. Create the user first.',
            ]);
        }

        if ($target->employee_id && $target->employee_id !== $employee->id) {
            return redirect()->back()->withErrors([
                'email' => 'This user is already linked to another employee.',
            ]);
        }

        $target->employee()->associate($employee);
        $target->save();

        if (Role::where('name', $validated['role'])->exists()) {
            $target->syncRoles([$validated['role']]);
        }

        return redirect()->back()->with('success', 'User linked successfully.');
    }

    public function unlinkUser(Request $request, Employee $employee)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.employees.update')) {
            abort(403);
        }

        $target = $employee->user;
        if ($target) {
            $target->employee_id = null;
            $target->save();
        }

        return redirect()->back()->with('success', 'User unlinked successfully.');
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

    private function makePlaceholderEmail(string $employeeNo): string
    {
        $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $employeeNo));
        $slug = trim($slug, '-');

        $candidate = "employee-{$slug}@example.invalid";
        $counter = 1;
        while (Employee::where('email', $candidate)->exists()) {
            $counter++;
            $candidate = "employee-{$slug}-{$counter}@example.invalid";
        }

        return $candidate;
    }
}
