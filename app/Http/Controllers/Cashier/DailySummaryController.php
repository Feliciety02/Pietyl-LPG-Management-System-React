<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\DailyClose;
use App\Services\DailySummaryService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DailySummaryController extends Controller
{
    public function summary(Request $request, DailySummaryService $service)
    {
        $date = $request->input('date', Carbon::now()->toDateString());
        return response()->json($service->getSummary($date));
    }

    public function finalize(Request $request, DailySummaryService $service)
    {
        $validated = $request->validate([
            'date' => 'required|date',
        ]);

        $date = $validated['date'];

        if (DailyClose::where('business_date', $date)->exists()) {
            throw ValidationException::withMessages([
                'date' => 'This business date is already finalized.',
            ]);
        }

        $summaryPayload = $service->getSummary($date);
        $summary = $summaryPayload['summary'];

        if (abs($summary['variance']) >= 0.01) {
            throw ValidationException::withMessages([
                'variance' => 'Cannot finalize while variance is not zero.',
            ]);
        }

        $user = $request->user();

        $close = DailyClose::create([
            'business_date' => $date,
            'finalized_by_user_id' => $user->id,
            'finalized_at' => now(),
        ]);

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'daily_summary.finalize',
            'entity_type' => DailyClose::class,
            'entity_id' => $close->id,
            'message' => "Finalized daily summary for {$date}",
            'after_json' => [
                'status' => 'finalized',
                'business_date' => $date,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'status' => 'finalized',
            'summary' => $summary,
        ]);
    }

    public function reopen(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
        ]);

        $date = $validated['date'];

        $close = DailyClose::where('business_date', $date)->first();
        if (!$close) {
            throw ValidationException::withMessages([
                'date' => 'Business date is not finalized.',
            ]);
        }

        $user = $request->user();
        $close->delete();

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'daily_summary.reopen',
            'entity_type' => DailyClose::class,
            'entity_id' => $close->id,
            'message' => "Reopened daily summary for {$date}",
            'after_json' => [
                'status' => 'open',
                'business_date' => $date,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['status' => 'open']);
    }
}
