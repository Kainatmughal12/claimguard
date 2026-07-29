interface ProgressLogProps {
  messages: string[];
}

export function ProgressLog({ messages }: ProgressLogProps) {
  if (messages.length === 0) return null;

  return (
    <ul className="space-y-1 text-sm">
      {messages.map((message, i) => (
        <li
          key={i}
          className={i === messages.length - 1 ? "text-foreground" : "text-muted-foreground"}
        >
          {message}
        </li>
      ))}
    </ul>
  );
}
