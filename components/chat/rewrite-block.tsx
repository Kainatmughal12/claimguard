"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, Pencil, PrinterIcon, RefreshCwIcon, MessageCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

interface RewriteBlockProps {
  text: string;
  onReplaceOriginal: (text: string) => void;
  onContinue: () => void;
}

export function RewriteBlock({ text, onReplaceOriginal, onContinue }: RewriteBlockProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [replaced, setReplaced] = useState(false);

  const currentText = editing ? draft : text;

  async function handleCopy() {
    await navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleExportPdf() {
    const printWindow = window.open("", "_blank", "width=800,height=1000");
    if (!printWindow) return;
    printWindow.document.write(
      `<html><head><title>ClaimGuard — compliant rewrite</title><style>body{font-family:ui-sans-serif,system-ui,sans-serif;white-space:pre-wrap;padding:2.5rem;line-height:1.7;max-width:640px;margin:0 auto;}</style></head><body>${escapeHtml(currentText)}</body></html>`,
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function handleReplace() {
    onReplaceOriginal(currentText);
    setReplaced(true);
  }

  return (
    <div className="overflow-hidden rounded-md border border-border/70 bg-card/70 shadow-md shadow-black/25">
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-3 py-2">
        <p className="font-mono text-xs font-medium text-muted-foreground">Compliant rewrite</p>
        <div className="flex items-center gap-1">
          <Button size="icon-xs" variant="ghost" onClick={() => setEditing((v) => !v)} aria-label="Edit">
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="ghost" onClick={handleExportPdf} aria-label="Export PDF">
            <PrinterIcon className="size-3.5" />
          </Button>
          {copied && (
            <span className="text-xs font-medium text-severity-pass" aria-live="polite">
              Copied!
            </span>
          )}
          <Button size="icon-xs" variant="ghost" onClick={handleCopy} aria-label="Copy rewrite">
            {copied ? <CheckIcon className="size-3.5 text-severity-pass" /> : <CopyIcon className="size-3.5" />}
          </Button>
        </div>
      </div>

      <div className="px-5 py-4">
        {editing ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            className="font-serif text-base leading-7"
          />
        ) : (
          <p className="max-w-[70ch] whitespace-pre-wrap font-serif text-base leading-7">{currentText}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border/70 px-3 py-2">
        <Button size="sm" variant="outline" onClick={handleReplace} disabled={replaced} className="gap-1.5">
          <RefreshCwIcon className="size-3.5" />
          {replaced ? "Replaced" : "Replace original"}
        </Button>
        <Button size="sm" variant="outline" onClick={onContinue} className="gap-1.5">
          <MessageCircleIcon className="size-3.5" />
          Continue conversation
        </Button>
      </div>
    </div>
  );
}
