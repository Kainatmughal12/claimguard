import type { ContentType } from "@/lib/types";

export const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "social_post", label: "Social post" },
  { value: "ad_copy", label: "Ad copy" },
  { value: "blog", label: "Blog" },
  { value: "email", label: "Email" },
];
