<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\StockVarianceInvestigation;
use App\Services\Inventory\VarianceInvestigationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VarianceInvestigationController extends Controller
{
    public function __construct(
        private VarianceInvestigationService $investigationService
    ) {
        // Middleware will be applied in routes
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', StockVarianceInvestigation::class);

        $search = $request->input('q');
        $status = $request->input('status', 'all');
        $rootCause = $request->input('root_cause', 'all');
        $direction = $request->input('direction', 'all');
        $perPage = (int) $request->input('per', 15);

        $investigations = $this->investigationService->getInvestigationsForIndex(
            $search,
            $status,
            $rootCause,
            $direction,
            $perPage
        );

        return Inertia::render('InventoryPage/VarianceInvestigations', [
            'investigations' => $investigations,
            'filters' => [
                'q' => $search,
                'status' => $status,
                'root_cause' => $rootCause,
                'direction' => $direction,
                'per' => $perPage,
            ],
            'options' => [
                'statuses' => StockVarianceInvestigation::getStatusOptions(),
                'root_causes' => StockVarianceInvestigation::getRootCauseOptions(),
                'actions' => StockVarianceInvestigation::getActionOptions(),
                'directions' => [
                    'all' => 'All Directions',
                    'excess' => 'Excess',
                    'shortage' => 'Shortage',
                ],
            ],
        ]);
    }

    public function show(StockVarianceInvestigation $investigation)
    {
        $this->authorize('view', $investigation);

        return Inertia::render('InventoryPage/VarianceInvestigationDetail', [
            'investigation' => [
                'id' => $investigation->id,
                'stock_count_id' => $investigation->stock_count_id,
                'product_variant_id' => $investigation->product_variant_id,
                'location_id' => $investigation->location_id,
                'product_sku' => $investigation->productVariant->product->sku,
                'product_name' => $investigation->productVariant->product->name,
                'location_name' => $investigation->location->name,
                'variance_qty' => $investigation->variance_qty,
                'variance_direction' => $investigation->variance_direction,
                'system_qty' => $investigation->system_qty,
                'counted_qty' => $investigation->counted_qty,
                'status' => $investigation->status,
                'investigation_notes' => $investigation->investigation_notes,
                'root_cause' => $investigation->root_cause,
                'action_taken' => $investigation->action_taken,
                'approved_by' => $investigation->approvedBy?->name,
                'approved_at' => $investigation->approved_at?->format('Y-m-d H:i:s'),
                'approval_notes' => $investigation->approval_notes,
                'adjustment_qty' => $investigation->adjustment_qty,
                'write_off_reason' => $investigation->write_off_reason,
                'cost_impact' => $investigation->cost_impact,
                'resolution_date' => $investigation->resolution_date?->format('Y-m-d H:i:s'),
                'created_at' => $investigation->created_at->format('Y-m-d H:i:s'),
                'notes' => $investigation->notes()->orderBy('created_at', 'desc')->get()->map(fn ($note) => [
                    'id' => $note->id,
                    'text' => $note->note_text,
                    'type' => $note->note_type,
                    'created_by' => $note->createdBy->name,
                    'created_at' => $note->created_at->format('Y-m-d H:i:s'),
                ]),
            ],
            'options' => [
                'statuses' => StockVarianceInvestigation::getStatusOptions(),
                'root_causes' => StockVarianceInvestigation::getRootCauseOptions(),
                'actions' => StockVarianceInvestigation::getActionOptions(),
            ],
        ]);
    }

    public function assign(Request $request, StockVarianceInvestigation $investigation)
    {
        $this->authorize('update', $investigation);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $this->investigationService->assignInvestigation(
            $investigation,
            $validated['user_id'],
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Investigation assigned successfully',
        ]);
    }

    public function submitInvestigation(Request $request, StockVarianceInvestigation $investigation)
    {
        $this->authorize('update', $investigation);

        if (!$investigation->canBeInvestigated()) {
            return response()->json([
                'success' => false,
                'message' => 'Investigation cannot be updated in current status',
            ], 422);
        }

        $validated = $request->validate([
            'root_cause' => 'required|in:' . implode(',', array_keys(StockVarianceInvestigation::getRootCauseOptions())),
            'action_taken' => 'required|in:' . implode(',', array_keys(StockVarianceInvestigation::getActionOptions())),
            'investigation_notes' => 'required|string|min:10',
        ]);

        $this->investigationService->submitInvestigation(
            $investigation,
            $validated,
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Investigation submitted for approval',
            'investigation' => $investigation->fresh(),
        ]);
    }

    public function approve(Request $request, StockVarianceInvestigation $investigation)
    {
        $this->authorize('approve', $investigation);

        if (!$investigation->canBeApproved()) {
            return response()->json([
                'success' => false,
                'message' => 'Investigation cannot be approved in current status',
            ], 422);
        }

        $validated = $request->validate([
            'approval_notes' => 'nullable|string|max:1000',
            'adjustment_qty' => 'nullable|integer',
            'write_off_reason' => 'nullable|string|max:500',
            'cost_impact' => 'nullable|numeric',
        ]);

        $this->investigationService->approveInvestigation(
            $investigation,
            $validated,
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Investigation approved and action executed',
            'investigation' => $investigation->fresh(),
        ]);
    }

    public function reject(Request $request, StockVarianceInvestigation $investigation)
    {
        $this->authorize('approve', $investigation);

        if (!$investigation->canBeApproved()) {
            return response()->json([
                'success' => false,
                'message' => 'Investigation cannot be rejected in current status',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => 'required|string|min:10|max:500',
        ]);

        $this->investigationService->rejectInvestigation(
            $investigation,
            $validated['reason'],
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Investigation rejected and returned for further investigation',
        ]);
    }

    public function addNote(Request $request, StockVarianceInvestigation $investigation)
    {
        $this->authorize('update', $investigation);

        $validated = $request->validate([
            'note_text' => 'required|string|min:5|max:2000',
            'note_type' => 'required|in:investigation,finding,decision,resolution',
        ]);

        $note = $this->investigationService->addInvestigationNote(
            $investigation,
            $validated['note_text'],
            $validated['note_type'],
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Note added successfully',
            'note' => [
                'id' => $note->id,
                'text' => $note->note_text,
                'type' => $note->note_type,
                'created_by' => $note->createdBy->name,
                'created_at' => $note->created_at->format('Y-m-d H:i:s'),
            ],
        ]);
    }
}
