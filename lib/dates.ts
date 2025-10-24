const DATE_LOCALE = "en-US";

export function getTodayIso(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

export function getPastDates(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().slice(0, 10));
  }
  return dates;
}

export function formatDateLabel(dateIso: string): string {
  const date = new Date(dateIso);
  return date.toLocaleDateString(DATE_LOCALE, {
    weekday: "short",
  });
}
