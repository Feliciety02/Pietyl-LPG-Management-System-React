<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class TestSaleExportValidation extends Command
{
    protected $signature   = 'test:sale-export-validation';
    protected $description = 'Isolation tests for SaleController@export validator rules';

    // -------------------------------------------------------------------------
    // Test matrix – mirrors the screenshot test cases exactly
    // -------------------------------------------------------------------------
    private array $cases = [
        // --- Branch Coverage ---
        [
            'id'          => 'WBT_SAL_EXP_001',
            'description' => 'from_date missing from request',
            'input'       => [
                'from_date'    => null,
                'to_date'      => '2025-02-28',
                'status_scope' => 'paid',
                'format'       => 'xlsx',
            ],
            'expect_pass' => false,
            'expect_errors' => ['from_date'],
        ],
        [
            'id'          => 'WBT_SAL_EXP_002',
            'description' => 'to_date is before from_date',
            'input'       => [
                'from_date'    => '2025-02-01',
                'to_date'      => '2025-01-01',
                'status_scope' => 'paid',
                'format'       => 'xlsx',
            ],
            'expect_pass' => false,
            'expect_errors' => ['to_date'],
        ],
        [
            'id'          => 'WBT_SAL_EXP_003',
            'description' => 'Invalid status_scope value',
            'input'       => [
                'from_date'    => '2025-01-01',
                'to_date'      => '2025-01-31',
                'status_scope' => 'cancelled',
                'format'       => 'xlsx',
            ],
            'expect_pass' => false,
            'expect_errors' => ['status_scope'],
        ],
        [
            'id'          => 'WBT_SAL_EXP_004',
            'description' => 'Invalid format value',
            'input'       => [
                'from_date'    => '2025-01-01',
                'to_date'      => '2025-01-31',
                'status_scope' => 'paid',
                'format'       => 'pdf',
            ],
            'expect_pass' => false,
            'expect_errors' => ['format'],
        ],
        [
            'id'          => 'WBT_SAL_EXP_005',
            'description' => 'Valid params; format = csv',
            'input'       => [
                'from_date'    => '2025-01-01',
                'to_date'      => '2025-01-31',
                'status_scope' => 'paid',
                'format'       => 'csv',
            ],
            'expect_pass'   => true,
            'expect_errors' => [],
        ],
        [
            'id'          => 'WBT_SAL_EXP_006',
            'description' => 'Valid params; format = xlsx',
            'input'       => [
                'from_date'    => '2025-01-01',
                'to_date'      => '2025-01-31',
                'status_scope' => 'paid',
                'format'       => 'xlsx',
            ],
            'expect_pass'   => true,
            'expect_errors' => [],
        ],
        [
            'id'          => 'WBT_SAL_EXP_007',
            'description' => 'Valid params (Excel::download throws – validator still passes)',
            'input'       => [
                'from_date'    => '2025-01-01',
                'to_date'      => '2025-01-31',
                'status_scope' => 'paid',
                'format'       => 'xlsx',
            ],
            'expect_pass'   => true,  // validator passes; downstream error is separate
            'expect_errors' => [],
        ],

        // --- Boundary Validation ---
        [
            'id'          => 'WBT_SAL_EXP_008',
            'description' => 'from_date equals to_date (after_or_equal boundary)',
            'input'       => [
                'from_date'    => '2025-01-15',
                'to_date'      => '2025-01-15',
                'status_scope' => 'paid',
                'format'       => 'xlsx',
            ],
            'expect_pass'   => true,
            'expect_errors' => [],
        ],

        // --- Extra edge cases ---
        [
            'id'          => 'WBT_SAL_EXP_009',
            'description' => 'Both dates missing',
            'input'       => [
                'from_date'    => null,
                'to_date'      => null,
                'status_scope' => 'paid',
                'format'       => 'xlsx',
            ],
            'expect_pass'   => false,
            'expect_errors' => ['from_date', 'to_date'],
        ],
        [
            'id'          => 'WBT_SAL_EXP_010',
            'description' => 'status_scope = all (valid)',
            'input'       => [
                'from_date'    => '2025-01-01',
                'to_date'      => '2025-01-31',
                'status_scope' => 'all',
                'format'       => 'xlsx',
            ],
            'expect_pass'   => true,
            'expect_errors' => [],
        ],
        [
            'id'          => 'WBT_SAL_EXP_011',
            'description' => 'status_scope = paid_pending (valid)',
            'input'       => [
                'from_date'    => '2025-01-01',
                'to_date'      => '2025-01-31',
                'status_scope' => 'paid_pending',
                'format'       => 'xlsx',
            ],
            'expect_pass'   => true,
            'expect_errors' => [],
        ],
        [
            'id'          => 'WBT_SAL_EXP_012',
            'description' => 'format field omitted (optional/sometimes)',
            'input'       => [
                'from_date'    => '2025-01-01',
                'to_date'      => '2025-01-31',
                'status_scope' => 'paid',
                // format intentionally absent
            ],
            'expect_pass'   => true,
            'expect_errors' => [],
        ],
        [
            'id'          => 'WBT_SAL_EXP_013',
            'description' => 'Invalid date format for from_date',
            'input'       => [
                'from_date'    => 'not-a-date',
                'to_date'      => '2025-01-31',
                'status_scope' => 'paid',
                'format'       => 'xlsx',
            ],
            'expect_pass'   => false,
            'expect_errors' => ['from_date'],
        ],
        [
            'id'          => 'WBT_SAL_EXP_014',
            'description' => 'include_items = true (boolean valid)',
            'input'       => [
                'from_date'     => '2025-01-01',
                'to_date'       => '2025-01-31',
                'status_scope'  => 'paid',
                'format'        => 'xlsx',
                'include_items' => true,
            ],
            'expect_pass'   => true,
            'expect_errors' => [],
        ],
        [
            'id'          => 'WBT_SAL_EXP_015',
            'description' => 'include_items = "yes" (invalid boolean)',
            'input'       => [
                'from_date'     => '2025-01-01',
                'to_date'       => '2025-01-31',
                'status_scope'  => 'paid',
                'format'        => 'xlsx',
                'include_items' => 'yes',
            ],
            'expect_pass'   => false,
            'expect_errors' => ['include_items'],
        ],
    ];

    // -------------------------------------------------------------------------
    // Validator rules – exact copy from SaleController@export
    // -------------------------------------------------------------------------
    private function makeValidator(array $data): \Illuminate\Validation\Validator
    {
        return Validator::make($data, [
            'from_date'     => ['required', 'date'],
            'to_date'       => ['required', 'date', 'after_or_equal:from_date'],
            'status_scope'  => ['required', 'in:paid,paid_pending,pending,failed,all'],
            'format'        => ['sometimes', 'in:xlsx,csv'],
            'include_items' => ['sometimes', 'boolean'],
        ]);
    }

    // -------------------------------------------------------------------------
    // Command entry point
    // -------------------------------------------------------------------------
    public function handle(): int
    {
        $this->newLine();
        $this->line('<fg=cyan;options=bold>══════════════════════════════════════════════════</>');
        $this->line('<fg=cyan;options=bold>  SaleController@export — Validator Isolation Tests</>');
        $this->line('<fg=cyan;options=bold>══════════════════════════════════════════════════</>');
        $this->newLine();

        $passed = 0;
        $failed = 0;
        $rows   = [];

        foreach ($this->cases as $case) {
            // Remove null values the same way the controller does
            $input = array_filter($case['input'], fn ($v) => $v !== null);

            $validator  = $this->makeValidator($input);
            $didFail    = $validator->fails();
            $errors     = $validator->errors()->toArray();
            $errorKeys  = array_keys($errors);

            // Determine pass/fail for this test case
            $testPassed = $this->evaluate($case, $didFail, $errorKeys);

            if ($testPassed) {
                $passed++;
                $status = '<fg=green>PASS</>';
            } else {
                $failed++;
                $status = '<fg=red>FAIL</>';
            }

            // Collect detail row for the summary table
            $rows[] = [
                $case['id'],
                $case['description'],
                $case['expect_pass'] ? 'valid' : 'invalid',
                empty($errorKeys) ? '—' : implode(', ', $errorKeys),
                $testPassed ? '✓ PASS' : '✗ FAIL',
            ];

            // Print inline result
            $this->line("  {$status}  <options=bold>{$case['id']}</> — {$case['description']}");

            if (! $testPassed) {
                $this->printFailureDetail($case, $didFail, $errorKeys, $errors);
            }
        }

        // Summary table
        $this->newLine();
        $this->table(
            ['Test Case ID', 'Description', 'Expected', 'Actual Error Fields', 'Result'],
            $rows
        );

        $this->newLine();
        $total = $passed + $failed;
        $this->line("  <fg=white;options=bold>Results: </><fg=green>{$passed} passed</> / <fg=red>{$failed} failed</> / {$total} total");
        $this->newLine();

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }

    // -------------------------------------------------------------------------
    // Evaluation logic
    // -------------------------------------------------------------------------
    private function evaluate(array $case, bool $didFail, array $errorKeys): bool
    {
        // 1. Pass/fail direction must match expectation
        if ($case['expect_pass'] && $didFail) {
            return false;
        }

        if (! $case['expect_pass'] && ! $didFail) {
            return false;
        }

        // 2. For failing cases, every expected error field must be present
        foreach ($case['expect_errors'] as $field) {
            if (! in_array($field, $errorKeys, true)) {
                return false;
            }
        }

        return true;
    }

    // -------------------------------------------------------------------------
    // Verbose failure output
    // -------------------------------------------------------------------------
    private function printFailureDetail(
        array $case,
        bool  $didFail,
        array $errorKeys,
        array $errors
    ): void {
        $this->line('       <fg=yellow>→ Input:</>  ' . json_encode($case['input']));

        if ($case['expect_pass'] && $didFail) {
            $this->line('       <fg=yellow>→ Expected validator to PASS but it FAILED.</>');
            foreach ($errors as $field => $messages) {
                $this->line("         [{$field}] " . implode(' | ', $messages));
            }
        } elseif (! $case['expect_pass'] && ! $didFail) {
            $this->line('       <fg=yellow>→ Expected validator to FAIL but it PASSED.</>');
            $this->line('         Expected error fields: ' . implode(', ', $case['expect_errors']));
        } else {
            $missing = array_diff($case['expect_errors'], $errorKeys);
            if (! empty($missing)) {
                $this->line('       <fg=yellow>→ Missing expected error fields: ' . implode(', ', $missing) . '</>');
            }
        }

        $this->newLine();
    }
}