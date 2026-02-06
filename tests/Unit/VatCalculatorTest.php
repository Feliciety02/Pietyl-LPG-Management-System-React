<?php

namespace Tests\Unit;

use App\Services\VatCalculator;
use PHPUnit\Framework\TestCase;

class VatCalculatorTest extends TestCase
{
    public function test_inclusive_vatable_sales(): void
    {
        $result = VatCalculator::calculate(112.00, 0.12, true, VatCalculator::TREATMENT_VATABLE);

        $this->assertEquals(112.00, $result['gross_amount']);
        $this->assertEqualsWithDelta(100.00, $result['net_amount'], 0.01);
        $this->assertEqualsWithDelta(12.00, $result['vat_amount'], 0.01);
        $this->assertEquals(0.12, $result['rate_used']);
        $this->assertTrue($result['inclusive']);
        $this->assertSame(VatCalculator::TREATMENT_VATABLE, $result['treatment']);
    }

    public function test_exclusive_vatable_sales(): void
    {
        $result = VatCalculator::calculate(100.00, 0.12, false, VatCalculator::TREATMENT_VATABLE);

        $this->assertEqualsWithDelta(100.00, $result['net_amount'], 0.01);
        $this->assertEqualsWithDelta(12.00, $result['vat_amount'], 0.01);
        $this->assertEqualsWithDelta(112.00, $result['gross_amount'], 0.01);
        $this->assertFalse($result['inclusive']);
    }

    public function test_exempt_sales(): void
    {
        $result = VatCalculator::calculate(150.00, 0.12, true, VatCalculator::TREATMENT_EXEMPT);

        $this->assertEquals(150.00, $result['gross_amount']);
        $this->assertEquals(150.00, $result['net_amount']);
        $this->assertEquals(0.00, $result['vat_amount']);
        $this->assertEquals(VatCalculator::TREATMENT_EXEMPT, $result['treatment']);
    }
}
