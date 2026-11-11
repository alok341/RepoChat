"use client";

import { useState } from "react";
import { FileCode, Copy, ZoomIn, ZoomOut, RotateCcw, X } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

export function CodeViewer({ 
  path, 
  content, 
  onClose 
}: { 
  path: string; 
  content: string; 
  onClose?: () => void; 
}) {
  const [fontSize, setFontSize] = useState(14);

  const language = path.split(".").pop() ?? "text";
  // Map common extensions to valid syntax highlighter languages
  const highlighterLang = 
    language === "tsx" || language === "jsx" ? "tsx" :
    language === "ts" ? "typescript" :
    language === "js" ? "javascript" :
    language === "java" ? "java" :
    language === "py" ? "python" :
    language === "yml" ? "yaml" :
    language;

  const copyCode = () => {
    navigator.clipboard.writeText(content);
    toast.add({ title: "Copied to clipboard", type: "success" });
  };

  const zoomIn = () => setFontSize((prev) => Math.min(prev + 2, 32));
  const zoomOut = () => setFontSize((prev) => Math.max(prev - 2, 10));
  const resetZoom = () => setFontSize(14);

  return (
    <div className="flex h-full flex-col bg-[#0d1117] text-[#c9d1d9] overflow-hidden">
      
      {/* Editor Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#161b22] px-4 py-2">
        <div className="flex items-center gap-3 overflow-hidden">
          <FileCode className="size-4 text-teal-400 shrink-0" />
          <span className="truncate font-mono text-sm font-medium text-white/90">
            {path}
          </span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/60 shrink-0">
            {language}
          </span>

          {/* Close Button moved here */}
          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              title="Close file"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Zoom & Copy Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="mr-2 flex items-center rounded-md border border-white/10 bg-black/40 p-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={zoomOut}
              className="size-7 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <ZoomOut className="size-3.5" />
            </Button>
            <span className="w-8 text-center font-mono text-xs text-white/50">
              {fontSize}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={zoomIn}
              className="size-7 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <ZoomIn className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetZoom}
              className="size-7 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="size-3.5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={copyCode}
            className="h-8 gap-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
          >
            <Copy className="size-3.5" />
            Copy
          </Button>
        </div>
      </div>

      {/* Code Area with Syntax Highlighting */}
      <div className="flex-1 overflow-auto bg-[#0d1117]">
        <SyntaxHighlighter
          language={highlighterLang}
          style={vscDarkPlus}
          showLineNumbers={true}
          wrapLines={true}
          lineNumberStyle={{
            minWidth: "3em",
            paddingRight: "1em",
            color: "rgba(255,255,255,0.2)",
            textAlign: "right",
            borderRight: "1px solid rgba(255,255,255,0.05)",
            marginRight: "1em",
            fontSize: `${fontSize - 2}px`,
          }}
          customStyle={{
            margin: 0,
            padding: "1rem 0",
            background: "transparent",
            fontSize: `${fontSize}px`,
            lineHeight: `${fontSize * 1.5}px`,
          }}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}