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
            margin-bottom: 4px;
        }

        .subtle {
            color: #475569;
            font-size: 11px;
            margin-bottom: 12px;
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

        .meta {
            margin-top: 16px;
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
        }

        .meta-item {
            font-size: 11px;
        }

        .totals {
            margin-top: 12px;
            font-size: 11px;
            font-weight: 700;
        }

    </style>
</head>
<body>
    <h1>Ledger export</h1>
    <div class="subtle">Filtered on: {{ $filters['sort'] }}</div>

    <div class="meta">
        @foreach (['type', 'account', 'from', 'to', 'cleared', 'bank_ref'] as $key)
            @if ($filters[$key])
                <div class="meta-item">{{ ucfirst(str_replace('_', ' ', $key)) }}: {{ $filters[$key] }}</div>
            @endif
        @endforeach
    </div>

    <table>
        <thead>
            <tr>
                <th>Posted</th>
                <th>Recorded</th>
                <th>Reference</th>
                <th>Account</th>
                <th>Description</th>
                <th class="text-right">Debit</th>
                <th class="text-right">Credit</th>
                <th class="text-right">Balance</th>
                <th class="text-right">Net</th>
                <th class="text-right">VAT</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($lines as $line)
                <tr>
                    <td>{{ optional($line->entry_date)->format('Y-m-d') }}</td>
                    <td>{{ optional($line->created_at)->format('Y-m-d H:i:s') }}</td>
                    <td>{{ $line->reference_id }}</td>
                    <td>{{ $line->account_code }} {{ $line->account_name }}</td>
                    <td>{{ $line->description }}</td>
                    <td class="text-right">{{ number_format($line->debit, 2) }}</td>
                    <td class="text-right">{{ number_format($line->credit, 2) }}</td>
                    <td class="text-right">{{ number_format($line->debit - $line->credit, 2) }}</td>
                    <td class="text-right">{{ number_format($line->sale_net_amount ?? 0, 2) }}</td>
                    <td class="text-right">{{ number_format($line->sale_vat_amount ?? 0, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        Total rows: {{ $lines->count() }}
    </div>
</body>
</html>
