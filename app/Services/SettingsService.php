<?php

namespace App\Services;

use App\Models\CompanySetting;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;

class SettingsService
{
    private ?CompanySetting $cachedSetting = null;

    public function getSettings(): CompanySetting
    {
        if ($this->cachedSetting) {
            return $this->cachedSetting;
        }

        if (!Schema::hasTable('company_settings')) {
            $model = new CompanySetting([
                'vat_registered' => false,
                'vat_rate' => config('vat.default_rate', 0.12),
                'vat_mode' => config('vat.default_mode', 'inclusive'),
                'vat_effective_date' => null,
            ]);

            return $this->cachedSetting = $model;
        }

        $setting = CompanySetting::first();
        if (!$setting) {
            $setting = CompanySetting::create([
                'vat_registered' => false,
                'vat_rate' => config('vat.default_rate', 0.12),
                'vat_mode' => config('vat.default_mode', 'inclusive'),
            ]);
        }

        return $this->cachedSetting = $setting;
    }

    public function refreshSettings(): CompanySetting
    {
        $this->cachedSetting = null;
        return $this->getSettings();
    }

    public function updateSettings(array $payload): CompanySetting
    {
        $setting = $this->getSettings();

        if (!Schema::hasTable('company_settings')) {
            return $setting;
        }

        if (!Schema::hasTable('company_settings')) {
            return $setting;
        }

        if (array_key_exists('vat_registered', $payload)) {
            $setting->vat_registered = (bool) $payload['vat_registered'];
        }

        if (array_key_exists('vat_rate', $payload)) {
            $setting->vat_rate = (float) $payload['vat_rate'];
        }

        if (array_key_exists('vat_effective_date', $payload)) {
            $setting->vat_effective_date = $payload['vat_effective_date'] ? Carbon::parse($payload['vat_effective_date'])->toDateString() : null;
        }

        if (array_key_exists('vat_mode', $payload)) {
            $setting->vat_mode = $payload['vat_mode'];
        }

        if (array_key_exists('manager_pin', $payload)) {
            $pin = trim((string) ($payload['manager_pin'] ?? ''));
            $setting->manager_pin_hash = $pin !== '' ? Hash::make($pin) : null;
        }

        if (!empty($payload['clear_manager_pin'])) {
            $setting->manager_pin_hash = null;
        }

        $setting->save();
        $this->cachedSetting = $setting;

        return $setting;
    }

    public function isVatRegistered(): bool
    {
        return $this->getSettings()->vat_registered;
    }

    public function isVatActiveForDate(CarbonInterface|string|null $date = null): bool
    {
        if (!$this->isVatRegistered()) {
            return false;
        }

        $dateTime = $this->normalizeDate($date);
        $effective = $this->getSettings()->vat_effective_date;
        if (!$effective) {
            return true;
        }

        return $dateTime->toDateString() >= Carbon::parse($effective)->toDateString();
    }

    public function getVatSnapshot(CarbonInterface|string|null $date = null): array
    {
        $settings = $this->getSettings();
        $dateTime = $this->normalizeDate($date);

        return [
            'vat_registered' => $settings->vat_registered,
            'vat_rate' => (float) $settings->vat_rate,
            'vat_effective_date' => $settings->vat_effective_date?->toDateString(),
            'vat_mode' => $settings->vat_mode,
            'vat_active' => $this->isVatActiveForDate($dateTime),
        ];
    }

    public function getDiscountSnapshot(): array
    {
        $settings = $this->getSettings();
        return [
            'manager_pin_set' => !empty($settings->manager_pin_hash),
        ];
    }

    public function verifyManagerPin(?string $pin): bool
    {
        $settings = $this->getSettings();
        $hash = $settings->manager_pin_hash;
        if (!$hash || !$pin) {
            return false;
        }

        return Hash::check($pin, $hash);
    }

    private function normalizeDate(CarbonInterface|string|null $value): Carbon
    {
        if ($value instanceof CarbonInterface) {
            return Carbon::parse($value);
        }
        if (is_string($value) && $value !== '') {
            return Carbon::parse($value);
        }

        return Carbon::now();
    }
}
