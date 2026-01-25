<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerAddress;
use Illuminate\Database\Seeder;

class CustomerAddressSeeder extends Seeder
{
    public function run(): void
    {
        // Get customers (skip Walk-in customer)
        $juanDelaCruz = Customer::where('name', 'Juan Dela Cruz')->first();
        $mariaSantos = Customer::where('name', 'Maria Santos')->first();
        $pedroReyes = Customer::where('name', 'Pedro Reyes')->first();
        $abcRestaurant = Customer::where('name', 'ABC Restaurant Corp.')->first();
        $xyzHotel = Customer::where('name', 'XYZ Hotel')->first();
        $mangInasal = Customer::where('name', 'Mang Inasal - Davao Branch')->first();
        $anaGarcia = Customer::where('name', 'Ana Garcia')->first();
        $robertoTan = Customer::where('name', 'Roberto Tan')->first();
        $luzMendoza = Customer::where('name', 'Luz Mendoza')->first();
        $carlosRamos = Customer::where('name', 'Carlos Ramos')->first();

        // Juan Dela Cruz - 2 addresses
        if ($juanDelaCruz) {
            CustomerAddress::create([
                'customer_id' => $juanDelaCruz->id,
                'label' => 'home',
                'address_line1' => '123 Rizal Street',
                'address_line2' => 'Block 5 Lot 10',
                'barangay' => 'Poblacion',
                'city' => 'Davao City',
                'province' => 'Davao del Sur',
                'postal_code' => '8000',
                'is_default' => true,
            ]);

            CustomerAddress::create([
                'customer_id' => $juanDelaCruz->id,
                'label' => 'office',
                'address_line1' => '456 Bonifacio Avenue',
                'address_line2' => '3rd Floor',
                'barangay' => 'Buhangin',
                'city' => 'Davao City',
                'province' => 'Davao del Sur',
                'postal_code' => '8000',
                'is_default' => false,
            ]);
        }

        // Maria Santos
        if ($mariaSantos) {
            CustomerAddress::create([
                'customer_id' => $mariaSantos->id,
                'label' => 'home',
                'address_line1' => '789 Mabini Street',
                'address_line2' => null,
                'barangay' => 'Agdao',
                'city' => 'Davao City',
                'province' => 'Davao del Sur',
                'postal_code' => '8000',
                'is_default' => true,
            ]);
        }

        // Pedro Reyes
        if ($pedroReyes) {
            CustomerAddress::create([
                'customer_id' => $pedroReyes->id,
                'label' => 'home',
                'address_line1' => '321 Luna Street',
                'address_line2' => 'Purok 12',
                'barangay' => 'Matina',
                'city' => 'Davao City',
                'province' => 'Davao del Sur',
                'postal_code' => '8000',
                'is_default' => true,
            ]);
        }

        // ABC Restaurant Corp.
        if ($abcRestaurant) {
            CustomerAddress::create([
                'customer_id' => $abcRestaurant->id,
                'label' => 'main_branch',
                'address_line1' => '100 CM Recto Avenue',
                'address_line2' => 'Ground Floor',
                'barangay' => 'Poblacion',
                'city' => 'Davao City',
                'province' => 'Davao del Sur',
                'postal_code' => '8000',
                'is_default' => true,
            ]);
        }

        // XYZ Hotel
        if ($xyzHotel) {
            CustomerAddress::create([
                'customer_id' => $xyzHotel->id,
                'label' => 'hotel',
                'address_line1' => '200 JP Laurel Avenue',
                'address_line2' => null,
                'barangay' => 'Bajada',
                'city' => 'Davao City',
                'province' => 'Davao del Sur',
                'postal_code' => '8000',
                'is_default' => true,
            ]);
        }

        // Mang Inasal
        if ($mangInasal) {
            CustomerAddress::create([
                'customer_id' => $mangInasal->id,
                'label' => 'davao_branch',
                'address_line1' => 'SM City Davao',
                'address_line2' => '2nd Floor Food Court',
                'barangay' => 'Matina',
                'city' => 'Davao City',
                'province' => 'Davao del Sur',
                'postal_code' => '8000',
                'is_default' => true,
            ]);
        }

        // Ana Garcia
        if ($anaGarcia) {
            CustomerAddress::create([
                'customer_id' => $anaGarcia->id,
                'label' => 'home',
                'address_line1' => '555 Quirino Avenue',
                'address_line2' => 'Unit 12',
                'barangay' => 'Ma-a',
                'city' => 'Davao City',
                'province' => 'Davao del Sur',
                'postal_code' => '8000',
                'is_default' => true,
            ]);
        }

        // Roberto Tan
        if ($robertoTan) {
            CustomerAddress::create([
                'customer_id' => $robertoTan->id,
                'label' => 'home',
                'address_line1' => '888 Jacinto Street',
                'address_line2' => null,
                'barangay' => 'Lanang',
                'city' => 'Davao City',
                'province' => 'Davao del Sur',
                'postal_code' => '8000',
                'is_default' => true,
            ]);
        }

        // Luz Mendoza
        if ($luzMendoza) {
            CustomerAddress::create([
                'customer_id' => $luzMendoza->id,
                'label' => 'home',
                'address_line1' => '999 Roxas Avenue',
                'address_line2' => 'Near Public Market',
                'barangay' => 'Poblacion',
                'city' => 'Davao City',
                'province' => 'Davao del Sur',
                'postal_code' => '8000',
                'is_default' => true,
            ]);
        }

        // Carlos Ramos
        if ($carlosRamos) {
            CustomerAddress::create([
                'customer_id' => $carlosRamos->id,
                'label' => 'home',
                'address_line1' => '777 Illustre Street',
                'address_line2' => 'Phase 2',
                'barangay' => 'Talomo',
                'city' => 'Davao City',
                'province' => 'Davao del Sur',
                'postal_code' => '8000',
                'is_default' => true,
            ]);
        }
    }
}