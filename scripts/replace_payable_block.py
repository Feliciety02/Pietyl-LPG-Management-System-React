from pathlib import Path
path = Path('app/Http/Controllers/Accountant/PayableController.php')
text = path.read_text()
start = text.index("return Inertia::render('AccountantPage/Payables', [")
end = text.index(']);', start)
new = """return Inertia::render('AccountantPage/Payables', [
            'payables' => [
                'data' => ->map(function (SupplierPayable ) {
                     = ->source;
                     =  instanceof Purchase;
                     =  ? ->items?->first() : null;
                     = ->productVariant?->product;
                     = (float) (->deductions_total ?? 0);
                     =  ? (float) (->damaged_qty ?? 0) : 0;
                     = ->damage_category;
                     = ->damage_reason;

                    return [
                        'id' => ->id,
                        'supplier_name' => ->supplier?->name,
                        'supplier_contact_name' => ->supplier?->contact_name,
                        'supplier_phone' => ->supplier?->phone,
                        'supplier_email' => ->supplier?->email,
                        'source_ref' => ->source_type === RestockRequest::class
                            ? ->source->request_number
                            : ( ? ->purchase_number : ->source_id),
                        'amount' => (float) (->net_amount ?? ->amount),
                        'gross_amount' => (float) (->gross_amount ?? 0),
                        'deductions_total' => ,
                        'status' => ->status,
                        'created_at' => ->created_at?->format('M d, Y g:i A'),
                        'source_type' => ->source_type,
                        'source_status' => ->status,
                        'damage_reduction' => round(, 2),
                        'damaged_qty' => round(, 3),
                        'purchase' =>  ? [
                            'id' => ->id,
                            'reference_no' => ->purchase_number,
                            'supplier_name' => ->supplier?->name,
                            'supplier_contact_name' => ->supplier?->contact_name,
                            'supplier_phone' => ->supplier?->phone,
                            'supplier_email' => ->supplier?->email,
                            'supplier_reference_no' => ->supplier_reference_no,
                            'delivery_reference_no' => ->delivery_reference_no,
                            'product_name' => ->name ?? '—',
                            'variant' => ->productVariant?->variant_name ?? '—',
                            'qty' => (float) (->qty ?? 0),
                            'received_qty' => (float) (->received_qty ?? 0),
                            'unit_cost' => (float) (->unit_cost ?? 0),
                            'total_cost' => (float) (->line_total ?? 0),
                            'status' => ->status,
                            'created_at' => ->created_at?->format('M d h:i A'),
                            'delivered_qty' => (float) (->delivered_qty ?? 0),
                            'damaged_qty' => ,
                            'missing_qty' => (float) (->missing_qty ?? 0),
                            'damage_category' => ,
                            'damage_reason' => ,
                            'received_at' => optional(->received_at)?->toDateTimeString(),
                        ] : null,
                    ];
                })->all(),
                'meta' => [
                    'current_page' => ->currentPage(),
                    'last_page' => ->lastPage(),
                    'from' => ->firstItem(),
                    'to' => ->lastItem(),
                    'total' => ->total(),
                    'per_page' => ->perPage(),
                ],
            ],
            'filters' => ,
            'summary' => ,
        ]);
"""
path.write_text(text[:start] + new + text[end+3:])
