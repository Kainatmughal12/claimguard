import Link from "next/link";
import { CompassIcon } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 min-h-0 flex-col items-center justify-center gap-3 overflow-y-auto px-6 py-10 text-center">
      <CompassIcon className="size-8 text-muted-foreground/50" />
      <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        This review or page doesn&apos;t exist, or may have been removed.
      </p>
      <Link href="/" className="text-sm text-primary underline underline-offset-2">
        Back to ClaimGuard
      </Link>
    </main>
  );
}
