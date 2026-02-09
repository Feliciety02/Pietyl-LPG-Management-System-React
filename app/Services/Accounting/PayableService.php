<?php

namespace App\Services\Accounting;

use App\Models\PayableLedger;
use App\Models\Purchase;
use App\Models\SupplierPayable;
use Illuminate\Contracts\Auth\Authenticatable;

class PayableService
{

    public function syncPurchasePayable(Purchase $purchase, ?Authenticatable $actor = null): SupplierPayable
    {
        $actorId = $actor?->id;
        $gross = $purchase->getSubtotalAmount();
        $deductions = $purchase->getDamageDeductionAmount();
        $net = max(0, $purchase->getNetPayableAmount());

        $payable = SupplierPayable::firstWhere('purchase_id', $purchase->id);

        if (!$payable) {
            $payable = SupplierPayable::create([
                'supplier_id' => $purchase->supplier_id,
                'source_type' => Purchase::class,
                'source_id' => $purchase->id,
                'purchase_id' => $purchase->id,
                'amount' => $net,
                'gross_amount' => $gross,
                'deductions_total' => $deductions,
                'net_amount' => $net,
                'status' => SupplierPayable::STATUS_UNPAID,
                'created_by_user_id' => $actorId,
            ]);

            $this->logLedger(
                $payable,
                'created',
                [
                    'gross_amount' => $gross,
                    'deductions_total' => $deductions,
                    'net_amount' => $net,
                    'damage_category' => $purchase->damage_category,
                    'damage_reason' => $purchase->damage_reason,
                ],
                $actorId,
                $net,
                $purchase->supplier_reference_no ?? $purchase->purchase_number
            );

            $purchase->update(['supplier_payable_id' => $payable->id]);
            return $payable;
        }

        $changes = [];

        if (round($payable->gross_amount, 2) !== round($gross, 2)) {
            $changes['gross_amount'] = $gross;
        }
        if (round($payable->deductions_total, 2) !== round($deductions, 2)) {
            $changes['deductions_total'] = $deductions;
        }
        if (round($payable->net_amount, 2) !== round($net, 2)) {
            $changes['net_amount'] = $net;
            $changes['amount'] = $net;
        }

        if ($changes) {
            $payable->update($changes);
            $this->logLedger(
                $payable,
                'deduction_applied',
                [
                    'gross_amount' => $gross,
                    'deductions_total' => $deductions,
                    'net_amount' => $net,
                    'damage_category' => $purchase->damage_category,
                    'damage_reason' => $purchase->damage_reason,
                ],
                $actorId,
                $net,
                $purchase->supplier_reference_no ?? $purchase->purchase_number
            );
        }

        return $payable->refresh();
    }

    public function logLedger(
        SupplierPayable $payable,
        string $entryType,
        ?array $payload = null,
        ?int $actorId = null,
        ?float $amount = null,
        ?string $reference = null,
        ?string $note = null
    ): PayableLedger
    {
        $meta = $payload ?? [];
        $payloadNote = $meta['note'] ?? null;

        return PayableLedger::create([
            'supplier_payable_id' => $payable->id,
            'entry_type' => $entryType,
            'amount' => $amount ?? ($meta['net_amount'] ?? $meta['paid_amount'] ?? null),
            'reference' => $reference ?? $meta['reference'] ?? $meta['payment_method'] ?? null,
            'meta' => $meta,
            'note' => $note ?? $payloadNote,
            'created_by_user_id' => $actorId,
        ]);
    }

    public function recordNote(SupplierPayable $payable, string $note, ?Authenticatable $actor = null): PayableLedger
    {
        return $this->logLedger($payable, 'note_added', ['note' => $note], $actor?->id, null, null, $note);
    }
}
