"use client";

import { Bot, UserRound, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { CitationChips } from "@/components/chat/citation-chips";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
} from "@/components/ui/message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage, Repository } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ChatMessages({
  repo,
  messages,
  streamText,
  isLoading,
}: {
  repo: Repository;
  messages: ChatMessage[];
  streamText?: string;
  isLoading?: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex gap-4">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-20 w-2/3 rounded-2xl rounded-tl-sm" />
        </div>
        <div className="flex flex-row-reverse gap-4">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-12 w-1/2 rounded-2xl rounded-tr-sm" />
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
        {messages.length === 0 && !streamText && (
          <div className="mx-auto mt-12 flex max-w-md flex-col items-center gap-3 rounded-3xl border border-dashed bg-muted/20 px-8 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-500">
              <Sparkles className="size-6" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Ask anything about this codebase</p>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Try “Where is authentication handled?” or “Explain the repository indexing flow.”
              </p>
            </div>
          </div>
        )}

        <MessageGroup>
          {messages.map((message) => {
            const isUser = message.role === "USER";
            return (
              <Message key={message.id} align={isUser ? "end" : "start"}>
                <MessageAvatar>
                  <Avatar className="size-8 shadow-sm">
                    <AvatarFallback
                      className={cn(
                        "text-xs font-medium",
                        isUser
                          ? "bg-teal-500 text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isUser ? (
                        <UserRound className="size-4" />
                      ) : (
                        <Bot className="size-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                </MessageAvatar>
                <MessageContent>
                  <Bubble
                    variant={isUser ? "default" : "muted"}
                    align={isUser ? "end" : "start"}
                    className={cn(
                      "shadow-sm",
                      isUser 
                        ? "rounded-2xl rounded-tr-sm bg-teal-600 text-white dark:bg-teal-600" 
                        : "max-w-full rounded-2xl rounded-tl-sm border bg-card"
                    )}
                  >
                    <BubbleContent className={cn(!isUser && "w-full max-w-full px-5 py-4")}>
                      {isUser ? (
                        <span className="whitespace-pre-wrap">{message.content}</span>
                      ) : (
                        <ChatMarkdown content={message.content} />
                      )}
                    </BubbleContent>
                  </Bubble>
                  {!isUser && message.citations?.length > 0 && (
                    <MessageFooter className="mt-2">
                      <CitationChips repo={repo} citations={message.citations} />
                    </MessageFooter>
                  )}
                </MessageContent>
              </Message>
            );
          })}

          {streamText && (
            <Message align="start">
              <MessageAvatar>
                <Avatar className="size-8 shadow-sm">
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    <Bot className="size-4" />
                  </AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <Bubble variant="muted" align="start" className="max-w-full rounded-2xl rounded-tl-sm border bg-card shadow-sm">
                  <BubbleContent className="w-full max-w-full px-5 py-4">
                    <ChatMarkdown content={streamText} isStreaming />
                    <span className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-teal-500 align-middle" />
                  </BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
          )}
        </MessageGroup>
        <div ref={bottomRef} className="h-4" />
      </div>
    </ScrollArea>
  );
}