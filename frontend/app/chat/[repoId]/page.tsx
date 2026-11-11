"use client";
export const dynamic = "force-dynamic";
import { use } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ChatIDEView } from "@/components/chat/chat-ide-view";
import { IndexingState } from "@/components/chat/indexing-state"; // 👈 Import the indexing UI
import { useChatSessions, useCreateChatSession } from "@/hooks/use-chat";
import { useRepository, useIndexStatus } from "@/hooks/use-repos";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ChatPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = use(params);
  
  // 1. Get repo data
  const repoQuery = useRepository(repoId);
  
  // 2. Check if it's currently indexing
  const isIndexing = repoQuery.data?.indexStatus === "INDEXING";
  const statusQuery = useIndexStatus(
    repoId,
    isIndexing || repoQuery.data?.indexStatus === "PENDING"
  );

  const indexStatus = statusQuery.data?.indexStatus ?? repoQuery.data?.indexStatus;
  const ready = indexStatus === "READY";

  // 3. Only fetch/create sessions if the repo is READY
  const sessionsQuery = useChatSessions(repoId, ready);
  const createSession = useCreateChatSession(repoId);
  const sessionId = sessionsQuery.data?.[0]?.id;

  // Auto-create a session if one doesn't exist and the repo is ready
  if (ready && sessionsQuery.isSuccess && sessionsQuery.data.length === 0 && !createSession.isPending) {
    createSession.mutate(undefined);
  }

  // Loading states
  if (repoQuery.isLoading) {
    return (
      <AppShell title="Loading...">
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
          <Skeleton className="h-1/2 w-1/2 rounded-3xl" />
        </div>
      </AppShell>
    );
  }

  if (repoQuery.isError || !repoQuery.data) {
    return (
      <AppShell title="Repository unavailable">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
          <p className="text-sm text-muted-foreground">
            {(repoQuery.error as Error)?.message ?? "Repository not found"}
          </p>
          <Button render={<Link href="/dashboard" />}>Back to dashboard</Button>
        </div>
      </AppShell>
    );
  }

  const repo = repoQuery.data;

  // 4. Show the Indexing Screen if it's not ready yet
  if (!ready) {
    return (
      <AppShell
        title={repo.fullName}
        description="Waiting for indexing to finish"
        actions={
          <Button variant="outline" size="sm" render={<Link href="/dashboard" />}>
            <ArrowLeft className="mr-1 size-4" /> Repos
          </Button>
        }
      >
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-background">
          <IndexingState repo={repo} status={statusQuery.data} />
        </div>
      </AppShell>
    );
  }

  // 5. If ready, but session is still loading
  if (!sessionId) {
    return (
      <AppShell title={repo.fullName}>
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Creating chat session...</p>
        </div>
      </AppShell>
    );
  }

  // 6. Render the IDE
  return (
    <AppShell hideHeader>
      <ChatIDEView repoId={repoId} sessionId={sessionId} />
    </AppShell>
  );
}