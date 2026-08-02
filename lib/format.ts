const RELATIVE_UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: "year", seconds: 31536000 },
  { unit: "month", seconds: 2592000 },
  { unit: "week", seconds: 604800 },
  { unit: "day", seconds: 86400 },
  { unit: "hour", seconds: 3600 },
  { unit: "minute", seconds: 60 },
];

const relativeTimeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

export function formatRelativeDate(iso: string): string {
  const diffSeconds = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const { unit, seconds } of RELATIVE_UNITS) {
    if (Math.abs(diffSeconds) >= seconds) {
      return relativeTimeFormat.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return relativeTimeFormat.format(Math.round(diffSeconds), "second");
}
