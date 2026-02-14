<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PromoVoucher;
use App\Services\SettingsService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PromoVoucherController extends Controller
{
    public function __construct(
        private SettingsService $settingsService
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.promos.view')) {
            abort(403);
        }

        $filters = [
            'q' => $request->input('q'),
            'status' => $request->input('status', 'active'),
            'kind' => $request->input('kind', 'all'),
            'per' => (int) $request->input('per', 10),
            'page' => (int) $request->input('page', 1),
        ];

        $query = PromoVoucher::query();

        if (!empty($filters['q'])) {
            $q = $filters['q'];
            $query->where(function ($sub) use ($q) {
                $sub->where('code', 'like', "%{$q}%")
                    ->orWhere('name', 'like', "%{$q}%");
            });
        }

        if (!empty($filters['kind']) && $filters['kind'] !== 'all') {
            $query->where('kind', $filters['kind']);
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('is_active', $filters['status'] === 'active');
        }

        $promos = $query->latest('created_at')
            ->paginate($filters['per'] ?: 10)
            ->withQueryString()
            ->through(function (PromoVoucher $promo) {
                return [
                    'id' => $promo->id,
                    'code' => $promo->code,
                    'name' => $promo->name,
                    'kind' => $promo->kind,
                    'discount_type' => $promo->discount_type,
                    'value' => (float) $promo->value,
                    'usage_limit' => $promo->usage_limit,
                    'times_redeemed' => $promo->times_redeemed,
                    'starts_at' => $promo->starts_at?->toDateString(),
                    'expires_at' => $promo->expires_at?->toDateString(),
                    'is_active' => $promo->is_active,
                    'discontinued_at' => $promo->discontinued_at?->toDateString(),
                ];
            });

        return Inertia::render('AdminPage/Promos', [
            'promos' => $promos,
            'filters' => $filters,
            'discount_settings' => $this->settingsService->getDiscountSnapshot(),
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.promos.create')) {
            abort(403);
        }

        $validated = $this->validatePayload($request);

        PromoVoucher::create($validated);

        return redirect()->back()->with('success', 'Promo created.');
    }

    public function update(Request $request, PromoVoucher $promo)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.promos.update')) {
            abort(403);
        }

        $validated = $this->validatePayload($request, $promo);
        $promo->update($validated);

        return redirect()->back()->with('success', 'Promo updated.');
    }

    public function discontinue(Request $request, PromoVoucher $promo)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.promos.archive')) {
            abort(403);
        }

        $promo->update([
            'is_active' => false,
            'discontinued_at' => Carbon::now(),
            'discontinued_by_user_id' => $user->id,
        ]);

        return redirect()->back()->with('success', 'Promo discontinued.');
    }

    public function restore(Request $request, PromoVoucher $promo)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.promos.archive')) {
            abort(403);
        }

        $promo->update([
            'is_active' => true,
            'discontinued_at' => null,
            'discontinued_by_user_id' => null,
        ]);

        return redirect()->back()->with('success', 'Promo restored.');
    }

    public function updateManagerPin(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.promos.update')) {
            abort(403);
        }

        $validated = $request->validate([
            'manager_pin' => ['required', 'string', 'regex:/^\d{4,8}$/', 'confirmed'],
        ]);

        $this->settingsService->updateSettings([
            'manager_pin' => $validated['manager_pin'],
        ]);

        return redirect()->back()->with('success', 'Manager PIN updated.');
    }

    private function validatePayload(Request $request, ?PromoVoucher $promo = null): array
    {
        $rawCode = strtoupper(trim((string) $request->input('code')));
        $sanitized = preg_replace('/[^A-Z0-9-]/', '', $rawCode) ?? '';
        $request->merge(['code' => $sanitized]);

        $codeRule = Rule::unique('promo_vouchers', 'code');
        if ($promo) {
            $codeRule = $codeRule->ignore($promo->id);
        }

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', $codeRule],
            'name' => ['nullable', 'string', 'max:120'],
            'kind' => ['required', 'in:promo,voucher'],
            'discount_type' => ['required', 'in:percent,amount'],
            'value' => ['required', 'numeric', 'min:0.01'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if ($validated['discount_type'] === 'percent' && $validated['value'] > 100) {
            $validated['value'] = 100;
        }

        return $validated;
    }
}
