<?php

namespace App\Policies;

use App\Models\PurchaseRequest;
use App\Models\User;

class PurchaseRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('inventory.purchase_requests.view')
            || $user->can('admin.purchase_requests.view')
            || $user->can('accountant.purchase_requests.view');
    }

    public function view(User $user, PurchaseRequest $purchaseRequest): bool
    {
        if ($user->can('admin.purchase_requests.view')) {
            return true;
        }

        if ($user->can('accountant.purchase_requests.view')) {
            return true;
        }

        if ($user->can('inventory.purchase_requests.view') && $purchaseRequest->requested_by_user_id === $user->id) {
            return true;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->can('inventory.purchase_requests.create');
    }

    public function update(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $user->can('inventory.purchase_requests.create')
            && $purchaseRequest->status === PurchaseRequest::STATUS_DRAFT
            && $purchaseRequest->requested_by_user_id === $user->id;
    }

    public function submit(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $user->can('inventory.purchase_requests.submit')
            && $purchaseRequest->status === PurchaseRequest::STATUS_DRAFT
            && $purchaseRequest->requested_by_user_id === $user->id;
    }

    public function receive(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $user->can('inventory.purchase_requests.receive')
            && in_array($purchaseRequest->status, [
                PurchaseRequest::STATUS_SUPPLIER_CONTACTED_WAITING_DELIVERY,
                PurchaseRequest::STATUS_PARTIALLY_RECEIVED,
            ], true);
    }

    public function approve(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $user->can('admin.purchase_requests.approve')
            && $purchaseRequest->status === PurchaseRequest::STATUS_SUBMITTED;
    }

    public function reject(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $user->can('admin.purchase_requests.reject')
            && $purchaseRequest->status === PurchaseRequest::STATUS_SUBMITTED;
    }

    public function markSupplierContacted(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $user->can('admin.purchase_requests.contact_supplier')
            && $purchaseRequest->status === PurchaseRequest::STATUS_APPROVED_PENDING_SUPPLIER;
    }

    public function cancel(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $user->can('admin.purchase_requests.cancel')
            && in_array($purchaseRequest->status, [
                PurchaseRequest::STATUS_DRAFT,
                PurchaseRequest::STATUS_SUBMITTED,
                PurchaseRequest::STATUS_APPROVED_PENDING_SUPPLIER,
            ], true);
    }
}
