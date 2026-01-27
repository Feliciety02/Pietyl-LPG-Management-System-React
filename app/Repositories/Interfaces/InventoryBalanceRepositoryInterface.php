<?php

namespace App\Repositories\Interfaces;

interface InventoryBalanceRepositoryInterface
{
    /**
     * Get all inventory balances with related product variant and location.
     *
     * @return \Illuminate\Support\Collection
     */
    public function allWithRelations();

    /**
     * Find an inventory balance by its ID.
     *
     * @param int $id
     * @return \App\Models\InventoryBalance|null
     */
    public function find(int $id);

    /**
     * Get all low stock inventory balances.
     *
     * @return \Illuminate\Support\Collection
     */
    public function lowStock();

    /**
     * Get all product variants with their suppliers.
     *
     * @return \Illuminate\Support\Collection
     */
    public function allProductVariantsWithSuppliers();
}
