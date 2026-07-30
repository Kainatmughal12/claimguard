"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

const EXAMPLE_DRAFTS: { label: string; contentType: ContentType; text: string }[] = [
  {
    label: "Clean example",
    contentType: "social_post",
    text: "New patient special this month — book your first cleaning and exam with us today!",
  },
  {
    label: "Flagrant example",
    contentType: "ad_copy",
    text: "Guaranteed to whiten your teeth in just 3 days — 100% safe, no risk, and clinically proven! Join thousands of happy patients.",
  },
];

interface ReviewFormProps {
  clients: Client[];
  status: "idle" | "streaming" | "done" | "error";
  onSubmit: (input: { clientId: string; contentType: ContentType; originalText: string }) => void;
  onCancel: () => void;
}

export function ReviewForm({ clients, status, onSubmit, onCancel }: ReviewFormProps) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [text, setText] = useState("");

  const isStreaming = status === "streaming";
  const canSubmit = !isStreaming && !!clientId && !!contentType && text.trim().length > 0;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Client</label>
        <Select value={clientId} onValueChange={setClientId} disabled={isStreaming}>
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
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Draft</label>
          <div className="flex gap-3">
            {EXAMPLE_DRAFTS.map((example) => (
              <Button
                key={example.label}
                type="button"
                variant="link"
                size="xs"
                className="h-auto p-0 font-normal text-xs"
                disabled={isStreaming}
                onClick={() => {
                  setText(example.text);
                  setContentType(example.contentType);
                }}
              >
                {example.label}
              </Button>
            ))}
          </div>
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
