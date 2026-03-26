<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per', 20));

        return response()->json([
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'from' => $notifications->firstItem(),
                'to' => $notifications->lastItem(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    public function unread(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $unread = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'unread_count' => Notification::where('user_id', $user->id)
                ->where('is_read', false)
                ->count(),
            'notifications' => $unread,
        ]);
    }

    public function show(Request $request, int $id)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $notification = Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$notification) {
            $this->logNotificationFailure($request, $user->id, 'notifications.view_denied', $id);
            return response()->json(['error' => 'Notification not found'], 404);
        }

        $this->logNotificationEvent($request, $user->id, 'notifications.view', $notification);

        return response()->json($notification);
    }

    public function markAsRead(Request $request, int $id)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        try {
            /** @var Notification $notification */
            $notification = Notification::where('id', $id)
                ->where('user_id', $user->id)
                ->firstOrFail();

            $notification->markAsRead();

            $this->logNotificationEvent($request, $user->id, 'notifications.mark_read', $notification);

            return response()->json([
                'success' => true,
                'notification' => $notification,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            $this->logNotificationFailure($request, $user->id, 'notifications.mark_read_denied', $id);
            return response()->json(['error' => 'Notification not found'], 404);
        }
    }

    public function markAllAsRead(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $count = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'notifications.mark_all_read',
            'entity_type' => 'Notification',
            'entity_id' => null,
            'message' => 'All notifications marked as read.',
            'after_json' => ['affected' => $count],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'affected' => $count,
        ]);
    }

    public function delete(Request $request, int $id)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        try {
            /** @var Notification $notification */
            $notification = Notification::where('id', $id)
                ->where('user_id', $user->id)
                ->firstOrFail();

            $notification->delete();

            $this->logNotificationEvent($request, $user->id, 'notifications.delete', $notification);

            return response()->json(['success' => true]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            $this->logNotificationFailure($request, $user->id, 'notifications.delete_denied', $id);
            return response()->json(['error' => 'Notification not found'], 404);
        }
    }

    private function logNotificationEvent(Request $request, int $userId, string $action, Notification $notification): void
    {
        AuditLog::create([
            'actor_user_id' => $userId,
            'action' => $action,
            'entity_type' => 'Notification',
            'entity_id' => $notification->id,
            'message' => 'Notification action recorded.',
            'after_json' => [
                'notification_type' => $notification->type,
                'channel' => $notification->channel,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    private function logNotificationFailure(Request $request, int $userId, string $action, int $notificationId): void
    {
        AuditLog::create([
            'actor_user_id' => $userId,
            'action' => $action,
            'entity_type' => 'Notification',
            'entity_id' => $notificationId,
            'message' => 'Notification access denied or target missing.',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }
}
