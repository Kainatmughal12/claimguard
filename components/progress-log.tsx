"use client";

import { useState } from "react";

interface ProgressLogProps {
  messages: string[];
  collapsed?: boolean;
  elapsedSeconds?: number;
}

export function ProgressLog({ messages, collapsed = false, elapsedSeconds }: ProgressLogProps) {
  const [expanded, setExpanded] = useState(false);

  if (messages.length === 0) return null;

  if (collapsed && !expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-left text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
      >
        Reviewed in {elapsedSeconds ?? 0}s — {messages.length} step
        {messages.length === 1 ? "" : "s"}
      </button>
    );
  }

  return (
    <ul className="space-y-1 text-sm">
      {messages.map((message, i) => {
        const isLast = i === messages.length - 1;
        const done = collapsed || !isLast;
        return (
          <li
            key={i}
            className={done ? "text-muted-foreground" : "text-foreground"}
          >
            {done && (
              <span aria-hidden className="select-none">
                ✓{" "}
              </span>
            )}
            {message}
          </li>
        );
      })}
      {collapsed && (
        <li>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            Collapse
          </button>
        </li>
      )}
    </ul>
  );
}
