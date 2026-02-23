<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            // Walk-in
            ['name' => 'Walk-in Customer',              'phone' => null,            'email' => null,                                'customer_type' => 'walkin',    'notes' => 'Default customer for walk-in transactions'],

            // Regular Customers
            ['name' => 'Juan Dela Cruz',                'phone' => '09171234567',   'email' => 'juan.delacruz@gmail.com',           'customer_type' => 'regular',   'notes' => 'Loyal customer since 2023'],
            ['name' => 'Maria Santos',                  'phone' => '09281234567',   'email' => 'maria.santos@yahoo.com',            'customer_type' => 'regular',   'notes' => 'Weekly delivery schedule'],
            ['name' => 'Pedro Reyes',                   'phone' => '09391234567',   'email' => null,                                'customer_type' => 'regular',   'notes' => 'Prefers cash payment'],
            ['name' => 'Ana Garcia',                    'phone' => '09781234567',   'email' => 'ana.garcia@outlook.com',            'customer_type' => 'regular',   'notes' => 'Senior citizen discount applicable'],
            ['name' => 'Roberto Tan',                   'phone' => '09891234567',   'email' => 'roberto.tan@gmail.com',             'customer_type' => 'regular',   'notes' => null],
            ['name' => 'Luz Mendoza',                   'phone' => '09901234567',   'email' => null,                                'customer_type' => 'regular',   'notes' => 'Delivery address: Poblacion District'],
            ['name' => 'Carlos Ramos',                  'phone' => '09012345678',   'email' => 'carlos.ramos@yahoo.com',            'customer_type' => 'regular',   'notes' => 'VIP customer - priority delivery'],
            ['name' => 'Sofia Villanueva',              'phone' => '09123456789',   'email' => 'sofia.v@gmail.com',                 'customer_type' => 'regular',   'notes' => 'Prefers morning deliveries'],
            ['name' => 'Eduardo Cruz',                  'phone' => '09234567890',   'email' => 'eduardo.cruz@yahoo.com',            'customer_type' => 'regular',   'notes' => null],
            ['name' => 'Teresa Bautista',               'phone' => '09345678901',   'email' => 'teresa.b@gmail.com',                'customer_type' => 'regular',   'notes' => 'Allergic to certain packaging materials'],
            ['name' => 'Ernesto Lim',                   'phone' => '09456789012',   'email' => 'ernesto.lim@outlook.com',           'customer_type' => 'regular',   'notes' => 'Monthly bulk buyer'],
            ['name' => 'Cynthia Dela Rosa',             'phone' => '09567890123',   'email' => 'cynthia.dr@gmail.com',              'customer_type' => 'regular',   'notes' => null],
            ['name' => 'Ramon Aquino',                  'phone' => '09678901234',   'email' => 'ramon.aquino@yahoo.com',            'customer_type' => 'regular',   'notes' => 'Pays via GCash'],
            ['name' => 'Natividad Flores',              'phone' => '09789012345',   'email' => null,                                'customer_type' => 'regular',   'notes' => 'Prefers text notifications'],
            ['name' => 'Armando Pascual',               'phone' => '09890123456',   'email' => 'armando.p@gmail.com',               'customer_type' => 'regular',   'notes' => null],
            ['name' => 'Rosario Gutierrez',             'phone' => '09901234560',   'email' => 'rosario.g@outlook.com',             'customer_type' => 'regular',   'notes' => 'Discount card holder'],
            ['name' => 'Danilo Soriano',                'phone' => '09112345670',   'email' => 'danilo.s@gmail.com',                'customer_type' => 'regular',   'notes' => null],
            ['name' => 'Glenda Navarro',                'phone' => '09223456780',   'email' => 'glenda.n@yahoo.com',                'customer_type' => 'regular',   'notes' => 'Frequent buyer of LPG products'],
            ['name' => 'Alfredo Castro',                'phone' => '09334567890',   'email' => null,                                'customer_type' => 'regular',   'notes' => 'Cash on delivery only'],
            ['name' => 'Milagros Torres',               'phone' => '09445678900',   'email' => 'milagros.t@gmail.com',              'customer_type' => 'regular',   'notes' => null],
            ['name' => 'Renato Paglinawan',             'phone' => '09556789010',   'email' => 'renato.p@outlook.com',              'customer_type' => 'regular',   'notes' => 'Requests vacuum-packed orders'],
            ['name' => 'Lorna Espiritu',                'phone' => '09667890120',   'email' => null,                                'customer_type' => 'regular',   'notes' => 'VIP - refer to manager'],
            ['name' => 'Victorio Macaraeg',             'phone' => '09778901230',   'email' => 'victorio.m@gmail.com',              'customer_type' => 'regular',   'notes' => null],
            ['name' => 'Amelia Ignacio',                'phone' => '09889012340',   'email' => 'amelia.i@yahoo.com',                'customer_type' => 'regular',   'notes' => 'Bi-weekly orders'],
            ['name' => 'Rodrigo Cabrera',               'phone' => '09990123450',   'email' => null,                                'customer_type' => 'regular',   'notes' => null],
            ['name' => 'Felicitas Borja',               'phone' => '09101234560',   'email' => 'felicitas.b@gmail.com',             'customer_type' => 'regular',   'notes' => 'Requests extra ice packs'],
            ['name' => 'Dominic Fernandez',             'phone' => '09211234567',   'email' => 'dominic.f@outlook.com',             'customer_type' => 'regular',   'notes' => null],
            ['name' => 'Melinda Ocampo',                'phone' => '09322345678',   'email' => 'melinda.o@yahoo.com',               'customer_type' => 'regular',   'notes' => 'Always pays on time'],
            ['name' => 'Bernardo Valenzuela',           'phone' => '09433456789',   'email' => null,                                'customer_type' => 'regular',   'notes' => 'Requests invoice always'],
            ['name' => 'Josefina Manalo',               'phone' => '09544567890',   'email' => 'josefina.m@gmail.com',              'customer_type' => 'regular',   'notes' => null],
            ['name' => 'Dionisio Villaroel',            'phone' => '09655678901',   'email' => 'dionisio.v@outlook.com',            'customer_type' => 'regular',   'notes' => 'Special packaging required'],
            ['name' => 'Concepcion Reyes',              'phone' => '09766789012',   'email' => null,                                'customer_type' => 'regular',   'notes' => null],
            ['name' => 'Arsenio De Guzman',             'phone' => '09877890123',   'email' => 'arsenio.dg@gmail.com',              'customer_type' => 'regular',   'notes' => 'Prefers weekend delivery'],
            ['name' => 'Pacita Evangelista',            'phone' => '09988901234',   'email' => 'pacita.e@yahoo.com',                'customer_type' => 'regular',   'notes' => null],
            ['name' => 'Teodoro Villafuerte',           'phone' => '09109012345',   'email' => null,                                'customer_type' => 'regular',   'notes' => 'Discount: PWD'],
            ['name' => 'Carmelita Alcantara',           'phone' => '09210123456',   'email' => 'carmelita.a@gmail.com',             'customer_type' => 'regular',   'notes' => 'Delivers to 3rd floor, no elevator'],
            ['name' => 'Simplicio Hernandez',           'phone' => '09321234567',   'email' => null,                                'customer_type' => 'regular',   'notes' => null],
            ['name' => 'Imelda Manzano',                'phone' => '09432345678',   'email' => 'imelda.m@outlook.com',              'customer_type' => 'regular',   'notes' => 'Loyal since 2021'],
            ['name' => 'Noel Bañares',                  'phone' => '09543456789',   'email' => 'noel.b@gmail.com',                  'customer_type' => 'regular',   'notes' => 'Prefers GCash payment'],

            // Corporate Customers
            ['name' => 'ABC Restaurant Corp.',          'phone' => '09451234567',   'email' => 'purchasing@abcrestaurant.com',       'customer_type' => 'corporate', 'notes' => 'Bulk orders every Monday and Thursday'],
            ['name' => 'XYZ Hotel',                     'phone' => '09561234567',   'email' => 'admin@xyzhotel.com',                'customer_type' => 'corporate', 'notes' => 'Monthly billing arrangement'],
            ['name' => 'Mang Inasal - Davao Branch',    'phone' => '09671234567',   'email' => 'davao@manginasal.com',              'customer_type' => 'corporate', 'notes' => 'Contact: Karen (Manager)'],
            ['name' => 'Jollibee - SM Davao',           'phone' => '09101112131',   'email' => 'smdavao@jollibee.com.ph',           'customer_type' => 'corporate', 'notes' => 'Daily fresh LPG orders'],
            ['name' => 'Grand Mensah Hotel',            'phone' => '09202122232',   'email' => 'procurement@grandmensah.com',       'customer_type' => 'corporate', 'notes' => 'Weekly delivery, attn: Chef Marco'],
            ['name' => 'Chowking - Buhangin',           'phone' => '09303132333',   'email' => 'buhangin@chowking.com.ph',          'customer_type' => 'corporate', 'notes' => 'Order cutoff: 8am daily'],
            ['name' => 'Davao Medical Center Canteen',  'phone' => '09404142434',   'email' => 'canteen@dmc.gov.ph',                'customer_type' => 'corporate', 'notes' => 'Requires health cert with each delivery'],
            ['name' => 'Golden Palace Restaurant',      'phone' => '09505152535',   'email' => 'orders@goldenpalace.com',           'customer_type' => 'corporate', 'notes' => 'Prefer early morning drop-off'],
            ['name' => 'Veranza Mall Food Court',       'phone' => '09606162636',   'email' => 'foodcourt@veranza.com.ph',          'customer_type' => 'corporate', 'notes' => 'Multiple stall operators under one PO'],
            ['name' => 'Abreeza Hotel & Suites',        'phone' => '09707172737',   'email' => 'supply@abreeza-hotel.com',          'customer_type' => 'corporate', 'notes' => 'Bi-weekly delivery schedule'],
            ['name' => 'San Pedro Hospital Canteen',    'phone' => '09808182838',   'email' => 'canteen@sanpedrohosp.com',          'customer_type' => 'corporate', 'notes' => 'COD only, strict delivery window 6-8am'],
        ];

        foreach ($customers as $customer) {
            Customer::create($customer);
        }
    }
}