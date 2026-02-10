<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: "Inter", "Segoe UI", system-ui, sans-serif;
            font-size: 12px;
            color: #0f172a;
            line-height: 1.4;
            margin: 24px;
        }

        h1 {
            font-size: 20px;
            margin-bottom: 6px;
        }

        .meta {
            font-size: 11px;
            color: #475569;
            margin-bottom: 8px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            font-size: 11px;
        }

        th,
        td {
            border: 1px solid #e2e8f0;
            padding: 6px 8px;
            text-align: left;
        }

        thead th {
            background: #e2e8f0;
            font-weight: 700;
            text-transform: uppercase;
        }

        .text-right {
            text-align: right;
        }
    </style>
</head>
<body>
    @php
        $typeLabel = strtoupper($reportType ?? 'sales');
        $rangeLabel = ($from?->toDateString() ?? '') . ' to ' . ($to?->toDateString() ?? '');
        $metrics = [];
        $transactionHeaders = [];
        $transactionRows = $transactions ?? [];

        if (($reportType ?? '') === 'sales') {
            $metrics = [
                ['Total sales', $payload['total_sales'] ?? 0],
                ['Total net sales', $payload['total_net_sales'] ?? 0],
                ['Total VAT', $payload['total_vat'] ?? 0],
                ['Total cash', $payload['total_cash'] ?? 0],
                ['Total non cash', $payload['total_non_cash'] ?? 0],
                ['COGS', $payload['cogs'] ?? 0],
                ['Gross profit', $payload['gross_profit'] ?? 0],
                ['Inventory valuation', $payload['inventory_valuation'] ?? 0],
            ];
            $transactionHeaders = ['Sale #', 'Date/Time', 'Customer', 'Cashier', 'Items', 'Qty', 'Cash', 'Non Cash', 'Net', 'VAT', 'Gross'];
        } elseif (($reportType ?? '') === 'remittances') {
            $metrics = [
                ['Total remitted', $payload['total_remitted'] ?? 0],
                ['Variance total', $payload['variance_total'] ?? 0],
            ];
            $transactionHeaders = ['Business Date', 'Cashier', 'Expected Total', 'Expected Cash', 'Expected Non Cash', 'Remitted', 'Variance', 'Status', 'Recorded At', 'Accountant'];
        } else {
            $metrics = [
                ['Variance total', $payload['variance_total'] ?? 0],
            ];
            $transactionHeaders = ['Business Date', 'Cashier', 'Expected Total', 'Expected Cash', 'Expected Non Cash', 'Remitted', 'Variance', 'Status', 'Recorded At', 'Accountant'];
        }
    @endphp

    <h1>Accounting report</h1>
    <div class="meta">Type: {{ $typeLabel }}</div>
    <div class="meta">Range: {{ $rangeLabel }}</div>

    <table>
        <thead>
            <tr>
                <th>Metric</th>
                <th class="text-right">Value</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($metrics as $metric)
                <tr>
                    <td>{{ $metric[0] }}</td>
                    <td class="text-right">{{ number_format((float) $metric[1], 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @if (!empty($transactionRows))
        <table>
            <thead>
                <tr>
                    @foreach ($transactionHeaders as $header)
                        <th>{{ $header }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach ($transactionRows as $row)
                    @if (($reportType ?? '') === 'sales')
                        <tr>
                            <td>{{ $row['reference'] ?? '' }}</td>
                            <td>{{ $row['sale_datetime'] ?? '' }}</td>
                            <td>{{ $row['customer'] ?? '' }}</td>
                            <td>{{ $row['cashier'] ?? '' }}</td>
                            <td class="text-right">{{ number_format((float) ($row['items_count'] ?? 0), 0) }}</td>
                            <td class="text-right">{{ number_format((float) ($row['items_qty'] ?? 0), 0) }}</td>
                            <td class="text-right">{{ number_format((float) ($row['cash_amount'] ?? 0), 2) }}</td>
                            <td class="text-right">{{ number_format((float) ($row['non_cash_amount'] ?? 0), 2) }}</td>
                            <td class="text-right">{{ number_format((float) ($row['net_amount'] ?? 0), 2) }}</td>
                            <td class="text-right">{{ number_format((float) ($row['vat_amount'] ?? 0), 2) }}</td>
                            <td class="text-right">{{ number_format((float) ($row['gross_amount'] ?? 0), 2) }}</td>
                        </tr>
                    @else
                        <tr>
                            <td>{{ $row['business_date'] ?? '' }}</td>
                            <td>{{ $row['cashier'] ?? '' }}</td>
                            <td class="text-right">{{ number_format((float) ($row['expected_amount'] ?? 0), 2) }}</td>
                            <td class="text-right">{{ number_format((float) ($row['expected_cash'] ?? 0), 2) }}</td>
                            <td class="text-right">{{ number_format((float) ($row['expected_noncash_total'] ?? 0), 2) }}</td>
                            <td class="text-right">{{ number_format((float) ($row['remitted_amount'] ?? 0), 2) }}</td>
                            <td class="text-right">{{ number_format((float) ($row['variance_amount'] ?? 0), 2) }}</td>
                            <td>{{ $row['status'] ?? '' }}</td>
                            <td>{{ $row['recorded_at'] ?? '' }}</td>
                            <td>{{ $row['accountant'] ?? '' }}</td>
                        </tr>
                    @endif
                @endforeach
            </tbody>
        </table>
    @endif
</body>
</html>
