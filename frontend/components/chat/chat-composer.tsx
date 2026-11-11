"use client";

import { useState } from "react";
import { SendHorizontal, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";

export function ChatComposer({
  disabled,
  streaming,
  onSend,
  onStop,
  placeholder = "Ask about architecture, files, or flows…",
}: {
  disabled?: boolean;
  streaming?: boolean;
  onSend: (content: string) => void | Promise<void>;
  onStop?: () => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");

  async function submit() {
    const content = value.trim();
    if (!content || disabled || streaming) return;
    setValue("");
    await onSend(content);
  }

  return (
    <div className="bg-gradient-to-t from-background via-background to-transparent p-4 pb-6 shrink-0">
      <div className="mx-auto max-w-3xl space-y-3">
        <div className="relative flex items-end gap-2 overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-2 shadow-lg backdrop-blur-md transition-all focus-within:border-teal-500/50 focus-within:ring-1 focus-within:ring-teal-500/20">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[52px] max-h-[200px] flex-1 resize-none border-0 bg-transparent px-4 py-3 text-sm shadow-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <div className="pr-1 pb-1">
            {streaming ? (
              <Button
                size="icon"
                variant="secondary"
                onClick={onStop}
                aria-label="Stop generating"
                className="size-10 rounded-xl transition-all hover:bg-destructive/10 hover:text-destructive"
              >
                <Square className="size-4 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                disabled={disabled || !value.trim()}
                onClick={() => void submit()}
                aria-label="Send message"
                className="size-10 rounded-xl bg-teal-600 text-white shadow-sm transition-all hover:bg-teal-700 disabled:bg-muted disabled:text-muted-foreground"
              >
                {disabled ? <Spinner /> : <SendHorizontal className="size-4" />}
              </Button>
            )}
          </div>
        </div>
        <p className="text-center text-[11px] font-medium text-muted-foreground/70">
          Press <Kbd className="bg-muted/50 text-[10px]">Enter</Kbd> to send · <Kbd className="bg-muted/50 text-[10px]">Shift</Kbd> + <Kbd className="bg-muted/50 text-[10px]">Enter</Kbd> for a new line
        </p>
      </div>
    </div>
  );
}