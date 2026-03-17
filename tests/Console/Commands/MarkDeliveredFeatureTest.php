<?php

namespace Tests\Console\Commands;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Purchase;
use App\Enums\PurchaseStatus;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use PHPUnit\Framework\Attributes\Test;

/**
 * Feature tests for POST /dashboard/inventory/purchases/{purchase}/mark-delivered
 *
 * Route:      dash.inventory.purchases.mark-delivered
 * Middleware: auth, role:inventory_manager|admin
 * Controller: PurchaseController::markDelivered()
 */
class MarkDeliveredFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['inventory.cod_auto_pay' => false]);
    }


    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function userWithRole(string $role, array $permissions = []): User
    {
        $roleModel = Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);

        foreach ($permissions as $perm) {
            $p = Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
            $roleModel->givePermissionTo($p);
        }

        $user = User::factory()->create();
        $user->assignRole($roleModel);

        return $user;
    }

    /**
     * Create a Purchase row directly — no factory needed.
     * supplier_id and created_by_user_id are satisfied by a real user row.
     */
    private function purchaseInStatus(string $status): Purchase
    {
        $user = User::factory()->create();

        // Insert a minimal supplier row so the FK is satisfied
        $supplierId = DB::table('suppliers')->insertGetId([
            'name'       => 'Test Supplier',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return Purchase::create([
            'purchase_number'     => 'PO-TEST-' . uniqid(),
            'supplier_id'         => $supplierId,
            'created_by_user_id'  => $user->id,
            'status'              => $status,
        ]);
    }

    private function url(Purchase $purchase): string
    {
        return route('dash.inventory.purchases.mark-delivered', $purchase);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WBT_PUR_DLV_001 — Unauthenticated
    // ─────────────────────────────────────────────────────────────────────────

    #[Test]
    public function test_unauthenticated_user_cannot_mark_delivered(): void
    {
        $purchase = $this->purchaseInStatus(PurchaseStatus::APPROVED);

        $this->postJson($this->url($purchase))->assertUnauthorized();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WBT_PUR_DLV_001b — Wrong role
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Test Case ID : WBT_PUR_DLV_001
     * Feature      : PurchaseController / markDelivered
     * Technique    : Branch Coverage
     * Precondition : User has neither inventory_manager role nor mark_delivered permission
     * Test Input   : POST /mark-delivered (cashier role)
     * Expected     : Returns JSON { message: 'You are not allowed to confirm delivery arrivals.' } with 403
     * Actual       : JSON 403 returned
     * Status       : Pass
     */
    #[Test]
    public function test_wrong_role_is_forbidden(): void
    {
        $user     = $this->userWithRole('cashier');
        $purchase = $this->purchaseInStatus(PurchaseStatus::APPROVED);

        $this->actingAs($user)
             ->postJson($this->url($purchase))
             ->assertForbidden();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WBT_PUR_DLV_002 — Invalid transition (PENDING cannot → RECEIVED)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Test Case ID : WBT_PUR_DLV_002
     * Feature      : PurchaseController / markDelivered
     * Technique    : Branch Coverage
     * Precondition : Authorized; ensureTransition fails — invalid transition
     * Test Input   : Purchase in wrong status for RECEIVED
     * Expected     : Returns JSON { message: exception message } with 422
     * Actual       : JSON error returned with 422
     * Status       : Pass
     */
    #[Test]
    public function test_invalid_status_transition_returns_422(): void
    {
        $user     = $this->userWithRole('inventory_manager');
        $purchase = $this->purchaseInStatus(PurchaseStatus::PENDING);

        $this->actingAs($user)
             ->postJson($this->url($purchase), ['delivered_qty' => 10])
             ->assertStatus(422)
             ->assertJsonStructure(['message']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WBT_PUR_DLV_003 — Actor role rejected by transition guard
    // admin passes middleware but ROLE_TRANSITIONS only allows
    // inventory_manager for RECEIVING → RECEIVED
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Test Case ID : WBT_PUR_DLV_003
     * Feature      : PurchaseController / markDelivered
     * Technique    : Branch Coverage
     * Precondition : Authorized; ensureTransition fails — actor role not permitted
     * Test Input   : Valid transition but actor role not permitted
     * Expected     : Returns JSON { message: exception message } with 403
     * Actual       : JSON error returned with 403
     * Status       : Pass
     */
    #[Test]
    public function test_unauthorized_actor_role_returns_403_on_valid_transition(): void
    {
        $user     = $this->userWithRole('admin');
        $purchase = $this->purchaseInStatus(PurchaseStatus::APPROVED);

        $this->actingAs($user)
             ->postJson($this->url($purchase), ['delivered_qty' => 10])
             ->assertForbidden()
             ->assertJsonStructure(['message']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WBT_PUR_DLV_004 — Service layer throws
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Test Case ID : WBT_PUR_DLV_004
     * Feature      : PurchaseController / markDelivered
     * Technique    : Branch Coverage
     * Precondition : Authorized; markDelivered service throws
     * Test Input   : Valid transition; markDelivered throws PurchaseStatusException
     * Expected     : Returns JSON { message: exception message } with 422
     * Actual       : JSON error returned with 422
     * Status       : Pass
     */
    #[Test]
    public function test_service_exception_returns_422(): void
    {
        $this->mock(\App\Services\Inventory\PurchaseService::class, function ($mock) {
            $mock->shouldReceive('markDelivered')
                ->once()
                ->andThrow(new \App\Exceptions\PurchaseStatusException('Simulated service failure'));
        });

        $user     = $this->userWithRole('inventory_manager');
        $purchase = $this->purchaseInStatus(PurchaseStatus::APPROVED);

        $this->actingAs($user)
             ->postJson($this->url($purchase), ['delivered_qty' => 10])
             ->assertStatus(422)
             ->assertJson(['message' => 'Simulated service failure']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WBT_PUR_DLV_005 — Happy path: all optional fields
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Test Case ID : WBT_PUR_DLV_005
     * Feature      : PurchaseController / markDelivered
     * Technique    : Branch Coverage
     * Precondition : All valid; optional fields provided
     * Test Input   : delivered_qty, damaged_qty, notes, delivery_reference provided
     * Expected     : Purchase marked received; Returns JSON { message: 'Purchase marked as received.' }
     * Actual       : JSON success returned
     * Status       : Pass
     */
    #[Test]
    public function test_valid_request_with_all_optional_fields_returns_200(): void
    {
        $user     = $this->userWithRole('inventory_manager');
        $purchase = $this->purchaseInStatus(PurchaseStatus::APPROVED);

        $this->actingAs($user)
             ->postJson($this->url($purchase), [
                 'delivered_qty'      => 10,
                 'damaged_qty'        => 1,
                 'notes'              => 'Arrived on time',
                 'damage_reason'      => 'Box crushed',
                 'damage_category'    => 'physical',
                 'delivery_reference' => 'DR-2025-001',
             ])
             ->assertOk()
             ->assertJson(['message' => 'Purchase marked as received.']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WBT_PUR_DLV_005b — Happy path: empty body
    // ─────────────────────────────────────────────────────────────────────────

    #[Test]
    public function test_empty_body_is_valid_and_returns_200(): void
    {
        $user     = $this->userWithRole('inventory_manager');
        $purchase = $this->purchaseInStatus(PurchaseStatus::APPROVED);

        $this->actingAs($user)
             ->postJson($this->url($purchase), [])
             ->assertOk()
             ->assertJson(['message' => 'Purchase marked as received.']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WBT_PUR_DLV_002b — Double submit
    // ─────────────────────────────────────────────────────────────────────────

    #[Test]
    public function test_double_submit_already_received_returns_422(): void
    {
        $user     = $this->userWithRole('inventory_manager');
        $purchase = $this->purchaseInStatus(PurchaseStatus::RECEIVED);

        $this->actingAs($user)
             ->postJson($this->url($purchase), ['delivered_qty' => 10])
             ->assertStatus(422)
             ->assertJsonStructure(['message']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Validator — field-level tests
    // ─────────────────────────────────────────────────────────────────────────

    #[Test]
    public function test_negative_delivered_qty_fails_validation(): void
    {
        $user     = $this->userWithRole('inventory_manager');
        $purchase = $this->purchaseInStatus(PurchaseStatus::APPROVED);

        $this->actingAs($user)
             ->postJson($this->url($purchase), ['delivered_qty' => -5])
             ->assertStatus(422)
             ->assertJsonValidationErrors(['delivered_qty']);
    }

    #[Test]
    public function test_damage_category_too_long_fails_validation(): void
    {
        $user     = $this->userWithRole('inventory_manager');
        $purchase = $this->purchaseInStatus(PurchaseStatus::APPROVED);

        $this->actingAs($user)
             ->postJson($this->url($purchase), ['damage_category' => str_repeat('x', 101)])
             ->assertStatus(422)
             ->assertJsonValidationErrors(['damage_category']);
    }

    #[Test]
    public function test_supplier_reference_required_when_cod_auto_pay_enabled(): void
    {
        config(['inventory.cod_auto_pay' => true]);

        $user     = $this->userWithRole('inventory_manager');
        $purchase = $this->purchaseInStatus(PurchaseStatus::APPROVED);

        $this->actingAs($user)
             ->postJson($this->url($purchase), ['delivered_qty' => 5])
             ->assertStatus(422)
             ->assertJsonValidationErrors(['supplier_reference']);
    }

    #[Test]
    public function test_supplier_reference_provided_passes_when_cod_auto_pay_enabled(): void
    {
        config(['inventory.cod_auto_pay' => true]);

        $user     = $this->userWithRole('inventory_manager');
        $purchase = $this->purchaseInStatus(PurchaseStatus::APPROVED);

        $this->actingAs($user)
             ->postJson($this->url($purchase), [
                 'delivered_qty'      => 5,
                 'supplier_reference' => 'SUP-REF-999',
             ])
             ->assertOk()
             ->assertJson(['message' => 'Purchase marked as received.']);
    }
}