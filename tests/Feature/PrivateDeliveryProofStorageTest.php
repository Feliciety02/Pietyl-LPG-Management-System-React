<?php

use App\Http\Middleware\SyncLegacyRoles;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Delivery;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

function makeRiderUser(string $email, array $permissions = []): User
{
    $role = Role::firstOrCreate([
        'name' => 'rider',
        'guard_name' => 'web',
    ]);

    foreach ($permissions as $permissionName) {
        $permission = Permission::findOrCreate($permissionName, 'web');
        $role->givePermissionTo($permission);
    }

    $user = User::create([
        'name' => 'Rider User',
        'email' => $email,
        'password' => Hash::make('secret123'),
        'is_active' => true,
    ]);

    $user->assignRole($role);

    return $user->fresh();
}

function makeDeliveryForRider(User $rider): Delivery
{
    $customer = Customer::create([
        'name' => 'Private Proof Customer',
        'phone' => '09171234567',
        'customer_type' => 'regular',
    ]);

    $address = CustomerAddress::create([
        'customer_id' => $customer->id,
        'label' => 'home',
        'address_line1' => '123 Test Street',
        'city' => 'Davao City',
        'is_default' => true,
    ]);

    return Delivery::create([
        'delivery_number' => Delivery::generateDeliveryNumber(),
        'customer_id' => $customer->id,
        'address_id' => $address->id,
        'assigned_rider_user_id' => $rider->id,
        'status' => Delivery::STATUS_ASSIGNED,
        'scheduled_at' => now(),
    ]);
}

test('proof photo uploads are stored on the private local disk', function () {
    $this->withoutMiddleware(SyncLegacyRoles::class);

    Storage::fake('local');

    $rider = makeRiderUser('rider-private@test.local', [
        'rider.deliveries.update',
    ]);

    $delivery = makeDeliveryForRider($rider);

    $response = $this->actingAs($rider)->patch(
        route('dash.rider.deliveries.update', ['delivery' => $delivery->id]),
        [
            'status' => 'delivered',
            'proof_photo' => UploadedFile::fake()->image('proof.jpg'),
        ]
    );

    $response->assertRedirect();
    $response->assertSessionHas('success', 'Delivery status updated.');

    $delivery->refresh();

    expect($delivery->proof_photo_url)->toStartWith('pod/');
    expect($delivery->proof_photo_url)->not->toContain('/storage/');
    expect($delivery->proof_url)->toBe($delivery->proof_photo_url);

    Storage::disk('local')->assertExists($delivery->proof_photo_url);
});

test('delivery proof files are only accessible to authorized users', function () {
    $this->withoutMiddleware(SyncLegacyRoles::class);

    Storage::fake('local');

    $rider = makeRiderUser('proof-owner@test.local');
    $otherUser = User::create([
        'name' => 'Other User',
        'email' => 'proof-other@test.local',
        'password' => Hash::make('secret123'),
        'is_active' => true,
    ]);

    $delivery = makeDeliveryForRider($rider);
    $delivery->update([
        'proof_type' => 'photo',
        'proof_photo_url' => 'pod/proof-photo.jpg',
        'proof_url' => 'pod/proof-photo.jpg',
    ]);

    Storage::disk('local')->put('pod/proof-photo.jpg', 'private-proof');

    $response = $this->actingAs($rider)
        ->get(route('deliveries.proof.show', ['delivery' => $delivery->id, 'kind' => 'photo']));

    $response->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff');

    $cacheControl = (string) $response->headers->get('Cache-Control');
    expect($cacheControl)->toContain('private');
    expect($cacheControl)->toContain('no-store');
    expect($cacheControl)->toContain('max-age=0');

    $this->actingAs($otherUser)
        ->get(route('deliveries.proof.show', ['delivery' => $delivery->id, 'kind' => 'photo']))
        ->assertForbidden();
});
