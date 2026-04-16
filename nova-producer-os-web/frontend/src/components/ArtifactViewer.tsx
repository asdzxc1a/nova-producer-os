import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { FileText, X, Copy, Check, Download } from "lucide-react";
import type { ArtifactSummary } from "../types";

interface Props {
  onClose: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = "";
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (listItems.length === 0 || !listType) return;
    const Tag = listType === "ul" ? "ul" : "ol";
    elements.push(
      <Tag key={`list-${elements.length}`} className={listType === "ol" ? "list-decimal" : "list-disc"}>
        {listItems.map((item, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
        ))}
      </Tag>
    );
    listItems = [];
    listType = null;
  };

  const renderInline = (text: string): string => {
    return text
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-cyan-400 hover:underline">$1</a>');
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`pre-${elements.length}`} className="bg-slate-950/80 p-4 rounded-lg overflow-x-auto border border-slate-800 my-4">
            <code className="text-sm font-mono text-violet-300">{codeContent}</code>
          </pre>
        );
        codeContent = "";
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += line + "\n";
      continue;
    }

    if (line.startsWith("# ")) {
      flushList();
      elements.push(<h1 key={`h1-${elements.length}`} className="markdown-content" dangerouslySetInnerHTML={{ __html: renderInline(line.slice(2)) }} />);
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      elements.push(<h2 key={`h2-${elements.length}`} className="markdown-content" dangerouslySetInnerHTML={{ __html: renderInline(line.slice(3)) }} />);
      continue;
    }
    if (line.startsWith("### ")) {
      flushList();
      elements.push(<h3 key={`h3-${elements.length}`} className="markdown-content" dangerouslySetInnerHTML={{ __html: renderInline(line.slice(4)) }} />);
      continue;
    }

    const ulMatch = line.match(/^[-*]\s+(.+)$/);
    const olMatch = line.match(/^\d+\.\s+(.+)$/);

    if (ulMatch) {
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(ulMatch[1]);
      continue;
    }

    if (olMatch) {
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listItems.push(olMatch[1]);
      continue;
    }

    if (line.trim() === "") {
      flushList();
      continue;
    }

    flushList();
    elements.push(<p key={`p-${elements.length}`} className="markdown-content" dangerouslySetInnerHTML={{ __html: renderInline(line) }} />);
  }

  flushList();
  if (inCodeBlock) {
    elements.push(
      <pre key={`pre-${elements.length}`} className="bg-slate-950/80 p-4 rounded-lg overflow-x-auto border border-slate-800 my-4">
        <code className="text-sm font-mono text-violet-300">{codeContent}</code>
      </pre>
    );
  }

  return <div className="markdown-content space-y-1">{elements}</div>;
}

export default function ArtifactViewer({ onClose }: Props) {
  const [artifacts, setArtifacts] = useState<ArtifactSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.listArtifacts().then(setArtifacts);
  }, []);

  useEffect(() => {
    if (selected) {
      api.readArtifact(selected).then(setContent);
    }
  }, [selected]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedArtifact = artifacts.find((a) => a.name === selected);

  return (
    <div className="fixed inset-0 z-50 flex animate-fadeIn">
      <div className="flex-1 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-5xl bg-slate-900/95 border-l border-slate-700/50 h-full flex flex-col shadow-2xl animate-slideInRight">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/60 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Artifacts</h2>
              <p className="text-xs text-slate-500">{artifacts.length} file{artifacts.length !== 1 ? "s" : ""} available</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-72 border-r border-slate-800/60 overflow-y-auto p-4 space-y-1 bg-slate-950/20">
            {artifacts.map((art) => (
              <button
                key={art.name}
                onClick={() => setSelected(art.name)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between group ${
                  selected === art.name
                    ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
                }`}
              >
                <span className="truncate font-medium">{art.name}</span>
                <span className="text-[10px] text-slate-600 shrink-0 ml-2">{formatSize(art.size_bytes)}</span>
              </button>
            ))}
            {artifacts.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-slate-500">No artifacts yet.</p>
                <p className="text-xs text-slate-600 mt-1">Run a pipeline stage to generate files.</p>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col min-w-0 bg-slate-900/30">
            {selected ? (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-900/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-semibold text-slate-100 truncate">{selected}</span>
                    {selectedArtifact && (
                      <span className="text-xs text-slate-500 shrink-0">{formatSize(selectedArtifact.size_bytes)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <a
                      href={`data:text/plain;charset=utf-8,${encodeURIComponent(content)}`}
                      download={selected}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-8">
                  {selected.endsWith(".json") ? (
                    <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap bg-slate-950/50 p-6 rounded-xl border border-slate-800/60">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(content), null, 2);
                        } catch {
                          return content;
                        }
                      })()}
                    </pre>
                  ) : (
                    <div className="max-w-3xl">
                      <MarkdownRenderer content={content} />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/50 text-slate-600 mb-4">
                  <FileText className="w-8 h-8" />
                </div>
                <p className="text-sm">Select an artifact to view</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
