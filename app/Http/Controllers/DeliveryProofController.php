<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Delivery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DeliveryProofController extends Controller
{
    public function show(Request $request, Delivery $delivery, string $kind)
    {
        if (!in_array($kind, ['photo', 'signature'], true)) {
            abort(404);
        }

        $user = $request->user();

        if (!$delivery->canAccessProof($user)) {
            AuditLog::create([
                'actor_user_id' => $user?->id,
                'action' => 'delivery.proof_access_denied',
                'entity_type' => 'Delivery',
                'entity_id' => $delivery->id,
                'message' => 'Unauthorized delivery proof access attempt.',
                'after_json' => ['kind' => $kind],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            abort(403);
        }

        $disk = $delivery->proofStorageDisk($kind);
        $path = $delivery->proofStoragePath($kind);

        if (!$disk || !$path || !Storage::disk($disk)->exists($path)) {
            AuditLog::create([
                'actor_user_id' => $user?->id,
                'action' => 'delivery.proof_missing',
                'entity_type' => 'Delivery',
                'entity_id' => $delivery->id,
                'message' => 'Delivery proof file could not be located.',
                'after_json' => ['kind' => $kind],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            abort(404);
        }

        AuditLog::create([
            'actor_user_id' => $user?->id,
            'action' => 'delivery.proof_accessed',
            'entity_type' => 'Delivery',
            'entity_id' => $delivery->id,
            'message' => 'Delivery proof accessed.',
            'after_json' => ['kind' => $kind],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return Storage::disk($disk)->response($path, null, [
            'Cache-Control' => 'private, no-store, max-age=0',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Disposition' => 'inline; filename="' . basename($path) . '"',
        ]);
    }
}
