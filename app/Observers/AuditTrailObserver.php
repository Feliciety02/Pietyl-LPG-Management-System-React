<?php

namespace App\Observers;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class AuditTrailObserver
{
    public function created(Model $model): void
    {
        $this->log($model, 'create');
    }

    public function updated(Model $model): void
    {
        $changes = $model->getChanges();
        unset($changes['updated_at']);
        if (empty($changes)) {
            return;
        }

        $before = [];
        $after = [];
        foreach ($changes as $key => $value) {
            $before[$key] = $model->getOriginal($key);
            $after[$key] = $value;
        }

        $this->log($model, 'update', $before, $after);
    }

    public function deleted(Model $model): void
    {
        $this->log($model, 'delete', $model->getAttributes(), null);
    }

    public function restored(Model $model): void
    {
        $this->log($model, 'restore', null, $model->getAttributes());
    }

    private function log(Model $model, string $action, ?array $before = null, ?array $after = null): void
    {
        if (app()->runningInConsole()) {
            return;
        }

        if ($model instanceof AuditLog) {
            return;
        }

        $entityType = class_basename($model);
        $actionKey = Str::snake($entityType) . '.' . $action;

        $messageMap = [
            'create' => 'Created',
            'update' => 'Updated',
            'delete' => 'Deleted',
            'restore' => 'Restored',
        ];
        $message = ($messageMap[$action] ?? 'Updated') . " {$entityType} #{$model->getKey()}";

        $request = request();

        AuditLog::create([
            'actor_user_id' => Auth::id(),
            'action' => $actionKey,
            'entity_type' => $entityType,
            'entity_id' => $model->getKey(),
            'message' => $message,
            'before_json' => $before,
            'after_json' => $after,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);
    }
}
