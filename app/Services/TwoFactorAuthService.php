<?php

namespace App\Services;

use App\Models\User;

class TwoFactorAuthService
{
    private const TOTP_PERIOD = 30;
    private const TOTP_DIGITS = 6;
    private const SECRET_LENGTH = 20;

    public function generateSecret(): string
    {
        return $this->base32Encode(random_bytes(self::SECRET_LENGTH));
    }

    public function provisioningUri(User $user, string $secret): string
    {
        $issuer = rawurlencode((string) config('app.name', 'Pietyl'));
        $label = rawurlencode(sprintf('%s:%s', config('app.name', 'Pietyl'), $user->email));

        return sprintf(
            'otpauth://totp/%s?secret=%s&issuer=%s&algorithm=SHA1&digits=%d&period=%d',
            $label,
            $secret,
            $issuer,
            self::TOTP_DIGITS,
            self::TOTP_PERIOD
        );
    }

    public function verifyCode(string $secret, string $code, int $window = 1): bool
    {
        $normalizedCode = preg_replace('/\D+/', '', $code) ?? '';
        if (strlen($normalizedCode) !== self::TOTP_DIGITS) {
            return false;
        }

        $counter = (int) floor(time() / self::TOTP_PERIOD);

        for ($offset = -$window; $offset <= $window; $offset++) {
            if (hash_equals($this->totp($secret, $counter + $offset), $normalizedCode)) {
                return true;
            }
        }

        return false;
    }

    public function maskSecret(string $secret): string
    {
        return trim(chunk_split($secret, 4, ' '));
    }

    private function totp(string $secret, int $counter): string
    {
        $binarySecret = $this->base32Decode($secret);
        $binaryCounter = pack('N*', 0) . pack('N*', $counter);
        $hash = hash_hmac('sha1', $binaryCounter, $binarySecret, true);
        $offset = ord(substr($hash, -1)) & 0x0F;
        $segment = substr($hash, $offset, 4);
        $value = unpack('N', $segment)[1] & 0x7FFFFFFF;

        return str_pad((string) ($value % (10 ** self::TOTP_DIGITS)), self::TOTP_DIGITS, '0', STR_PAD_LEFT);
    }

    private function base32Encode(string $bytes): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $bits = '';

        foreach (str_split($bytes) as $char) {
            $bits .= str_pad(decbin(ord($char)), 8, '0', STR_PAD_LEFT);
        }

        $chunks = str_split($bits, 5);
        $encoded = '';

        foreach ($chunks as $chunk) {
            if (strlen($chunk) < 5) {
                $chunk = str_pad($chunk, 5, '0', STR_PAD_RIGHT);
            }

            $encoded .= $alphabet[bindec($chunk)];
        }

        return $encoded;
    }

    private function base32Decode(string $secret): string
    {
        $alphabet = array_flip(str_split('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'));
        $secret = strtoupper(preg_replace('/[^A-Z2-7]/', '', $secret) ?? '');
        $bits = '';

        foreach (str_split($secret) as $char) {
            if (!isset($alphabet[$char])) {
                continue;
            }

            $bits .= str_pad(decbin($alphabet[$char]), 5, '0', STR_PAD_LEFT);
        }

        $bytes = '';
        foreach (str_split($bits, 8) as $chunk) {
            if (strlen($chunk) === 8) {
                $bytes .= chr(bindec($chunk));
            }
        }

        return $bytes;
    }
}
