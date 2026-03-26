<?php

namespace App\Http\Controllers;

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

        if (!$delivery->canAccessProof($request->user())) {
            abort(403);
        }

        $disk = $delivery->proofStorageDisk($kind);
        $path = $delivery->proofStoragePath($kind);

        if (!$disk || !$path || !Storage::disk($disk)->exists($path)) {
            abort(404);
        }

        return Storage::disk($disk)->response($path, null, [
            'Cache-Control' => 'private, no-store, max-age=0',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Disposition' => 'inline; filename="' . basename($path) . '"',
        ]);
    }
}
