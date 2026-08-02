"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckIcon, LoaderCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
      >
        <CheckIcon className="size-3 text-severity-pass" />
        Reviewed in {elapsedSeconds ?? 0}s — {messages.length} step
        {messages.length === 1 ? "" : "s"}
      </button>
    );
  }

  return (
    <ul className="space-y-1.5 text-sm">
      <AnimatePresence initial={false}>
        {messages.map((message, i) => {
          const isLast = i === messages.length - 1;
          const done = collapsed || !isLast;
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn("flex items-start gap-2", done ? "text-muted-foreground" : "text-foreground")}
            >
              <span className="mt-0.5 shrink-0" aria-hidden>
                {done ? (
                  <CheckIcon className="size-3.5 text-severity-pass" />
                ) : (
                  <LoaderCircleIcon className="size-3.5 animate-spin text-primary" />
                )}
              </span>
              <span>{message}</span>
            </motion.li>
          );
        })}
      </AnimatePresence>
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
