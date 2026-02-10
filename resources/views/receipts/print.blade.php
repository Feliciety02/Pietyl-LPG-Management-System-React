<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Receipt - {{ $sale['ref'] ?? '' }}</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; color: #111827; }
        .receipt { max-width: 820px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; }
        .meta { margin-top: 12px; display:flex; justify-content:space-between; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; }
        table th, table td { padding: 8px 6px; border-bottom: 1px solid #e5e7eb; }
        .totals { margin-top: 12px; display:flex; justify-content:space-between; font-weight:700; }
        .footer { text-align:center; margin-top:18px; color:#6b7280 }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <h2>PIEYTL LPG MARKETING</h2>
            <div>{{ $sale['company_address'] ?? '' }}</div>
            <div>Tel: {{ $sale['company_phone'] ?? '' }}</div>
            <div>TIN: {{ $sale['company_tin'] ?? '' }}</div>
        </div>

        <div class="meta">
            <div>Receipt No: <strong>{{ $sale['ref'] ?? '' }}</strong></div>
            <div>{{ $sale['date_label'] ?? '' }} {{ $sale['time_label'] ?? '' }}</div>
        </div>
        <div class="meta">
            <div>Payment Method: <strong>{{ strtoupper($sale['method'] ?? 'cash') }}</strong></div>
            <div></div>
        </div>
        @if(!empty($sale['payment_ref']))
            <div class="meta">
                <div>Reference No: <strong>{{ $sale['payment_ref'] }}</strong></div>
                <div></div>
            </div>
        @endif

        <table>
            <thead>
                <tr>
                    <th>Qty</th>
                    <th>Description</th>
                    <th style="text-align:right">Price</th>
                    <th style="text-align:right">Amount</th>
                </tr>
            </thead>
            <tbody>
                @if(is_array($sale['lines']) && count($sale['lines']))
                    @foreach($sale['lines'] as $line)
                        <tr>
                            <td>{{ $line['qty'] }}</td>
                            <td>{{ $line['name'] }}{{ $line['variant'] ? ' · '.$line['variant'] : '' }}</td>
                            <td style="text-align:right">₱{{ number_format($line['unit_price'] ?? 0,2) }}</td>
                            <td style="text-align:right">₱{{ number_format(($line['unit_price'] ?? 0) * ($line['qty'] ?? 0),2) }}</td>
                        </tr>
                    @endforeach
                @else
                    <tr><td colspan="4">No items</td></tr>
                @endif
            </tbody>
        </table>

        <div class="totals">
            <div>
                <div>VAT: ₱{{ number_format($sale['vat_amount'] ?? 0,2) }}</div>
                <div>Net: ₱{{ number_format($sale['net_amount'] ?? 0,2) }}</div>
            </div>
            <div>
                <div>Total</div>
                <div>₱{{ number_format($sale['gross_amount'] ?? 0,2) }}</div>
            </div>
        </div>

        <div class="footer">
            Thank you for your purchase!<br />For inquiries, call {{ $sale['company_phone'] ?? '' }}
        </div>
    </div>
</body>
</html>
