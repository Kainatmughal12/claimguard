"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  children: string;
  className?: string;
}

// Gemini's prose (agent_summary, finding text, follow-up replies) sometimes
// comes back with **bold**/lists — render it properly instead of showing the
// raw syntax. No rehype-raw, so arbitrary HTML in model output never
// executes; styling matches the app's existing type scale rather than
// pulling in @tailwindcss/typography for one component.
export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={cn("space-y-2 text-sm leading-relaxed [&>*:first-child]:mt-0", className)}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-4">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          code: ({ children }) => (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
          ),
          a: ({ children, href }) => (
            <a href={href} className="underline underline-offset-2 hover:text-foreground" target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
