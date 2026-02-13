<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\AuditLogService;
use App\Services\SaleService;
use App\Services\Inventory\StockService;
use App\Models\Purchase;
use App\Models\RestockRequest;
use App\Models\Remittance;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AuditLogController extends Controller
{
    protected AuditLogService $svc;
    protected SaleService $saleService;
    protected StockService $stockService;

    public function __construct(AuditLogService $svc, SaleService $saleService, StockService $stockService)
    {
        $this->svc = $svc;
        $this->saleService = $saleService;
        $this->stockService = $stockService;
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

        $filters = $request->only(['q', 'event', 'entity_type', 'per', 'page', 'sector', 'from', 'to']);
        $sector = strtolower($filters['sector'] ?? 'all');
        $role = strtolower((string) ($user->primaryRoleName() ?? ''));
        $allowedSectors = $this->allowedSectorsForRole($role);
        $defaultSector = $this->defaultSectorForRole($role);
        if (!in_array($sector, $allowedSectors, true)) {
            $sector = $defaultSector;
            $filters['sector'] = $sector;
        }
        $audits = $this->svc->getAuditLogsForPage($filters);
        $per = (int) ($filters['per'] ?? 10);
        $page = (int) ($filters['page'] ?? 1);
        $q = $filters['q'] ?? null;
        $from = $filters['from'] ?? null;
        $to = $filters['to'] ?? null;

        $sales = null;
        $movements = null;
        $finance = null;

        if ($sector === 'sales') {
            $sales = $this->saleService->getSalesForPage([
                'q' => $q,
                'per' => $per,
                'page' => $page,
                'status' => $request->input('status', 'all'),
                'from' => $from,
                'to' => $to,
            ]);
        }

        if ($sector === 'inventory') {
            $movements = $this->stockService->getStockMovementsForIndex(
                $q,
                $request->input('type'),
                $request->input('direction') ?? $request->input('dir'),
                $per,
                $from,
                $to
            );
        }

        if ($sector === 'finance') {
            $finance = $this->buildFinanceLogs($q, $per, $page, $from, $to);
        }

        return Inertia::render('AdminPage/AuditLogs', [
            'audits' => $audits,
            'filters' => $filters,
            'sales' => $sales,
            'movements' => $movements,
            'finance' => $finance,
        ]);
    }

    private function buildFinanceLogs(?string $q, int $per, int $page, ?string $from, ?string $to): array
    {
        $queryText = $q ? trim((string) $q) : '';
        $fromDate = $from ? Carbon::parse($from)->startOfDay() : null;
        $toDate = $to ? Carbon::parse($to)->endOfDay() : null;

        $payableQuery = null;
        if (Schema::hasTable('payable_ledgers')) {
            $payableQuery = DB::table('payable_ledgers as pl')
                ->join('supplier_payables as sp', 'sp.id', '=', 'pl.supplier_payable_id')
                ->leftJoin('suppliers as s', 's.id', '=', 'sp.supplier_id')
                ->leftJoin('users as u', 'u.id', '=', 'pl.created_by_user_id')
                ->leftJoin('purchases as p', function ($join) {
                    $join->on('sp.source_id', '=', 'p.id')
                        ->where('sp.source_type', '=', Purchase::class);
                })
                ->leftJoin('restock_requests as rr', function ($join) {
                    $join->on('sp.source_id', '=', 'rr.id')
                        ->where('sp.source_type', '=', RestockRequest::class);
                })
                ->where('pl.entry_type', 'payment_recorded')
                ->select([
                    DB::raw("'supplier_payment' as kind"),
                    'pl.id as id',
                    'pl.created_at as created_at',
                    'pl.amount as amount',
                    'pl.reference as reference',
                    'pl.entry_type as event',
                    'pl.note as message',
                    'pl.meta as meta_json',
                    'u.name as actor_name',
                    's.name as supplier_name',
                    'sp.source_type as source_type',
                    'sp.id as source_id',
                    DB::raw('COALESCE(p.purchase_number, rr.request_number, sp.source_id) as source_ref'),
                ]);

            if ($queryText !== '') {
                $payableQuery->where(function ($builder) use ($queryText) {
                    $builder->where('s.name', 'like', "%{$queryText}%")
                        ->orWhere('pl.reference', 'like', "%{$queryText}%")
                        ->orWhere('pl.note', 'like', "%{$queryText}%")
                        ->orWhere('sp.source_id', 'like', "%{$queryText}%")
                        ->orWhere('p.purchase_number', 'like', "%{$queryText}%")
                        ->orWhere('rr.request_number', 'like', "%{$queryText}%");
                });
            }

            if ($fromDate && $toDate) {
                $payableQuery->whereBetween('pl.created_at', [$fromDate, $toDate]);
            } elseif ($fromDate) {
                $payableQuery->where('pl.created_at', '>=', $fromDate);
            } elseif ($toDate) {
                $payableQuery->where('pl.created_at', '<=', $toDate);
            }
        }

        $remittanceQuery = DB::table('audit_logs as al')
            ->leftJoin('users as u', 'u.id', '=', 'al.actor_user_id')
            ->where('al.action', 'like', 'remittance.%')
            ->select([
                DB::raw("'remittance' as kind"),
                'al.id as id',
                'al.created_at as created_at',
                DB::raw('NULL as amount'),
                DB::raw('NULL as reference'),
                'al.action as event',
                'al.message as message',
                'al.after_json as meta_json',
                'u.name as actor_name',
                DB::raw('NULL as supplier_name'),
                'al.entity_type as source_type',
                'al.entity_id as source_id',
                DB::raw('NULL as source_ref'),
            ]);

        if ($queryText !== '') {
            $remittanceQuery->where(function ($builder) use ($queryText) {
                $builder->where('al.action', 'like', "%{$queryText}%")
                    ->orWhere('al.message', 'like', "%{$queryText}%")
                    ->orWhere('al.entity_id', 'like', "%{$queryText}%")
                    ->orWhere('u.name', 'like', "%{$queryText}%");
            });
        }

        if ($fromDate && $toDate) {
            $remittanceQuery->whereBetween('al.created_at', [$fromDate, $toDate]);
        } elseif ($fromDate) {
            $remittanceQuery->where('al.created_at', '>=', $fromDate);
        } elseif ($toDate) {
            $remittanceQuery->where('al.created_at', '<=', $toDate);
        }

        $combined = $payableQuery ? $payableQuery->unionAll($remittanceQuery) : $remittanceQuery;

        $financeQuery = DB::query()
            ->fromSub($combined, 'finance_logs')
            ->orderByDesc('created_at');

        $paginator = $financeQuery
            ->paginate($per, ['*'], 'page', $page)
            ->withQueryString();

        $rows = collect($paginator->items());
        $remittanceIds = $rows
            ->filter(fn ($row) => $row->kind === 'remittance' && !empty($row->source_id))
            ->pluck('source_id')
            ->unique()
            ->values();
        $remittances = $remittanceIds->isEmpty()
            ? collect()
            : Remittance::whereIn('id', $remittanceIds)->get()->keyBy('id');

        $items = $rows->map(function ($row) use ($remittances) {
            $meta = [];
            if (!empty($row->meta_json)) {
                if (is_array($row->meta_json)) {
                    $meta = $row->meta_json;
                } else {
                    $decoded = json_decode($row->meta_json, true);
                    $meta = is_array($decoded) ? $decoded : [];
                }
            }

            $method = null;
            $amount = null;
            if ($row->kind === 'supplier_payment') {
                $method = $meta['payment_method'] ?? $row->reference ?? null;
                $amount = $row->amount !== null ? (float) $row->amount : ($meta['paid_amount'] ?? null);
            }

            if ($row->kind === 'remittance') {
                $amount = $meta['total_amount']
                    ?? $meta['cash_counted']
                    ?? $meta['verified_amount']
                    ?? $meta['cashless_verified_amount']
                    ?? null;

                if ($amount === null && !empty($row->source_id)) {
                    $remittance = $remittances->get($row->source_id);
                    if ($remittance) {
                        $cashAmount = (float) ($remittance->remitted_cash_amount ?? 0);
                        $cashlessAmount = (float) ($remittance->noncash_verification['amount'] ?? 0);
                        if (str_contains((string) $row->event, 'cash.recorded')) {
                            $amount = $cashAmount;
                        } elseif (str_contains((string) $row->event, 'noncash_transactions.verified')) {
                            $amount = $cashlessAmount;
                        } else {
                            $amount = $cashAmount + $cashlessAmount;
                        }
                    }
                }
            }

            $businessDate = $meta['business_date'] ?? null;
            if (!$businessDate && $row->kind === 'remittance' && !empty($row->source_id)) {
                $remittance = $remittances->get($row->source_id);
                if ($remittance && $remittance->business_date) {
                    $businessDate = $remittance->business_date->toDateString();
                }
            }
            $status = $row->kind === 'remittance' ? ($meta['status'] ?? null) : null;

            return [
                'id' => "{$row->kind}_{$row->id}",
                'kind' => $row->kind,
                'event' => $row->event,
                'supplier_name' => $row->supplier_name,
                'source_type' => $row->source_type,
                'source_ref' => $row->source_ref,
                'amount' => $amount !== null ? (float) $amount : null,
                'reference' => $row->reference,
                'method' => $method,
                'status' => $status,
                'business_date' => $businessDate,
                'message' => $row->message,
                'actor_name' => $row->actor_name,
                'created_at' => $row->created_at
                    ? Carbon::parse($row->created_at)->format('Y-m-d H:i')
                    : '',
            ];
        });

        return [
            'data' => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
            ],
        ];
    }

    private function allowedSectorsForRole(?string $role): array
    {
        $r = strtolower(str_replace(' ', '_', (string) $role));

        return match ($r) {
            'admin' => ['all', 'access', 'people', 'sales', 'inventory', 'finance'],
            'accountant' => ['finance', 'sales'],
            'cashier' => ['sales'],
            'inventory_manager' => ['inventory'],
            'rider' => ['sales'],
            default => ['all'],
        };
    }

    private function defaultSectorForRole(?string $role): string
    {
        $r = strtolower(str_replace(' ', '_', (string) $role));

        return match ($r) {
            'accountant' => 'finance',
            'cashier' => 'sales',
            'inventory_manager' => 'inventory',
            'rider' => 'sales',
            default => 'all',
        };
    }
}
