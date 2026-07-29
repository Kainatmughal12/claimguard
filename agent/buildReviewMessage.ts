export type ContentType = "social_post" | "ad_copy" | "blog" | "email";

export function buildReviewMessage(params: {
  clientId: string;
  contentType: ContentType;
  text: string;
}): string {
  return `Client ID: ${params.clientId}\nContent type: ${params.contentType}\n\nReview this draft:\n\n${params.text}`;
}
