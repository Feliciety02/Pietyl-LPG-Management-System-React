<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\AuditLogService;

class AuditLogController extends Controller
{
    protected AuditLogService $svc;

    public function __construct(AuditLogService $svc)
    {
        $this->svc = $svc;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->canAny([
            'admin.audit.view',
            'cashier.audit.view',
            'accountant.audit.view',
            'rider.audit.view',
            'inventory.audit.view',
        ])) {
            abort(403);
        }

        $filters = $request->only(['q', 'event', 'entity_type', 'per', 'page', 'sector']);
        $audits = $this->svc->getAuditLogsForPage($filters);

        return Inertia::render('AdminPage/AuditLogs', [
            'audits' => $audits,
            'filters' => $filters,
        ]);
    }
}
