<?php

namespace App\Policies;

use App\Models\StockVarianceInvestigation;
use App\Models\User;

class StockVarianceInvestigationPolicy
{
    /**
     * Determine whether the user can view any investigations.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            'admin',
            'accountant',
            'warehouse_manager',
            'operations_manager',
            'inventory_manager',
            'finance_manager',
        ]);
    }

    /**
     * Determine whether the user can view the investigation.
     */
    public function view(User $user, StockVarianceInvestigation $investigation): bool
    {
        return $user->hasAnyRole([
            'admin',
            'accountant',
            'warehouse_manager',
            'operations_manager',
            'inventory_manager',
            'finance_manager',
        ]);
    }

    /**
     * Determine whether the user can update the investigation.
     * Warehouse/Inventory managers can investigate, Admins can update anytime
     */
    public function update(User $user, StockVarianceInvestigation $investigation): bool
    {
        // Assigned investigator can update their investigation
        if ($investigation->assigned_to_user_id === $user->id && $investigation->canBeInvestigated()) {
            return true;
        }

        // Admin can update anytime
        if ($user->hasRole('admin')) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can approve the investigation.
     * Only admin, finance manager, or operations manager can approve
     */
    public function approve(User $user, StockVarianceInvestigation $investigation): bool
    {
        return $user->hasAnyRole([
            'admin',
            'finance_manager',
            'operations_manager',
        ]);
    }
}
