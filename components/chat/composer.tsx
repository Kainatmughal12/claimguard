"use client";

import { useEffect, useRef } from "react";
import { ArrowUpIcon, SquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  busy?: boolean;
  placeholder: string;
  canSubmit: boolean;
  topSlot?: React.ReactNode;
  className?: string;
}

export function Composer({
  value,
  onChange,
  onSubmit,
  onCancel,
  disabled,
  busy,
  placeholder,
  canSubmit,
  topSlot,
  className,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) onSubmit();
    }
  }

  return (
    <div
      className={cn(
        "rounded-3xl border border-border/70 bg-card/70 p-3 shadow-lg shadow-black/20 backdrop-blur-sm transition-colors focus-within:border-primary/40",
        className,
      )}
    >
      {topSlot}
      <textarea
        id="composer-textarea"
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder={placeholder}
        aria-label={placeholder}
        className="max-h-80 w-full resize-none bg-transparent px-2 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
      />
      <div className="flex items-center justify-between px-1 pt-1">
        <p className="text-[0.7rem] text-muted-foreground">
          <kbd className="rounded border border-border/70 px-1 py-0.5 font-sans">Enter</kbd> to send ·{" "}
          <kbd className="rounded border border-border/70 px-1 py-0.5 font-sans">Shift+Enter</kbd> for a new line
        </p>
        {busy && onCancel ? (
          <Button type="button" size="icon-sm" variant="outline" onClick={onCancel} aria-label="Cancel">
            <SquareIcon className="size-3 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon-sm"
            onClick={onSubmit}
            disabled={!canSubmit}
            aria-label="Send"
            className="rounded-full bg-[image:var(--accent-gradient)] text-primary-foreground hover:opacity-90"
          >
            <ArrowUpIcon className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
