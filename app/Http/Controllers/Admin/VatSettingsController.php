<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\CompanySetting;
use App\Services\SettingsService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class VatSettingsController extends Controller
{
    public function index(Request $request, SettingsService $settings): \Inertia\Response
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.settings.manage')) {
            abort(403);
        }

        return Inertia::render('AdminPage/VATSettings', [
            'vat_settings' => $settings->getVatSnapshot(),
        ]);
    }

    public function update(Request $request, SettingsService $settings)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.settings.manage')) {
            abort(403);
        }

        $validated = $request->validate([
            'vat_registered' => ['required', 'boolean'],
            'vat_rate' => ['required_if:vat_registered,1', 'numeric', 'gt:0'],
            'vat_effective_date' => ['required_if:vat_registered,1', 'nullable', 'date'],
            'vat_mode' => ['required', Rule::in(['inclusive'])],
        ]);

        $before = $settings->getSettings()->toArray();

        $current = $settings->getSettings();
        $payload = [
            'vat_registered' => (bool) $validated['vat_registered'],
            'vat_rate' => (float) ($validated['vat_registered'] ? $validated['vat_rate'] : $current->vat_rate),
            'vat_effective_date' => $validated['vat_registered'] ? $validated['vat_effective_date'] : null,
            'vat_mode' => $validated['vat_mode'],
        ];

        $updated = $settings->updateSettings($payload);

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'update_vat_settings',
            'entity_type' => CompanySetting::class,
            'entity_id' => $updated->id,
            'message' => 'VAT settings updated',
            'before_json' => $before,
            'after_json' => $updated->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit($request->userAgent() ?? '', 255),
        ]);

        return redirect()->back()->with('success', 'VAT settings saved.');
    }
}
