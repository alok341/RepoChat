"use client";

import { formatDistanceToNow } from "date-fns";
import { Plus, RotateCcw, MessageSquare } from "lucide-react";

import { IndexStatusBadge } from "@/components/dashboard/repo-status";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatSessions, useCreateChatSession } from "@/hooks/use-chat";
import { useStartIndexing } from "@/hooks/use-repos";
import type { Repository } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ChatSidebar({
  repo,
  sessionId,
  onSelectSession,
}: {
  repo: Repository;
  sessionId: string | null;
  onSelectSession: (id: string) => void;
}) {
  const ready = repo.indexStatus === "READY";
  const sessionsQuery = useChatSessions(repo.id, ready);
  const createSession = useCreateChatSession(repo.id);
  const reindex = useStartIndexing();

  return (
    <aside className="flex w-full flex-col border-b bg-muted/10 md:w-72 md:border-r md:border-b-0">
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <p className="truncate text-sm font-semibold tracking-tight text-foreground">
            {repo.fullName}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <IndexStatusBadge status={repo.indexStatus} />
            {repo.isPrivate && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Private
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-teal-600 shadow-sm hover:bg-teal-700"
            disabled={!ready || createSession.isPending}
            onClick={() =>
              createSession.mutate("New chat", {
                onSuccess: (session) => onSelectSession(session.id),
              })
            }
          >
            <Plus data-icon="inline-start" className="size-4" />
            New chat
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="px-3 shadow-sm"
            disabled={reindex.isPending || repo.indexStatus === "INDEXING"}
            onClick={() => reindex.mutate(repo.id)}
            aria-label="Re-index repository"
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>

      <Separator className="opacity-50" />

      <div className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Recent Sessions
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 px-3 pb-6">
          {!ready && (
            <p className="px-2 text-xs text-muted-foreground">
              Sessions unlock after indexing completes.
            </p>
          )}

          {sessionsQuery.isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}

          {sessionsQuery.data?.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => onSelectSession(session.id)}
              className={cn(
                "group flex w-full flex-col gap-1 rounded-xl px-3 py-3 text-left transition-all hover:bg-muted/80",
                sessionId === session.id && "bg-muted shadow-sm"
              )}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className={cn("size-3.5", sessionId === session.id ? "text-teal-500" : "text-muted-foreground")} />
                <p className="truncate text-sm font-medium">{session.title}</p>
              </div>
              <p className="pl-5 text-[11px] text-muted-foreground">
                {formatDistanceToNow(new Date(session.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </button>
          ))}

          {ready && sessionsQuery.isSuccess && sessionsQuery.data.length === 0 && (
            <p className="px-2 text-xs text-muted-foreground">
              No chats yet. Start one above.
            </p>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}