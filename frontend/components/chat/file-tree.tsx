"use client";

import { useEffect, useState } from "react";
import { ChevronRight, ChevronDown, FileCode, Folder, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type TreeNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
};

// Helper to convert flat paths (src/main/App.java) into a nested tree
function buildTree(files: { path: string }[]): TreeNode[] {
  const root: TreeNode = { name: "root", path: "", type: "folder", children: [] };

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isFile = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join("/");

      let node = current.children?.find((c) => c.name === name);
      if (!node) {
        node = {
          name,
          path,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
        };
        current.children!.push(node);
      }
      if (!isFile) current = node;
    }
  }

  // Sort: folders first, then files, alphabetically
  const sortTree = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => n.children && sortTree(n.children));
  };
  if (root.children) sortTree(root.children);

  return root.children ?? [];
}

export function FileTree({
  repoId,
  selectedPath,
  onSelect,
}: {
  repoId: string;
  selectedPath?: string;
  onSelect: (path: string, content: string) => void;
}) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFile, setLoadingFile] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.getFileTree(repoId)
      .then((files) => {
        setTree(buildTree(files));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [repoId]);

  const handleFileClick = async (path: string) => {
    if (loadingFile) return;
    setLoadingFile(path);
    try {
      const { content } = await api.getFileContent(repoId, path);
      onSelect(path, content);
    } catch (err) {
      console.error("Failed to load file", err);
    } finally {
      setLoadingFile(null);
    }
  };

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const renderNode = (node: TreeNode, depth = 0) => {
    if (node.type === "file") {
      const isLoading = loadingFile === node.path;
      return (
        <button
          key={node.path}
          onClick={() => handleFileClick(node.path)}
          disabled={!!loadingFile}
          className={cn(
            "flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm transition-colors hover:bg-muted/60",
            selectedPath === node.path && "bg-teal-500/10 text-teal-600 dark:text-teal-400 font-medium"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {isLoading ? (
            <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <FileCode className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
      );
    }

    const isOpen = openFolders.has(node.path);
    return (
      <div key={node.path}>
        <button
          onClick={() => toggleFolder(node.path)}
          className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm hover:bg-muted/60"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {isOpen ? (
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          <Folder className="size-3.5 shrink-0 text-blue-500/80 fill-blue-500/20" />
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {isOpen && node.children?.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-2">
      <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Explorer
      </div>
      {tree.map((node) => renderNode(node))}
    </div>
  );
}