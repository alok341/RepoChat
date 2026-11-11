import { Suspense } from "react";
import ChatPageClient from "./client";
export default async function ChatPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      }
    >
      <ChatPageClient repoId={repoId} />
    </Suspense>
  );
}