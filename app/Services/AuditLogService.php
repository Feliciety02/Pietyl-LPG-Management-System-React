<?php

namespace App\Services;

use App\Repositories\AuditLogRepository;

class AuditLogService
{
    protected AuditLogRepository $repo;

    public function __construct(AuditLogRepository $repo)
    {
        $this->repo = $repo;
    }

    public function getAuditLogsForPage(array $filters = []): array
    {
        $logsPaginated = $this->repo->getPaginated($filters);

        return [
            'data' => collect($logsPaginated->items())->map(function ($log) {
                $actor = $log->actor;
                $role = $actor?->roles?->first()?->name;

                return [
                    'id' => $log->id,
                    'created_at' => optional($log->created_at)->format('Y-m-d H:i') ?? '',
                    'actor_name' => $actor?->name,
                    'actor_role' => $role,
                    'event' => $log->action,
                    'entity_type' => $log->entity_type,
                    'entity_id' => $log->entity_id,
                    'message' => $log->message,
                    'ip_address' => $log->ip_address,
                    'user_agent' => $log->user_agent,
                ];
            }),
            'meta' => [
                'current_page' => $logsPaginated->currentPage(),
                'last_page' => $logsPaginated->lastPage(),
                'from' => $logsPaginated->firstItem(),
                'to' => $logsPaginated->lastItem(),
                'total' => $logsPaginated->total(),
                'per_page' => $logsPaginated->perPage(),
            ],
        ];
    }
}
