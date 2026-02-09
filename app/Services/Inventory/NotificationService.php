<?php

namespace App\Services\Inventory;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    public function notifyLowStock(int $productVariantId, string $productName, int $currentQty, int $threshold, array $adminIds): void
    {
        $admins = User::whereIn('id', $adminIds)->get();

        foreach ($admins as $admin) {
            $this->createNotification(
                user: $admin,
                type: 'low_stock',
                title: 'Low Stock Alert',
                message: "{$productName} is below reorder level. Current: {$currentQty}, Threshold: {$threshold}",
                entityType: 'InventoryBalance',
                entityId: $productVariantId,
                data: [
                    'product_name' => $productName,
                    'current_qty' => $currentQty,
                    'threshold' => $threshold,
                    'product_variant_id' => $productVariantId,
                ]
            );

            // Optionally send email
            if ($admin->email) {
                $this->sendEmailNotification($admin, 'low_stock', $productName, $currentQty, $threshold);
            }
        }
    }

    public function notifyPurchaseApprovalNeeded(int $purchaseId, string $purchaseNumber, float $amount, array $approverIds): void
    {
        $approvers = User::whereIn('id', $approverIds)->get();

        foreach ($approvers as $approver) {
            $this->createNotification(
                user: $approver,
                type: 'purchase_approval_needed',
                title: 'Purchase Order Awaiting Approval',
                message: "Purchase order {$purchaseNumber} for {$amount} is waiting for your approval",
                entityType: 'Purchase',
                entityId: $purchaseId,
                data: [
                    'purchase_number' => $purchaseNumber,
                    'amount' => $amount,
                    'purchase_id' => $purchaseId,
                ]
            );

            if ($approver->email) {
                $this->sendEmailNotification($approver, 'purchase_approval', $purchaseNumber, null, null, $amount);
            }
        }
    }

    public function notifyStockCountApprovalNeeded(int $stockCountId, string $productName, int $variance, array $adminIds): void
    {
        $admins = User::whereIn('id', $adminIds)->get();

        foreach ($admins as $admin) {
            $this->createNotification(
                user: $admin,
                type: 'stock_count_review',
                title: 'Stock Count Awaiting Review',
                message: "Physical count for {$productName} shows variance of {$variance}. Please review.",
                entityType: 'StockCount',
                entityId: $stockCountId,
                data: [
                    'product_name' => $productName,
                    'variance' => $variance,
                    'stock_count_id' => $stockCountId,
                ]
            );

            if ($admin->email) {
                $this->sendEmailNotification($admin, 'stock_count_review', $productName, null, null, null, $variance);
            }
        }
    }

    private function createNotification(
        User $user,
        string $type,
        string $title,
        string $message,
        ?string $entityType = null,
        ?int $entityId = null,
        ?array $data = null,
        string $channel = 'database'
    ): Notification {
        return Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'data' => $data,
            'channel' => $channel,
            'delivery_success' => true,
            'is_read' => false,
        ]);
    }

    private function sendEmailNotification(
        User $user,
        string $type,
        ?string $productName = null,
        ?int $currentQty = null,
        ?int $threshold = null,
        ?float $amount = null,
        ?int $variance = null
    ): void {
        try {
            $emailData = [
                'user_name' => $user->name,
                'type' => $type,
                'product_name' => $productName,
                'current_qty' => $currentQty,
                'threshold' => $threshold,
                'amount' => $amount,
                'variance' => $variance,
            ];

            // Send simple email notification
            // You can replace this with a proper Mailable later
            // For now, just log that we tried to send
            \Illuminate\Support\Facades\Log::info("Email notification sent to {$user->email}", $emailData);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to send email notification: " . $e->getMessage());
        }
    }

    public function getUnreadNotifications(int $userId, int $limit = 10)
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function getAllNotifications(int $userId, int $perPage = 20)
    {
        return Notification::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function markAsRead(int $notificationId): void
    {
        /** @var Notification|null $notification */
        $notification = Notification::findOrFail($notificationId);
        $notification->markAsRead();
    }

    public function markAllAsRead(int $userId): void
    {
        Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }
}
