"use client";

import { Suspense, use } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ChatIDEView } from "@/components/chat/chat-ide-view";
import { IndexingState } from "@/components/chat/indexing-state";
import { useChatSessions, useCreateChatSession } from "@/hooks/use-chat";
import { useRepository, useIndexStatus } from "@/hooks/use-repos";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// 1. The actual component that uses the params
function ChatPageContent({ repoId }: { repoId: string }) {
  const repoQuery = useRepository(repoId);
  
  const isIndexing = repoQuery.data?.indexStatus === "INDEXING";
  const statusQuery = useIndexStatus(
    repoId,
    isIndexing || repoQuery.data?.indexStatus === "PENDING"
  );

  const indexStatus = statusQuery.data?.indexStatus ?? repoQuery.data?.indexStatus;
  const ready = indexStatus === "READY";

  const sessionsQuery = useChatSessions(repoId, ready);
  const createSession = useCreateChatSession(repoId);
  const sessionId = sessionsQuery.data?.[0]?.id;

  if (ready && sessionsQuery.isSuccess && sessionsQuery.data.length === 0 && !createSession.isPending) {
    createSession.mutate(undefined);
  }

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

  if (!sessionId) {
    return (
      <AppShell title={repo.fullName}>
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Creating chat session...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell hideHeader>
      <ChatIDEView repoId={repoId} sessionId={sessionId} />
    </AppShell>
  );
}

// 2. The main page component wraps the content in Suspense
export default function ChatPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = use(params);

  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Skeleton className="h-1/2 w-1/2 rounded-3xl" />
      </div>
    }>
      <ChatPageContent repoId={repoId} />
    </Suspense>
  );
}