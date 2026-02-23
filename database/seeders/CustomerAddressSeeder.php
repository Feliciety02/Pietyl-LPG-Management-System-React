<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerAddress;
use Illuminate\Database\Seeder;

class CustomerAddressSeeder extends Seeder
{
    public function run(): void
    {
        $addressData = [
            // Juan Dela Cruz - 2 addresses
            ['customer_name' => 'Juan Dela Cruz',               'label' => 'home',          'address_line1' => '123 Rizal Street',              'address_line2' => 'Block 5 Lot 10',        'barangay' => 'Poblacion',  'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            ['customer_name' => 'Juan Dela Cruz',               'label' => 'office',        'address_line1' => '456 Bonifacio Avenue',           'address_line2' => '3rd Floor',             'barangay' => 'Buhangin',   'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => false],
            // Maria Santos
            ['customer_name' => 'Maria Santos',                 'label' => 'home',          'address_line1' => '789 Mabini Street',              'address_line2' => null,                    'barangay' => 'Agdao',      'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Pedro Reyes
            ['customer_name' => 'Pedro Reyes',                  'label' => 'home',          'address_line1' => '321 Luna Street',                'address_line2' => 'Purok 12',              'barangay' => 'Matina',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Ana Garcia
            ['customer_name' => 'Ana Garcia',                   'label' => 'home',          'address_line1' => '555 Quirino Avenue',             'address_line2' => 'Unit 12',               'barangay' => 'Ma-a',       'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Roberto Tan - 2 addresses
            ['customer_name' => 'Roberto Tan',                  'label' => 'home',          'address_line1' => '888 Jacinto Street',             'address_line2' => null,                    'barangay' => 'Lanang',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            ['customer_name' => 'Roberto Tan',                  'label' => 'office',        'address_line1' => '12 Ilustre Street',              'address_line2' => 'Suite 4',               'barangay' => 'Poblacion',  'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => false],
            // Luz Mendoza
            ['customer_name' => 'Luz Mendoza',                  'label' => 'home',          'address_line1' => '999 Roxas Avenue',               'address_line2' => 'Near Public Market',    'barangay' => 'Poblacion',  'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Carlos Ramos
            ['customer_name' => 'Carlos Ramos',                 'label' => 'home',          'address_line1' => '777 Illustre Street',            'address_line2' => 'Phase 2',               'barangay' => 'Talomo',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Sofia Villanueva
            ['customer_name' => 'Sofia Villanueva',             'label' => 'home',          'address_line1' => '34 Pelayo Street',               'address_line2' => null,                    'barangay' => 'Panacan',    'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Eduardo Cruz - 2 addresses
            ['customer_name' => 'Eduardo Cruz',                 'label' => 'home',          'address_line1' => '56 Quirino Avenue',              'address_line2' => 'Purok 4',               'barangay' => 'Ecoland',    'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            ['customer_name' => 'Eduardo Cruz',                 'label' => 'work',          'address_line1' => '88 CM Recto Avenue',             'address_line2' => null,                    'barangay' => 'Poblacion',  'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => false],
            // Teresa Bautista
            ['customer_name' => 'Teresa Bautista',              'label' => 'home',          'address_line1' => '78 Laurel Avenue',               'address_line2' => null,                    'barangay' => 'Bajada',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Ernesto Lim
            ['customer_name' => 'Ernesto Lim',                  'label' => 'home',          'address_line1' => '90 San Pedro Street',            'address_line2' => 'Unit 5',                'barangay' => 'Poblacion',  'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Cynthia Dela Rosa
            ['customer_name' => 'Cynthia Dela Rosa',            'label' => 'home',          'address_line1' => '101 Camus Street',               'address_line2' => null,                    'barangay' => 'Agdao',      'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Ramon Aquino - 2 addresses
            ['customer_name' => 'Ramon Aquino',                 'label' => 'home',          'address_line1' => '112 Bolton Street',              'address_line2' => 'Lot 9',                 'barangay' => 'Matina',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            ['customer_name' => 'Ramon Aquino',                 'label' => 'warehouse',     'address_line1' => '45 Airport Road',                'address_line2' => 'Bldg C',                'barangay' => 'Buhangin',   'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => false],
            // Natividad Flores
            ['customer_name' => 'Natividad Flores',             'label' => 'home',          'address_line1' => '123 Dacudao Avenue',             'address_line2' => null,                    'barangay' => 'Talomo',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Armando Pascual
            ['customer_name' => 'Armando Pascual',              'label' => 'home',          'address_line1' => '134 Torres Street',              'address_line2' => 'Phase 3',               'barangay' => 'Lanang',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Rosario Gutierrez
            ['customer_name' => 'Rosario Gutierrez',            'label' => 'home',          'address_line1' => '145 Anda Street',                'address_line2' => null,                    'barangay' => 'Ma-a',       'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Danilo Soriano
            ['customer_name' => 'Danilo Soriano',               'label' => 'home',          'address_line1' => '156 Magallanes Street',          'address_line2' => null,                    'barangay' => 'Poblacion',  'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Glenda Navarro - 2 addresses
            ['customer_name' => 'Glenda Navarro',               'label' => 'home',          'address_line1' => '167 Magsaysay Avenue',           'address_line2' => 'Purok 7',               'barangay' => 'Matina',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            ['customer_name' => 'Glenda Navarro',               'label' => 'province',      'address_line1' => '8 National Highway',             'address_line2' => null,                    'barangay' => 'Calinan',    'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8021', 'is_default' => false],
            // Alfredo Castro
            ['customer_name' => 'Alfredo Castro',               'label' => 'home',          'address_line1' => '178 Pichon Street',              'address_line2' => null,                    'barangay' => 'Panacan',    'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Milagros Torres
            ['customer_name' => 'Milagros Torres',              'label' => 'home',          'address_line1' => '189 Lapu-Lapu Street',           'address_line2' => 'Block 2',               'barangay' => 'Ecoland',    'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Renato Paglinawan
            ['customer_name' => 'Renato Paglinawan',            'label' => 'home',          'address_line1' => '200 Artiaga Street',             'address_line2' => null,                    'barangay' => 'Agdao',      'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Lorna Espiritu - 2 addresses
            ['customer_name' => 'Lorna Espiritu',               'label' => 'home',          'address_line1' => '211 Diversion Road',             'address_line2' => null,                    'barangay' => 'Talomo',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            ['customer_name' => 'Lorna Espiritu',               'label' => 'warehouse',     'address_line1' => '55 Airport Road',                'address_line2' => 'Warehouse B',           'barangay' => 'Buhangin',   'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => false],
            // Victorio Macaraeg
            ['customer_name' => 'Victorio Macaraeg',            'label' => 'home',          'address_line1' => '222 McArthur Highway',           'address_line2' => 'Lot 3',                 'barangay' => 'Lanang',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Amelia Ignacio
            ['customer_name' => 'Amelia Ignacio',               'label' => 'home',          'address_line1' => '233 Claveria Street',            'address_line2' => null,                    'barangay' => 'Bajada',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Rodrigo Cabrera - 2 addresses
            ['customer_name' => 'Rodrigo Cabrera',              'label' => 'home',          'address_line1' => '244 Padre Faura Street',         'address_line2' => 'Unit 3B',               'barangay' => 'Poblacion',  'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            ['customer_name' => 'Rodrigo Cabrera',              'label' => 'office',        'address_line1' => '19 Sandawa Road',                'address_line2' => null,                    'barangay' => 'Matina',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => false],
            // Felicitas Borja
            ['customer_name' => 'Felicitas Borja',              'label' => 'home',          'address_line1' => '255 Quirino Avenue',             'address_line2' => null,                    'barangay' => 'Ma-a',       'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Dominic Fernandez
            ['customer_name' => 'Dominic Fernandez',            'label' => 'home',          'address_line1' => '266 R. Castillo Street',         'address_line2' => 'Phase 1',               'barangay' => 'Agdao',      'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Melinda Ocampo
            ['customer_name' => 'Melinda Ocampo',               'label' => 'home',          'address_line1' => '277 Palma Gil Street',           'address_line2' => null,                    'barangay' => 'Matina',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Bernardo Valenzuela
            ['customer_name' => 'Bernardo Valenzuela',          'label' => 'home',          'address_line1' => '288 Generoso Street',            'address_line2' => null,                    'barangay' => 'Panacan',    'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Josefina Manalo - 2 addresses
            ['customer_name' => 'Josefina Manalo',              'label' => 'home',          'address_line1' => '299 Brokenshire Road',           'address_line2' => 'Purok 5',               'barangay' => 'Talomo',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            ['customer_name' => 'Josefina Manalo',              'label' => 'province',      'address_line1' => '3 Circumferential Road',         'address_line2' => null,                    'barangay' => 'Mintal',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8023', 'is_default' => false],
            // Dionisio Villaroel
            ['customer_name' => 'Dionisio Villaroel',           'label' => 'home',          'address_line1' => '300 Sasa Road',                  'address_line2' => null,                    'barangay' => 'Sasa',       'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Concepcion Reyes
            ['customer_name' => 'Concepcion Reyes',             'label' => 'home',          'address_line1' => '311 Mintal Highway',             'address_line2' => 'Block 7',               'barangay' => 'Mintal',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8023', 'is_default' => true],
            // Arsenio De Guzman
            ['customer_name' => 'Arsenio De Guzman',            'label' => 'home',          'address_line1' => '322 Toril Road',                 'address_line2' => null,                    'barangay' => 'Toril',      'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8015', 'is_default' => true],
            // Pacita Evangelista
            ['customer_name' => 'Pacita Evangelista',           'label' => 'home',          'address_line1' => '333 Calinan Road',               'address_line2' => 'Lot 22',                'barangay' => 'Calinan',    'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8021', 'is_default' => true],
            // Teodoro Villafuerte
            ['customer_name' => 'Teodoro Villafuerte',          'label' => 'home',          'address_line1' => '344 Bucana Road',                'address_line2' => null,                    'barangay' => 'Bucana',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Carmelita Alcantara
            ['customer_name' => 'Carmelita Alcantara',          'label' => 'home',          'address_line1' => '355 Tigatto Road',               'address_line2' => '3rd Floor, Condo B',    'barangay' => 'Buhangin',   'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            // Imelda Manzano - 2 addresses
            ['customer_name' => 'Imelda Manzano',               'label' => 'home',          'address_line1' => '377 Ilustre Avenue',             'address_line2' => null,                    'barangay' => 'Poblacion',  'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            ['customer_name' => 'Imelda Manzano',               'label' => 'province',      'address_line1' => '12 National Highway',            'address_line2' => 'Brgy Hall Area',        'barangay' => 'Calinan',    'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8021', 'is_default' => false],
            // Corporate Customers
            ['customer_name' => 'ABC Restaurant Corp.',         'label' => 'main_branch',   'address_line1' => '100 CM Recto Avenue',            'address_line2' => 'Ground Floor',          'barangay' => 'Poblacion',  'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            ['customer_name' => 'XYZ Hotel',                    'label' => 'hotel',         'address_line1' => '200 JP Laurel Avenue',           'address_line2' => null,                    'barangay' => 'Bajada',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            ['customer_name' => 'Mang Inasal - Davao Branch',   'label' => 'davao_branch',  'address_line1' => 'SM City Davao',                  'address_line2' => '2nd Floor Food Court',  'barangay' => 'Matina',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            ['customer_name' => 'Jollibee - SM Davao',          'label' => 'branch',        'address_line1' => 'SM City Davao, Ground Floor',    'address_line2' => null,                    'barangay' => 'Matina',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            ['customer_name' => 'Grand Mensah Hotel',           'label' => 'hotel',         'address_line1' => '55 Claro M. Recto Avenue',       'address_line2' => null,                    'barangay' => 'Poblacion',  'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            ['customer_name' => 'Chowking - Buhangin',          'label' => 'branch',        'address_line1' => 'Buhangin Commercial Center',     'address_line2' => 'Unit 3',                'barangay' => 'Buhangin',   'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            ['customer_name' => 'Davao Medical Center Canteen', 'label' => 'canteen',       'address_line1' => 'E. Quirino Avenue',              'address_line2' => 'Main Building, GF',     'barangay' => 'Poblacion',  'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            ['customer_name' => 'Golden Palace Restaurant',     'label' => 'main',          'address_line1' => '88 Ilustre Street',              'address_line2' => null,                    'barangay' => 'Poblacion',  'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            ['customer_name' => 'Abreeza Hotel & Suites',       'label' => 'hotel',         'address_line1' => 'J.P. Laurel Avenue',             'address_line2' => 'Beside Abreeza Mall',   'barangay' => 'Bajada',     'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
            ['customer_name' => 'San Pedro Hospital Canteen',   'label' => 'canteen',       'address_line1' => '500 A. Pichon Street',           'address_line2' => 'Hospital Canteen',      'barangay' => 'Poblacion',  'city' => 'Davao City', 'province' => 'Davao del Sur', 'postal_code' => '8000', 'is_default' => true],
        ];

        foreach ($addressData as $data) {
            $customer = Customer::where('name', $data['customer_name'])->first();
            if ($customer) {
                CustomerAddress::create([
                    'customer_id'   => $customer->id,
                    'label'         => $data['label'],
                    'address_line1' => $data['address_line1'],
                    'address_line2' => $data['address_line2'],
                    'barangay'      => $data['barangay'],
                    'city'          => $data['city'],
                    'province'      => $data['province'],
                    'postal_code'   => $data['postal_code'],
                    'is_default'    => $data['is_default'],
                ]);
            }
        }
    }
}