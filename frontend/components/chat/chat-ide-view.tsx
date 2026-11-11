"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, FileCode, FolderTree, MessageSquare } from "lucide-react";

import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatComposer } from "@/components/chat/chat-composer";
import { FileTree } from "@/components/chat/file-tree";
import { CodeViewer } from "@/components/chat/code-viewer";
import { useChatMessages, useStreamChat } from "@/hooks/use-chat";
import { useRepository } from "@/hooks/use-repos";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type SelectedFile = { path: string; content: string };

export function ChatIDEView({ repoId, sessionId }: { repoId: string; sessionId: string }) {
  const repoQuery = useRepository(repoId);
  const messagesQuery = useChatMessages(sessionId);
  const { send, stop, streaming, streamText } = useStreamChat(sessionId);
  
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [showExplorer, setShowExplorer] = useState(false);

  if (repoQuery.isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] w-full items-center justify-center bg-background">
        <Skeleton className="h-1/2 w-1/2 rounded-3xl" />
      </div>
    );
  }

  if (repoQuery.isError || !repoQuery.data) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] w-full flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground">Repository not found.</p>
        <Button render={<Link href="/dashboard" />}>Back to Dashboard</Button>
      </div>
    );
  }

  const repo = repoQuery.data;

  const handleSend = async (content: string) => {
    if (!sessionId) return;
    await send(content, {
      currentFilePath: selectedFile?.path,
      currentFileContent: selectedFile?.content,
    });
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full flex-col bg-muted/10 overflow-hidden">
      
      {/* Top Bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/dashboard" />}
            className="-ml-2 text-muted-foreground h-8"
          >
            <ArrowLeft className="mr-1 size-4" />
            Repos
          </Button>
          <div className="h-4 w-px bg-border" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExplorer(!showExplorer)}
            className={`h-8 gap-2 ${showExplorer ? "bg-muted text-foreground" : "text-muted-foreground"}`}
          >
            <FolderTree className="size-4" />
            {showExplorer ? "Hide Explorer" : "Browse Files"}
          </Button>
          
          <span className="font-semibold text-sm ml-2">{repo.fullName}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="gap-2 h-8 text-xs"
        >
          <RefreshCw className="size-3.5" />
          Reindex
        </Button>
      </header>

      {/* Dynamic Layout Container */}
      <div 
        className={`grid flex-1 min-h-0 gap-1 p-1 transition-all duration-300 ${
          showExplorer && selectedFile 
            ? "grid-cols-[260px_1fr_400px]" 
            : showExplorer 
              ? "grid-cols-[260px_1fr]"     
              : "grid-cols-1"               
        }`}
      >
        
        {/* 1. LEFT: File Tree */}
        {showExplorer && (
          <div className="h-full rounded-lg border bg-background overflow-hidden flex flex-col shadow-sm">
            <FileTree
              repoId={repoId}
              selectedPath={selectedFile?.path}
              onSelect={(path, content) => setSelectedFile({ path, content })}
            />
          </div>
        )}

        {/* 2. MIDDLE: Code Viewer */}
        {showExplorer && selectedFile && (
          <div className="h-full rounded-lg border border-white/10 overflow-hidden flex flex-col bg-[#0d1117] shadow-lg">
            {/* Pass onClose to the CodeViewer */}
            <CodeViewer 
              path={selectedFile.path} 
              content={selectedFile.content} 
              onClose={() => setSelectedFile(null)} 
            />
          </div>
        )}

        {/* 3. RIGHT: Chat Panel */}
        <div className="h-full rounded-lg border bg-background overflow-hidden flex flex-col shadow-sm relative">
          
          {/* Context Header */}
          {selectedFile && showExplorer && (
            <div className="flex shrink-0 items-center gap-2 border-b bg-teal-500/10 px-3 py-2 text-xs">
              <span className="font-semibold text-teal-600 dark:text-teal-400">AI Context:</span>
              <span className="truncate font-mono text-muted-foreground bg-background px-1.5 py-0.5 rounded border">{selectedFile.path}</span>
            </div>
          )}

          {/* Chat History */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {messagesQuery.data?.length === 0 && !streamText && !showExplorer ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground opacity-60">
                <MessageSquare className="size-12 mb-4 opacity-50 text-teal-500" />
                <p className="text-sm font-medium text-foreground">Chat with your codebase</p>
                <p className="text-xs mt-1">Ask questions or browse files for context.</p>
                <Button 
                  variant="outline" 
                  onClick={() => setShowExplorer(true)}
                  className="mt-6 gap-2 shadow-sm border-teal-500/30 hover:bg-teal-500/10 hover:text-teal-600"
                >
                  <FolderTree className="size-4" />
                  Open File Explorer
                </Button>
              </div>
            ) : (
              <ChatMessages
                repo={repo}
                messages={messagesQuery.data ?? []}
                streamText={streamText}
                isLoading={messagesQuery.isLoading}
              />
            )}
          </div>

          {/* Composer */}
          <div className="shrink-0 mt-auto border-t bg-muted/20">
            <ChatComposer
              disabled={!sessionId}
              streaming={streaming}
              onSend={handleSend}
              onStop={stop}
              placeholder={
                selectedFile
                  ? `Ask about ${selectedFile.path.split("/").pop()}…`
                  : "Ask about this repo…"
              }
            />
          </div>
        </div>

      </div>
    </div>
  );
}