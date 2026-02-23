<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Supplier;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SupplierProductResetSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        foreach ([
            'sale_items',
            'restock_request_items',
            'stock_movements',
            'purchase_items',
            'inventory_balances',
            'supplier_products',
            'product_variants',
            'products',
            'suppliers',
        ] as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->truncate();
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // ── 50 Suppliers ─────────────────────────────────────────────────
        $seedSuppliers = [
            // Primary LPG Distributors
            'Cotabato Roma Enterprises' => [
                'contact_name' => 'Ramon Cruz',
                'phone'        => '09171234567',
                'email'        => 'ramon.cruz@cotabatoroma.ph',
                'address'      => 'Davao City, Digos Highway',
                'notes'        => 'Primary bulk LPG distributor.',
            ],
            'CYBS Marketing' => [
                'contact_name' => 'Grace Lim',
                'phone'        => '09223334444',
                'email'        => 'hello@cybsmarketing.ph',
                'address'      => 'Tagum City, Km 6.5 Circumferential Road',
                'notes'        => 'Supplies City and Tagum locations.',
            ],
            'Towngas LPG Trading' => [
                'contact_name' => 'Jose Ramirez',
                'phone'        => '09335556677',
                'email'        => 'sales@towngaslpg.ph',
                'address'      => 'Panabo City, National Highway',
                'notes'        => 'Specializes in residential LPG delivery.',
            ],
            'M.Conpinco Home Improvement Super Center Inc' => [
                'contact_name' => 'Marcel Monte',
                'phone'        => '09181234567',
                'email'        => 'info@conpincohome.ph',
                'address'      => 'Davao City, McArthur Highway',
                'notes'        => 'Provides accessories and stoves alongside LPG.',
            ],

            // Additional LPG Distributors
            'Mindanao LPG Depot' => [
                'contact_name' => 'Rodrigo Dela Paz',
                'phone'        => '09204445566',
                'email'        => 'sales@mindanaolpgdepot.ph',
                'address'      => 'Davao City, Km 9 Diversion Road',
                'notes'        => 'Handles bulk industrial LPG orders.',
            ],
            'Southern Mindanao Gas Corp.' => [
                'contact_name' => 'Arnel Buenaventura',
                'phone'        => '09276667788',
                'email'        => 'info@smgascorp.ph',
                'address'      => 'General Santos City, National Highway',
                'notes'        => 'Regional LPG distributor for southern Mindanao.',
            ],
            'Davao Gas Traders Inc.' => [
                'contact_name' => 'Luz Fernandez',
                'phone'        => '09321112233',
                'email'        => 'luz@davaogastraders.ph',
                'address'      => 'Davao City, Bajada District',
                'notes'        => 'Local trader with fast turnaround times.',
            ],
            'Prycegas Davao Depot' => [
                'contact_name' => 'Nelson Pryce',
                'phone'        => '09198889900',
                'email'        => 'depot.davao@prycegas.com.ph',
                'address'      => 'Davao City, Buhangin',
                'notes'        => 'Official Prycegas depot for Davao region.',
            ],
            'Solane Mindanao Distribution' => [
                'contact_name' => 'Thelma Ramos',
                'phone'        => '09152223344',
                'email'        => 'mindanao@solane.com.ph',
                'address'      => 'Cagayan de Oro City, Kauswagan',
                'notes'        => 'Solane official distributor for Mindanao.',
            ],
            'Phoenix LPG Davao' => [
                'contact_name' => 'Dante Villanueva',
                'phone'        => '09263334455',
                'email'        => 'davao@phoenixlpg.ph',
                'address'      => 'Davao City, Sasa Port Area',
                'notes'        => 'Phoenix Petroleum LPG arm for Davao.',
            ],
            'Petron LPG Davao Hub' => [
                'contact_name' => 'Cesar Macaraeg',
                'phone'        => '09174445566',
                'email'        => 'lpg.davao@petron.com',
                'address'      => 'Davao City, Lanang Business Park',
                'notes'        => 'Petron official LPG hub for Davao region.',
            ],
            'Fiesta Gas Davao Depot' => [
                'contact_name' => 'Gloria Espiritu',
                'phone'        => '09225556677',
                'email'        => 'fiesta.davao@shellgas.ph',
                'address'      => 'Davao City, Toril District',
                'notes'        => 'Fiesta Gas depot servicing south Davao.',
            ],
            'Island Gas Trading' => [
                'contact_name' => 'Marco Ignacio',
                'phone'        => '09336667788',
                'email'        => 'sales@islandgastrading.ph',
                'address'      => 'Samal Island, Island Garden City',
                'notes'        => 'Supplies Samal Island and nearby areas.',
            ],
            'Tagum LPG Supply Corp.' => [
                'contact_name' => 'Erlinda Castillo',
                'phone'        => '09197778899',
                'email'        => 'info@tagumlpgsupply.ph',
                'address'      => 'Tagum City, Magugpo District',
                'notes'        => 'Covers Tagum and Compostela Valley deliveries.',
            ],
            'Digos Gas Depot' => [
                'contact_name' => 'Renato Paglinawan',
                'phone'        => '09158889900',
                'email'        => 'digos@gasdepot.ph',
                'address'      => 'Digos City, National Highway',
                'notes'        => 'LPG supplier for Davao del Sur.',
            ],
            'Panabo Petroleum Trading' => [
                'contact_name' => 'Virgilio Soriano',
                'phone'        => '09269990011',
                'email'        => 'vpsoriano@panabopetroleum.ph',
                'address'      => 'Panabo City, JP Laurel Highway',
                'notes'        => 'LPG and petroleum distributor for Panabo area.',
            ],
            'Mati Gas and Petroleum Inc.' => [
                'contact_name' => 'Amelia Cruz',
                'phone'        => '09170001122',
                'email'        => 'amelia@matigaspetroleum.ph',
                'address'      => 'Mati City, Dahican',
                'notes'        => 'Serves Davao Oriental LPG market.',
            ],
            'Davao del Norte Gas Traders' => [
                'contact_name' => 'Bernardo Navarro',
                'phone'        => '09221112233',
                'email'        => 'bnav@ddngas.ph',
                'address'      => 'Carmen, Davao del Norte',
                'notes'        => 'Regional distributor for Davao del Norte.',
            ],
            'Bukidnon LPG Distributors' => [
                'contact_name' => 'Felicitas Manalo',
                'phone'        => '09332223344',
                'email'        => 'felicitas@bukidnonlpg.ph',
                'address'      => 'Malaybalay City, Bukidnon',
                'notes'        => 'Covers Bukidnon and nearby highland areas.',
            ],
            'Cotabato Gas Supply Corp.' => [
                'contact_name' => 'Dominic Valdez',
                'phone'        => '09193334455',
                'email'        => 'dominic@cotabatogas.ph',
                'address'      => 'Cotabato City, Sinsuat Avenue',
                'notes'        => 'LPG supplier for Cotabato and BARMM areas.',
            ],

            // Hardware / Stove / Accessories Suppliers
            'Handyman Hardware Davao' => [
                'contact_name' => 'Noel Alcantara',
                'phone'        => '09154445566',
                'email'        => 'davao@handymanhardware.ph',
                'address'      => 'Davao City, SM Lanang Premier',
                'notes'        => 'Stoves and accessories retail supplier.',
            ],
            'True Value Hardware Davao' => [
                'contact_name' => 'Arlene Bautista',
                'phone'        => '09265556677',
                'email'        => 'davao@truevalue.com.ph',
                'address'      => 'Davao City, Abreeza Mall',
                'notes'        => 'Hardware and kitchen appliance supplier.',
            ],
            'AllHome Davao' => [
                'contact_name' => 'Ricardo Torres',
                'phone'        => '09176667788',
                'email'        => 'davao@allhome.com.ph',
                'address'      => 'Davao City, Ecoland Drive',
                'notes'        => 'Home improvement and appliance supplier.',
            ],
            'Ace Hardware Davao' => [
                'contact_name' => 'Lourdes Aquino',
                'phone'        => '09227778899',
                'email'        => 'davao@acehardware.com.ph',
                'address'      => 'Davao City, Robinsons Place Davao',
                'notes'        => 'Wide range of hardware and accessories.',
            ],
            'W. Goco Hardware Supply' => [
                'contact_name' => 'Walter Goco',
                'phone'        => '09338889900',
                'email'        => 'wgoco@gocohardware.ph',
                'address'      => 'Davao City, Bankerohan Market Area',
                'notes'        => 'Local hardware supplier, bulk accessories.',
            ],
            'Davao Hardware and Industrial Supply' => [
                'contact_name' => 'Conchita Reyes',
                'phone'        => '09199990011',
                'email'        => 'sales@davaohardware.ph',
                'address'      => 'Davao City, Agdao Commercial Area',
                'notes'        => 'Industrial and household hardware supplier.',
            ],
            'Mindanao Industrial Supply Corp.' => [
                'contact_name' => 'Eduardo Santos',
                'phone'        => '09150001122',
                'email'        => 'esantos@mindanaoindustrial.ph',
                'address'      => 'Davao City, Panacan Industrial Zone',
                'notes'        => 'Industrial equipment and LPG accessories.',
            ],
            'La Germania Philippines Corp.' => [
                'contact_name' => 'Sofia Villanueva',
                'phone'        => '09261112233',
                'email'        => 'sofia@lagermaniaph.com',
                'address'      => 'Manila, Paco District (Davao Rep.)',
                'notes'        => 'Official La Germania stove distributor.',
            ],
            'Asahi Philippines Inc.' => [
                'contact_name' => 'Hiroshi Tanaka',
                'phone'        => '09172223344',
                'email'        => 'htanaka@asahiph.com',
                'address'      => 'Cebu City, Mandaue (Mindanao Rep.)',
                'notes'        => 'Asahi appliances official distributor.',
            ],
            'Global Kitchenware Trading' => [
                'contact_name' => 'Marisol Dela Rosa',
                'phone'        => '09223334455',
                'email'        => 'marisol@globalkitchenware.ph',
                'address'      => 'Davao City, Matina Town Square',
                'notes'        => 'Kitchenware and gas stove wholesaler.',
            ],

            // Safety & Regulatory Equipment
            'Safety First Philippines' => [
                'contact_name' => 'Arnaldo Cruz',
                'phone'        => '09334445566',
                'email'        => 'arnaldo@safetyfirstph.com',
                'address'      => 'Davao City, Quimpo Blvd',
                'notes'        => 'LPG safety equipment and detectors.',
            ],
            'Firepro Safety Solutions' => [
                'contact_name' => 'Elena Flores',
                'phone'        => '09195556677',
                'email'        => 'elena@fireproph.com',
                'address'      => 'Davao City, Bajada',
                'notes'        => 'Fire and gas safety compliance products.',
            ],
            'ProGas Safety Equipment' => [
                'contact_name' => 'Manuel Hernandez',
                'phone'        => '09156667788',
                'email'        => 'manuel@progassafety.ph',
                'address'      => 'Davao City, Ilustre Street',
                'notes'        => 'Regulators, hoses, and safety valves.',
            ],
            'Safeguard Industrial Corp.' => [
                'contact_name' => 'Virginia Ocampo',
                'phone'        => '09267778899',
                'email'        => 'virginia@safeguardindustrial.ph',
                'address'      => 'Davao City, Km 7 McArthur Hwy',
                'notes'        => 'Industrial safety and LPG compliance gear.',
            ],
            'LPG Solutions PH' => [
                'contact_name' => 'Bonifacio Mendez',
                'phone'        => '09178889900',
                'email'        => 'boni@lpgsolutionsph.com',
                'address'      => 'Davao City, Sasa',
                'notes'        => 'Comprehensive LPG accessories and fittings.',
            ],

            // Packaging & Logistics
            'Davao Packaging Supply' => [
                'contact_name' => 'Concepcion Borja',
                'phone'        => '09229990011',
                'email'        => 'cborja@davaopkg.ph',
                'address'      => 'Davao City, Tibungco',
                'notes'        => 'Packaging materials for LPG accessories.',
            ],
            'Mindanao Logistics Corp.' => [
                'contact_name' => 'Alfredo Pascual',
                'phone'        => '09340001122',
                'email'        => 'alfredo@mindanaologistics.ph',
                'address'      => 'Davao City, Port Area Sasa',
                'notes'        => 'Freight and logistics for bulk LPG orders.',
            ],
            'FastFreight Davao' => [
                'contact_name' => 'Natividad Gutierrez',
                'phone'        => '09191112233',
                'email'        => 'nati@fastfreightdavao.ph',
                'address'      => 'Davao City, Diversion Road',
                'notes'        => 'Express delivery and courier for small orders.',
            ],

            // Cylinder Maintenance & Refurbishment
            'Davao Cylinder Repair Center' => [
                'contact_name' => 'Simplicio Andrade',
                'phone'        => '09152223344',
                'email'        => 'simplicio@davaocylinder.ph',
                'address'      => 'Davao City, Panacan',
                'notes'        => 'LPG cylinder testing, repair, and requalification.',
            ],
            'Mindanao Cylinder Services' => [
                'contact_name' => 'Teodoro Villafuerte',
                'phone'        => '09263334455',
                'email'        => 'teo@mindanaocylinder.ph',
                'address'      => 'Davao City, Buhangin Industrial',
                'notes'        => 'Cylinder hydro-testing and valve replacement.',
            ],
            'PhilCylinder Requalification Inc.' => [
                'contact_name' => 'Imelda Evangelista',
                'phone'        => '09174445566',
                'email'        => 'imelda@philcylinder.ph',
                'address'      => 'Cebu City (Davao Service Rep.)',
                'notes'        => 'National cylinder requalification network.',
            ],

            // Spare Parts & Fittings
            'Mintal Hardware and Parts' => [
                'contact_name' => 'Rodrigo Banares',
                'phone'        => '09225556677',
                'email'        => 'rodrigo@mintalhardware.ph',
                'address'      => 'Mintal, Davao City',
                'notes'        => 'LPG spare parts and fittings retailer.',
            ],
            'Toril Industrial Supplies' => [
                'contact_name' => 'Pacita Alcantara',
                'phone'        => '09336667788',
                'email'        => 'pacita@torilsupplies.ph',
                'address'      => 'Toril District, Davao City',
                'notes'        => 'Industrial parts and LPG fittings.',
            ],
            'Calinan Farm and Hardware' => [
                'contact_name' => 'Ernesto Lim',
                'phone'        => '09197778899',
                'email'        => 'ernesto@calinanfarm.ph',
                'address'      => 'Calinan, Davao City',
                'notes'        => 'Hardware and agricultural supply store.',
            ],
            'Buhangin Parts and Supply' => [
                'contact_name' => 'Carlota Navarro',
                'phone'        => '09158889900',
                'email'        => 'carlota@buhanginparts.ph',
                'address'      => 'Buhangin, Davao City',
                'notes'        => 'Auto and industrial parts, LPG fittings.',
            ],

            // General Trading Companies
            'Davao General Trading Corp.' => [
                'contact_name' => 'Patricio Santos',
                'phone'        => '09269990011',
                'email'        => 'patricio@davaogeneral.ph',
                'address'      => 'Davao City, Monteverde Street',
                'notes'        => 'Multi-line trading company, LPG accessories.',
            ],
            'Southern Philippines Trading Inc.' => [
                'contact_name' => 'Wilhelmina Ramos',
                'phone'        => '09170001122',
                'email'        => 'wilma@southernphtrading.ph',
                'address'      => 'Davao City, C.M. Recto Street',
                'notes'        => 'General trading for household and commercial goods.',
            ],
            'Mindanao Commercial Enterprises' => [
                'contact_name' => 'Arsenio Dela Cruz',
                'phone'        => '09221112233',
                'email'        => 'arsenio@mindanaocommercial.ph',
                'address'      => 'Davao City, San Pedro Street',
                'notes'        => 'Wholesale supplier for LPG and related goods.',
            ],
            'Aboitiz Distribution Corp.' => [
                'contact_name' => 'Rafael Aboitiz',
                'phone'        => '09332223344',
                'email'        => 'rafael@aboitizdc.ph',
                'address'      => 'Cebu City (Davao Branch)',
                'notes'        => 'Large-scale distribution network across Visayas-Mindanao.',
            ],
            'Gaisano Grand Wholesale Division' => [
                'contact_name' => 'Herminia Gaisano',
                'phone'        => '09193334455',
                'email'        => 'wholesale@gaisanogrand.ph',
                'address'      => 'Davao City, Ilustre Avenue',
                'notes'        => 'Wholesale division for household and commercial goods.',
            ],
        ];

        $supplierMap = [];
        foreach ($seedSuppliers as $name => $details) {
            $supplier           = Supplier::create(array_merge(['name' => $name, 'is_active' => true], $details));
            $supplierMap[$name] = $supplier->id;
        }

        // ── 50 Products (assigned to the original 4 primary suppliers) ───
        $seedItems = [
            // Petron Gasul — LPG
            ['name' => 'Petron Gasul 50kg',                        'supplier' => 'Cotabato Roma Enterprises',                    'supplier_cost' => 3570, 'price' => 4200, 'category' => 'lpg'],
            ['name' => 'Petron Gasul 22kg',                        'supplier' => 'Cotabato Roma Enterprises',                    'supplier_cost' => 1700, 'price' => 2000, 'category' => 'lpg'],
            ['name' => 'Petron Gasul Snap On 11kg',                'supplier' => 'Cotabato Roma Enterprises',                    'supplier_cost' => 850,  'price' => 1000, 'category' => 'lpg'],
            ['name' => 'Petron Gasul POL Valve 11kg',              'supplier' => 'Cotabato Roma Enterprises',                    'supplier_cost' => 850,  'price' => 1000, 'category' => 'lpg'],
            ['name' => 'Petron Gasul Gasulette Snap On 2.7kg',     'supplier' => 'Cotabato Roma Enterprises',                    'supplier_cost' => 340,  'price' => 400,  'category' => 'lpg'],
            ['name' => 'Petron Gasul Slim 5.0kg',                  'supplier' => 'Cotabato Roma Enterprises',                    'supplier_cost' => 510,  'price' => 600,  'category' => 'lpg'],

            // Phoenix Super LPG
            ['name' => 'Phoenix Super LPG Compact 11kg',           'supplier' => 'CYBS Marketing',                               'supplier_cost' => 850,  'price' => 1000, 'category' => 'lpg'],
            ['name' => 'Phoenix Super LPG Budget 1.0kg',           'supplier' => 'CYBS Marketing',                               'supplier_cost' => 170,  'price' => 200,  'category' => 'lpg'],
            ['name' => 'Phoenix Super LPG 22kg',                   'supplier' => 'CYBS Marketing',                               'supplier_cost' => 1700, 'price' => 2000, 'category' => 'lpg'],
            ['name' => 'Phoenix Super LPG 50kg',                   'supplier' => 'CYBS Marketing',                               'supplier_cost' => 3570, 'price' => 4200, 'category' => 'lpg'],

            // Solane LPG
            ['name' => 'Solane Pol Valve 50kg',                    'supplier' => 'Towngas LPG Trading',                          'supplier_cost' => 3570, 'price' => 4200, 'category' => 'lpg'],
            ['name' => 'Solane LPG 22kg',                          'supplier' => 'Towngas LPG Trading',                          'supplier_cost' => 1700, 'price' => 2000, 'category' => 'lpg'],
            ['name' => 'Solane AS 11kg',                           'supplier' => 'Towngas LPG Trading',                          'supplier_cost' => 965,  'price' => 1135, 'category' => 'lpg'],
            ['name' => 'Solane Pol Valve 11kg',                    'supplier' => 'Towngas LPG Trading',                          'supplier_cost' => 965,  'price' => 1135, 'category' => 'lpg'],
            ['name' => 'Solane Sakto AS 1.4kg',                    'supplier' => 'Towngas LPG Trading',                          'supplier_cost' => 255,  'price' => 300,  'category' => 'lpg'],
            ['name' => 'Solane Slim 5.0kg',                        'supplier' => 'Towngas LPG Trading',                          'supplier_cost' => 510,  'price' => 600,  'category' => 'lpg'],

            // Fiesta Gas
            ['name' => 'Fiesta Gas Pol Valve 11kg',                'supplier' => 'Cotabato Roma Enterprises',                    'supplier_cost' => 803,  'price' => 945,  'category' => 'lpg'],
            ['name' => 'Fiesta Gas Pol Valve 5.0kg',               'supplier' => 'Cotabato Roma Enterprises',                    'supplier_cost' => 510,  'price' => 600,  'category' => 'lpg'],
            ['name' => 'Fiesta Gas Snap On 2.7kg',                 'supplier' => 'Cotabato Roma Enterprises',                    'supplier_cost' => 340,  'price' => 400,  'category' => 'lpg'],
            ['name' => 'Fiesta Gas 22kg',                          'supplier' => 'Cotabato Roma Enterprises',                    'supplier_cost' => 1700, 'price' => 2000, 'category' => 'lpg'],

            // Prycegas
            ['name' => 'Prycegas 50kg',                            'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 3570, 'price' => 4200, 'category' => 'lpg'],
            ['name' => 'Prycegas 22kg',                            'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 1700, 'price' => 2000, 'category' => 'lpg'],
            ['name' => 'Prycegas 11kg',                            'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 1020, 'price' => 1200, 'category' => 'lpg'],
            ['name' => 'Prycegas 5.0kg',                           'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 510,  'price' => 600,  'category' => 'lpg'],
            ['name' => 'Prycegas Power Kalan 2.7kg',               'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 289,  'price' => 340,  'category' => 'lpg'],

            // Gas Stoves — La Germania
            ['name' => 'La Germania G733',                         'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 2720, 'price' => 3200, 'category' => 'stove'],
            ['name' => 'La Germania G650',                         'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 2380, 'price' => 2800, 'category' => 'stove'],
            ['name' => 'La Germania G1000max',                     'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 3825, 'price' => 4500, 'category' => 'stove'],
            ['name' => 'La Germania G150',                         'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 1615, 'price' => 1900, 'category' => 'stove'],
            ['name' => 'La Germania G390',                         'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 2210, 'price' => 2600, 'category' => 'stove'],
            ['name' => 'La Germania G702',                         'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 2550, 'price' => 3000, 'category' => 'stove'],
            ['name' => 'La Germania G500',                         'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 2040, 'price' => 2400, 'category' => 'stove'],

            // Gas Stoves — Asahi
            ['name' => 'Asahi GS446',                              'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 553,  'price' => 650,  'category' => 'stove'],
            ['name' => 'Asahi GS447',                              'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 578,  'price' => 680,  'category' => 'stove'],
            ['name' => 'Asahi GS667',                              'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 612,  'price' => 720,  'category' => 'stove'],
            ['name' => 'Asahi GS880',                              'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 680,  'price' => 800,  'category' => 'stove'],
            ['name' => 'Asahi GS220 Single Burner',                'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 425,  'price' => 500,  'category' => 'stove'],

            // Accessories — Hoses
            ['name' => 'LPG Hose Clip',                            'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 68,   'price' => 80,   'category' => 'accessories'],
            ['name' => 'LPG Hose 1m',                              'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 255,  'price' => 300,  'category' => 'accessories'],
            ['name' => 'LPG Hose 1.5m',                            'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 340,  'price' => 400,  'category' => 'accessories'],
            ['name' => 'LPG Hose 2m',                              'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 425,  'price' => 500,  'category' => 'accessories'],

            // Accessories — Regulators
            ['name' => 'All Brands Pol Valve Regulator',           'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 510,  'price' => 600,  'category' => 'accessories'],
            ['name' => 'Phoenix Compact Regulator',                'supplier' => 'CYBS Marketing',                               'supplier_cost' => 510,  'price' => 600,  'category' => 'accessories'],
            ['name' => 'Petron Gasul Snap On Regulator',           'supplier' => 'Cotabato Roma Enterprises',                    'supplier_cost' => 510,  'price' => 600,  'category' => 'accessories'],
            ['name' => 'Solane AS Regulator',                      'supplier' => 'Towngas LPG Trading',                          'supplier_cost' => 510,  'price' => 600,  'category' => 'accessories'],
            ['name' => 'Universal High Pressure Regulator',        'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 595,  'price' => 700,  'category' => 'accessories'],
            ['name' => 'Low Pressure Single Stage Regulator',      'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 425,  'price' => 500,  'category' => 'accessories'],

            // Accessories — Safety & Misc
            ['name' => 'LPG Gas Leak Detector',                    'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 680,  'price' => 800,  'category' => 'accessories'],
            ['name' => 'LPG Cylinder Safety Cap',                  'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 34,   'price' => 40,   'category' => 'accessories'],
            ['name' => 'Cylinder Trolley / Cart',                  'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 1275, 'price' => 1500, 'category' => 'accessories'],
        ];

        $usedSkus = [];

        foreach ($seedItems as $item) {
            $supplierId = $supplierMap[$item['supplier']] ?? null;
            if (!$supplierId) {
                throw new \Exception("Supplier not found: {$item['supplier']}");
            }

            [$sizeValue, $sizeUnit, $variantName] = $this->extractSize($item['name']);
            $sku = $this->makeSku($item['name'], $usedSkus);

            $product = Product::create([
                'sku'           => $sku,
                'name'          => $item['name'],
                'category'      => $item['category'],
                'supplier_id'   => $supplierId,
                'supplier_cost' => $item['supplier_cost'],
                'price'         => $item['price'],
                'is_active'     => true,
            ]);

            ProductVariant::create([
                'product_id'     => $product->id,
                'variant_name'   => $variantName,
                'size_value'     => $sizeValue,
                'size_unit'      => $sizeUnit,
                'container_type' => $item['category'],
                'is_active'      => true,
            ]);
        }

        $this->command->info('SupplierProductResetSeeder: ' . count($seedSuppliers) . ' suppliers and ' . count($seedItems) . ' products created.');
    }

    private function extractSize(string $name): array
    {
        if (preg_match('/(\d+(?:\.\d+)?)\s*kg/i', $name, $matches)) {
            $value       = (float) $matches[1];
            $variantName = rtrim(rtrim($matches[1], '0'), '.') . 'kg';
            return [$value, 'kg', $variantName];
        }
        return [null, null, 'Standard'];
    }

    private function makeSku(string $name, array &$usedSkus): string
    {
        $base    = strtoupper(preg_replace('/[^A-Z0-9]+/i', '-', $name));
        $base    = trim($base, '-');
        $base    = substr($base, 0, 90);
        $sku     = $base;
        $counter = 2;

        while (in_array($sku, $usedSkus, true)) {
            $suffix = '-' . $counter;
            $sku    = substr($base, 0, 90 - strlen($suffix)) . $suffix;
            $counter++;
        }

        $usedSkus[] = $sku;
        return $sku;
    }
}