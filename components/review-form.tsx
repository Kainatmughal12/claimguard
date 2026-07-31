"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Client, ContentType } from "@/lib/types";

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "social_post", label: "Social post" },
  { value: "ad_copy", label: "Ad copy" },
  { value: "blog", label: "Blog" },
  { value: "email", label: "Email" },
];

const EXAMPLE_DRAFTS: { label: string; description: string; contentType: ContentType; text: string }[] = [
  {
    label: "Clean example",
    description: "A straightforward, compliant post.",
    contentType: "social_post",
    text: "New patient special this month — book your first cleaning and exam with us today!",
  },
  {
    label: "Flagrant example",
    description: "Guarantees, unsourced stats, and absolute safety claims.",
    contentType: "ad_copy",
    text: "Guaranteed to whiten your teeth in just 3 days — 100% safe, no risk, and clinically proven! Join thousands of happy patients.",
  },
];

interface ReviewFormProps {
  clients: Client[];
  status: "idle" | "streaming" | "done" | "error";
  clientId: string | null;
  onClientIdChange: (clientId: string | null) => void;
  onSubmit: (input: { clientId: string; contentType: ContentType; originalText: string }) => void;
  onCancel: () => void;
}

export function ReviewForm({
  clients,
  status,
  clientId,
  onClientIdChange,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [text, setText] = useState("");

  const isStreaming = status === "streaming";
  const canSubmit = !isStreaming && !!clientId && !!contentType && text.trim().length > 0;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Client</label>
        <Select value={clientId} onValueChange={onClientIdChange} disabled={isStreaming}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a client">
              {(value: string | null) => {
                if (!value) return "Select a client";
                const client = clients.find((c) => c.id === value);
                return client ? `${client.name} (${client.specialty})` : value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}{" "}
                <span className="font-mono text-xs text-muted-foreground">
                  ({client.specialty})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Content type</label>
        <Select
          value={contentType}
          onValueChange={(value) => setContentType(value as ContentType)}
          disabled={isStreaming}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a content type">
              {(value: string | null) => {
                if (!value) return "Select a content type";
                return CONTENT_TYPES.find((o) => o.value === value)?.label ?? value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CONTENT_TYPES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Draft</label>
        <div className="grid grid-cols-2 gap-2">
          {EXAMPLE_DRAFTS.map((example) => (
            <Card
              key={example.label}
              size="sm"
              tabIndex={isStreaming ? -1 : 0}
              role="button"
              aria-disabled={isStreaming}
              onClick={() => {
                if (isStreaming) return;
                setText(example.text);
                setContentType(example.contentType);
              }}
              onKeyDown={(e) => {
                if (isStreaming) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setText(example.text);
                  setContentType(example.contentType);
                }
              }}
              className={cn(
                "cursor-pointer transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isStreaming && "pointer-events-none opacity-50",
              )}
            >
              <CardContent className="space-y-0.5">
                <p className="text-xs font-medium">{example.label}</p>
                <p className="text-xs text-muted-foreground">{example.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isStreaming}
          rows={10}
          placeholder="Paste the marketing copy to review…"
        />
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1"
          disabled={!canSubmit}
          onClick={() => {
            if (!clientId || !contentType) return;
            onSubmit({ clientId, contentType, originalText: text });
          }}
        >
          {isStreaming ? "Reviewing…" : "Review"}
        </Button>
        {isStreaming && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
