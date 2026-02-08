<?php

namespace App\Http\Controllers\Accountant;

use App\Http\Controllers\Controller;
use App\Models\SupplierPurchaseCommitment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierPurchaseController extends Controller
{
    public function index(Request $request)
    {
        $status = in_array($request->input('status'), [SupplierPurchaseCommitment::STATUS_PENDING, SupplierPurchaseCommitment::STATUS_POSTED], true)
            ? $request->input('status')
            : 'pending';

        $commitments = SupplierPurchaseCommitment::with(['purchaseRequest.requestedBy', 'purchaseRequest.supplier'])
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->orderByDesc('created_at')
            ->get()
            ->map(function (SupplierPurchaseCommitment $commitment) {
                $request = $commitment->purchaseRequest;

                return [
                    'id' => $commitment->id,
                    'pr_number' => $request?->pr_number,
                    'status' => $commitment->status,
                    'amount_estimated' => $commitment->amount_estimated,
                    'amount_final' => $commitment->amount_final,
                    'supplier' => $request?->supplier?->only(['id', 'name']),
                    'requested_by' => $request?->requestedBy?->only(['id', 'name']),
                    'requested_at' => $request?->requested_at?->toDateTimeString(),
                    'created_at' => $commitment->created_at?->toDateTimeString(),
                    'posted_at' => $commitment->posted_at?->toDateTimeString(),
                    'notes' => $commitment->notes,
                ];
            });

        return Inertia::render('AccountantPage/SupplierPurchases', [
            'commitments' => $commitments,
            'status' => $status,
        ]);
    }

    public function export(Request $request)
    {
        $status = in_array($request->input('status'), [SupplierPurchaseCommitment::STATUS_PENDING, SupplierPurchaseCommitment::STATUS_POSTED], true)
            ? $request->input('status')
            : 'all';

        $rows = SupplierPurchaseCommitment::with(['purchaseRequest.requestedBy', 'purchaseRequest.supplier'])
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->orderBy('created_at')
            ->get();

        $filename = sprintf('supplier-purchases-%s-%s.csv', $status, now()->format('Ymd'));
        $callback = function () use ($rows) {
            $columns = ['PR Number', 'Status', 'Estimated Amount', 'Final Amount', 'Supplier', 'Requested By', 'Requested At', 'Posted At'];
            echo implode(',', $columns) . "\n";

            foreach ($rows as $row) {
                $request = $row->purchaseRequest;
                $data = [
                    $request?->pr_number,
                    $row->status,
                    number_format($row->amount_estimated ?? 0, 2),
                    number_format($row->amount_final ?? 0, 2),
                    $request?->supplier?->name,
                    $request?->requestedBy?->name,
                    $request?->requested_at?->toDateTimeString(),
                    $row->posted_at?->toDateTimeString(),
                ];
                echo implode(',', array_map(fn($value) => '"' . str_replace('"', '""', (string) ($value ?? '')) . '"', $data)) . "\n";
            }
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
