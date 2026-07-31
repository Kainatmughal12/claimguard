"use client";

import { useState } from "react";
import { ChevronDownIcon, UserRoundIcon, FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { CONTENT_TYPES } from "@/lib/content-types";
import type { Client, ContentType } from "@/lib/types";

function Chip({
  active,
  icon,
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button> & {
  active: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "h-8 gap-1.5 rounded-full border-border/70 bg-card/60 px-3 text-xs font-medium text-muted-foreground hover:text-foreground",
        active && "border-primary/40 bg-primary/10 text-foreground",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
      <ChevronDownIcon className="size-3.5 opacity-60" />
    </Button>
  );
}

interface ClientChipProps {
  clients: Client[];
  clientId: string | null;
  onChange: (clientId: string) => void;
  disabled?: boolean;
}

export function ClientChip({ clients, clientId, onChange, disabled }: ClientChipProps) {
  const [open, setOpen] = useState(false);
  const selected = clients.find((c) => c.id === clientId) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger disabled={disabled} render={
        <Chip active={!!selected} disabled={disabled} icon={<UserRoundIcon className="size-3.5" />}>
          {selected ? selected.name : "Choose client"}
        </Chip>
      } />
      <PopoverContent align="start" className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Search clients…" />
          <CommandList>
            <CommandEmpty>No clients found.</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.name}
                  onSelect={() => {
                    onChange(client.id);
                    setOpen(false);
                  }}
                  data-checked={client.id === clientId}
                >
                  <span>{client.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{client.specialty}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface ContentTypeChipProps {
  contentType: ContentType | null;
  onChange: (contentType: ContentType) => void;
  disabled?: boolean;
}

export function ContentTypeChip({ contentType, onChange, disabled }: ContentTypeChipProps) {
  const [open, setOpen] = useState(false);
  const selected = CONTENT_TYPES.find((o) => o.value === contentType) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger disabled={disabled} render={
        <Chip active={!!selected} disabled={disabled} icon={<FileTextIcon className="size-3.5" />}>
          {selected ? selected.label : "Content type"}
        </Chip>
      } />
      <PopoverContent align="start" className="w-56 p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {CONTENT_TYPES.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  data-checked={option.value === contentType}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
