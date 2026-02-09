<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Inventory workflow options
    |--------------------------------------------------------------------------
    |
    | Tweak behavior for the procurement lifecycle. For COD, approvals should
    | move straight to receiving and inventory will record supplier receipt
    | and payment at delivery.
    |
    */
    'require_supplier_reference' => false,
    'cod_auto_pay' => true,
];
