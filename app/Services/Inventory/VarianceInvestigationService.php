<?php

namespace App\Services\Inventory;

use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\StockMovement;
use App\Models\StockVarianceInvestigation;
use App\Models\VarianceInvestigationNote;
use App\Repositories\StockRepository;
use Carbon\Carbon;

class VarianceInvestigationService
{
    public function __construct(
        private StockRepository $stockRepository
    ) {}

    public function getInvestigationsForIndex(
        ?string $search,
        ?string $status,
        ?string $rootCause,
        ?string $direction,
        int $perPage
    )
    {
        $query = StockVarianceInvestigation::query()
            ->with([
                'productVariant.product',
                'location',
                'assignedTo',
                'investigatedBy',
                'approvedBy',
            ])
            ->orderBy('created_at', 'desc');

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($rootCause && $rootCause !== 'all') {
            $query->where('root_cause', $rootCause);
        }

        if ($direction && $direction !== 'all') {
            $query->where('variance_direction', $direction);
        }

        if ($search) {
            $query->whereHas('productVariant.product', function ($q) use ($search) {
                $q->where('sku', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%");
            })->orWhereHas('location', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $investigations = $query->paginate($perPage);

        return [
            'data' => $investigations->map(fn ($inv) => $this->transformInvestigation($inv)),
            'meta' => [
                'current_page' => $investigations->currentPage(),
                'last_page' => $investigations->lastPage(),
                'from' => $investigations->firstItem(),
                'to' => $investigations->lastItem(),
                'total' => $investigations->total(),
            ],
        ];
    }

    public function assignInvestigation(StockVarianceInvestigation $investigation, $userId, $user)
    {
        $assignedUser = \App\Models\User::findOrFail($userId);

        $investigation->update([
            'assigned_to_user_id' => $userId,
            'status' => StockVarianceInvestigation::STATUS_ASSIGNED,
        ]);

        // Notify the assigned investigator
        Notification::create([
            'user_id' => $userId,
            'type' => 'investigation_assigned',
            'title' => 'Variance Investigation Assigned',
            'message' => "You have been assigned to investigate variance of {$investigation->variance_qty} units for {$investigation->productVariant->product->sku}",
            'entity_type' => StockVarianceInvestigation::class,
            'entity_id' => $investigation->id,
            'data' => [
                'investigation_id' => $investigation->id,
                'variance_qty' => $investigation->variance_qty,
                'variance_direction' => $investigation->variance_direction,
            ],
            'channel' => 'in_app',
        ]);

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'investigation.assigned',
            'entity_type' => StockVarianceInvestigation::class,
            'entity_id' => $investigation->id,
            'message' => "Investigation assigned to {$assignedUser->name}",
            'after_json' => [
                'assigned_to_user_id' => $userId,
                'assigned_to_name' => $assignedUser->name,
            ],
        ]);
    }

    public function submitInvestigation(StockVarianceInvestigation $investigation, array $data, $user)
    {
        if (!$investigation->canBeInvestigated()) {
            throw new \Exception('Investigation cannot be updated in current status');
        }

        // Store investigation findings
        $investigation->update([
            'investigated_by_user_id' => $user->id,
            'root_cause' => $data['root_cause'],
            'action_taken' => $data['action_taken'],
            'investigation_notes' => $data['investigation_notes'],
            'status' => StockVarianceInvestigation::STATUS_ROOT_CAUSE_IDENTIFIED,
        ]);

        // Add investigation note
        VarianceInvestigationNote::create([
            'stock_variance_investigation_id' => $investigation->id,
            'note_text' => $data['investigation_notes'],
            'note_type' => VarianceInvestigationNote::TYPE_FINDING,
            'created_by_user_id' => $user->id,
        ]);

        // Notify appropriate approvers
        $this->notifyApprovers($investigation, $user);

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'investigation.submitted',
            'entity_type' => StockVarianceInvestigation::class,
            'entity_id' => $investigation->id,
            'message' => "Investigation submitted by {$user->name}. Root cause: {$data['root_cause']}, Action: {$data['action_taken']}",
            'after_json' => [
                'root_cause' => $data['root_cause'],
                'action_taken' => $data['action_taken'],
                'investigated_by' => $user->name,
            ],
        ]);
    }

    public function approveInvestigation(StockVarianceInvestigation $investigation, array $data, $user)
    {
        if (!$investigation->canBeApproved()) {
            throw new \Exception('Investigation cannot be approved in current status');
        }

        $investigation->update([
            'approved_by_user_id' => $user->id,
            'approved_at' => now(),
            'approval_notes' => $data['approval_notes'] ?? null,
            'adjustment_qty' => $data['adjustment_qty'] ?? null,
            'write_off_reason' => $data['write_off_reason'] ?? null,
            'cost_impact' => $data['cost_impact'] ?? null,
            'status' => StockVarianceInvestigation::STATUS_APPROVED,
        ]);

        // Add approval note
        VarianceInvestigationNote::create([
            'stock_variance_investigation_id' => $investigation->id,
            'note_text' => $data['approval_notes'] ?? 'Approved',
            'note_type' => VarianceInvestigationNote::TYPE_DECISION,
            'created_by_user_id' => $user->id,
        ]);

        // Execute the approved action
        $this->executeApprovedAction($investigation, $user);

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'investigation.approved',
            'entity_type' => StockVarianceInvestigation::class,
            'entity_id' => $investigation->id,
            'message' => "Investigation approved by {$user->name}",
            'after_json' => [
                'approved_by' => $user->name,
                'approval_notes' => $data['approval_notes'] ?? null,
                'adjustment_qty' => $data['adjustment_qty'] ?? null,
            ],
        ]);
    }

    public function rejectInvestigation(StockVarianceInvestigation $investigation, string $reason, $user)
    {
        if (!$investigation->canBeApproved()) {
            throw new \Exception('Investigation cannot be rejected in current status');
        }

        $investigation->update([
            'status' => StockVarianceInvestigation::STATUS_INVESTIGATING,
            'approval_notes' => "Rejected: {$reason}",
        ]);

        // Notify investigator to redo
        if ($investigation->investigated_by_user_id) {
            Notification::create([
                'user_id' => $investigation->investigated_by_user_id,
                'type' => 'investigation_rejected',
                'title' => 'Investigation Rejected',
                'message' => "Your investigation submission was rejected. Reason: {$reason}",
                'entity_type' => StockVarianceInvestigation::class,
                'entity_id' => $investigation->id,
                'channel' => 'in_app',
            ]);
        }

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'investigation.rejected',
            'entity_type' => StockVarianceInvestigation::class,
            'entity_id' => $investigation->id,
            'message' => "Investigation rejected by {$user->name}. Reason: {$reason}",
        ]);
    }

    public function addInvestigationNote(StockVarianceInvestigation $investigation, string $noteText, string $noteType, $user)
    {
        $note = VarianceInvestigationNote::create([
            'stock_variance_investigation_id' => $investigation->id,
            'note_text' => $noteText,
            'note_type' => $noteType,
            'created_by_user_id' => $user->id,
        ]);

        // Notify investigator if note is added to their investigation
        if ($investigation->assigned_to_user_id && $investigation->assigned_to_user_id !== $user->id) {
            Notification::create([
                'user_id' => $investigation->assigned_to_user_id,
                'type' => 'investigation_note_added',
                'title' => 'Note Added to Your Investigation',
                'message' => "{$user->name} added a note to the investigation you are working on",
                'entity_type' => StockVarianceInvestigation::class,
                'entity_id' => $investigation->id,
                'channel' => 'in_app',
            ]);
        }

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'investigation.note.added',
            'entity_type' => StockVarianceInvestigation::class,
            'entity_id' => $investigation->id,
            'message' => "Note added by {$user->name}",
        ]);

        return $note;
    }

    private function executeApprovedAction(StockVarianceInvestigation $investigation, $user)
    {
        $actionTaken = $investigation->action_taken;
        $balance = $investigation->location->balances()
            ->where('product_variant_id', $investigation->product_variant_id)
            ->first();

        if (!$balance) {
            return;
        }

        switch ($actionTaken) {
            case StockVarianceInvestigation::ACTION_ADJUST_DOWN:
            case StockVarianceInvestigation::ACTION_WRITE_OFF:
                // Adjust inventory down (record the loss)
                $adjustmentQty = $investigation->adjustment_qty ?? abs($investigation->variance_qty);
                
                $this->stockRepository->updateInventoryBalance($balance, [
                    'qty_filled' => max(0, $balance->qty_filled - $adjustmentQty),
                ]);

                // Create stock movement for the adjustment
                $this->stockRepository->createStockMovement([
                    'location_id' => $balance->location_id,
                    'product_variant_id' => $balance->product_variant_id,
                    'movement_type' => StockMovement::TYPE_ADJUSTMENT,
                    'qty' => -$adjustmentQty,
                    'reference_type' => StockVarianceInvestigation::class,
                    'reference_id' => $investigation->id,
                    'performed_by_user_id' => $user->id,
                    'moved_at' => Carbon::now(),
                    'notes' => "Variance write-off: {$investigation->root_cause}. Approval notes: {$investigation->approval_notes}",
                ]);

                $investigation->update(['status' => StockVarianceInvestigation::STATUS_RESOLVED]);
                break;

            case StockVarianceInvestigation::ACTION_ADJUST_UP:
                // Adjust inventory up (recount error correction)
                $adjustmentQty = $investigation->adjustment_qty ?? abs($investigation->variance_qty);
                
                $this->stockRepository->updateInventoryBalance($balance, [
                    'qty_filled' => $balance->qty_filled + $adjustmentQty,
                ]);

                // Create stock movement
                $this->stockRepository->createStockMovement([
                    'location_id' => $balance->location_id,
                    'product_variant_id' => $balance->product_variant_id,
                    'movement_type' => StockMovement::TYPE_ADJUSTMENT,
                    'qty' => $adjustmentQty,
                    'reference_type' => StockVarianceInvestigation::class,
                    'reference_id' => $investigation->id,
                    'performed_by_user_id' => $user->id,
                    'moved_at' => Carbon::now(),
                    'notes' => "Recount discrepancy correction: {$investigation->root_cause}",
                ]);

                $investigation->update(['status' => StockVarianceInvestigation::STATUS_RESOLVED]);
                break;

            case StockVarianceInvestigation::ACTION_SUBMIT_CLAIM:
            case StockVarianceInvestigation::ACTION_DISCIPLINARY:
            case StockVarianceInvestigation::ACTION_INVESTIGATION_ONLY:
                // These don't automatically adjust inventory
                $investigation->update(['status' => StockVarianceInvestigation::STATUS_CLOSED]);
                break;
        }

        $investigation->update(['resolution_date' => now()]);
    }

    private function notifyApprovers(StockVarianceInvestigation $investigation, $user)
    {
        $approvingRoles = ['admin', 'finance_manager', 'operations_manager'];
        
        $approvers = \App\Models\User::whereHas('roles', function ($query) use ($approvingRoles) {
            $query->whereIn('name', $approvingRoles);
        })->get();

        foreach ($approvers as $approver) {
            Notification::create([
                'user_id' => $approver->id,
                'type' => 'investigation_pending_approval',
                'title' => 'Variance Investigation Pending Approval',
                'message' => "Investigation for variance of {$investigation->variance_qty} units requires your approval. Root cause identified: {$investigation->root_cause}",
                'entity_type' => StockVarianceInvestigation::class,
                'entity_id' => $investigation->id,
                'data' => [
                    'root_cause' => $investigation->root_cause,
                    'variance_qty' => $investigation->variance_qty,
                ],
                'channel' => 'in_app',
            ]);
        }

        $investigation->update(['status' => StockVarianceInvestigation::STATUS_PENDING_APPROVAL]);
    }

    private function transformInvestigation(StockVarianceInvestigation $investigation)
    {
        return [
            'id' => $investigation->id,
            'stock_count_id' => $investigation->stock_count_id,
            'product_sku' => $investigation->productVariant->product->sku,
            'product_name' => $investigation->productVariant->product->name,
            'location_name' => $investigation->location->name,
            'variance_qty' => $investigation->variance_qty,
            'variance_direction' => $investigation->variance_direction,
            'system_qty' => $investigation->system_qty,
            'counted_qty' => $investigation->counted_qty,
            'status' => $investigation->status,
            'status_label' => StockVarianceInvestigation::getStatusOptions()[$investigation->status] ?? $investigation->status,
            'root_cause' => $investigation->root_cause,
            'root_cause_label' => $investigation->root_cause ? (StockVarianceInvestigation::getRootCauseOptions()[$investigation->root_cause] ?? $investigation->root_cause) : null,
            'action_taken' => $investigation->action_taken,
            'action_label' => $investigation->action_taken ? (StockVarianceInvestigation::getActionOptions()[$investigation->action_taken] ?? $investigation->action_taken) : null,
            'assigned_to' => $investigation->assignedTo?->name,
            'investigated_by' => $investigation->investigatedBy?->name,
            'approved_by' => $investigation->approvedBy?->name,
            'approved_at' => $investigation->approved_at?->format('Y-m-d H:i:s'),
            'cost_impact' => $investigation->cost_impact,
            'created_at' => $investigation->created_at->format('Y-m-d H:i:s'),
            'notes_count' => $investigation->notes()->count(),
        ];
    }
}
