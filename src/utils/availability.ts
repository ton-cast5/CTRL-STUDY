const DAY_NUM: Record<string, number> = {
  dom: 0,
  lun: 1,
  mar: 2,
  mie: 3,
  jue: 4,
  vie: 5,
  sab: 6,
};

export interface AvailabilityWindow {
  days: number[];
  startMin: number;
  endMin: number;
}

function normalizeDayToken(token: string): string {
  return token
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 3);
}

function dayToNum(token: string): number | null {
  const key = normalizeDayToken(token);
  return DAY_NUM[key] ?? null;
}

export function parseTimeToMinutes(time: string): number {
  const cleaned = time.trim();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 9 * 60;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (/pm/i.test(cleaned) && hours < 12) hours += 12;
  if (/am/i.test(cleaned) && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export function formatMinutesToSlot(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseDaysPart(part: string): number[] {
  const tokens = part.split(/–|-/).map((t) => t.trim()).filter(Boolean);
  if (tokens.length === 0) return [1, 2, 3, 4, 5];

  if (tokens.length === 1) {
    const d = dayToNum(tokens[0]);
    return d !== null ? [d] : [1, 2, 3, 4, 5];
  }

  if (tokens.length === 2) {
    const start = dayToNum(tokens[0]);
    const end = dayToNum(tokens[1]);
    if (start === null || end === null) return [1, 2, 3, 4, 5];
    const days: number[] = [];
    for (let d = start; d <= end; d++) days.push(d);
    return days;
  }

  return tokens.map((t) => dayToNum(t)).filter((d): d is number => d !== null);
}

/** Parse strings like "Lun–Vie · 9:00–17:00" or "Mar–Jue · 10:00–16:00" */
export function parseAvailabilityWindows(availability: string): AvailabilityWindow[] {
  if (!availability.trim()) {
    return [{ days: [1, 2, 3, 4, 5], startMin: 9 * 60, endMin: 17 * 60 }];
  }

  const segments = availability.split(/·|\|/).map((s) => s.trim()).filter(Boolean);
  const windows: AvailabilityWindow[] = [];

  for (const segment of segments) {
    const timeMatch = segment.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\s*[–-]\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/i);
    if (timeMatch) {
      const daysPart = segment.replace(timeMatch[0], '').trim();
      const days = parseDaysPart(daysPart || 'Lun–Vie');
      windows.push({
        days,
        startMin: parseTimeToMinutes(timeMatch[1]),
        endMin: parseTimeToMinutes(timeMatch[2]),
      });
      continue;
    }

    if (segment.includes('–') || segment.includes('-')) {
      const parts = segment.split('·').map((p) => p.trim());
      if (parts.length >= 2) {
        windows.push({
          days: parseDaysPart(parts[0]),
          startMin: parseTimeToMinutes(parts[1].split(/–|-/)[0]),
          endMin: parseTimeToMinutes(parts[1].split(/–|-/)[1] ?? parts[1]),
        });
      }
    }
  }

  if (windows.length === 0) {
    const parts = availability.split('·').map((p) => p.trim());
    if (parts.length >= 2) {
      const times = parts[1].split(/–|-/).map((t) => t.trim());
      windows.push({
        days: parseDaysPart(parts[0]),
        startMin: parseTimeToMinutes(times[0] ?? '9:00'),
        endMin: parseTimeToMinutes(times[1] ?? '17:00'),
      });
    } else {
      windows.push({ days: [1, 2, 3, 4, 5], startMin: 9 * 60, endMin: 17 * 60 });
    }
  }

  return windows;
}

export function isDateAvailable(dateIso: string, availability: string): boolean {
  const day = new Date(dateIso + 'T12:00:00').getDay();
  const windows = parseAvailabilityWindows(availability);
  return windows.some((w) => w.days.includes(day));
}

export function getAvailableTimeSlots(
  dateIso: string,
  availability: string,
  allSlots: string[],
): string[] {
  if (!dateIso) return [];

  const day = new Date(dateIso + 'T12:00:00').getDay();
  const windows = parseAvailabilityWindows(availability).filter((w) => w.days.includes(day));
  if (windows.length === 0) return [];

  return allSlots.filter((slot) => {
    const min = parseTimeToMinutes(slot);
    return windows.some((w) => min >= w.startMin && min <= w.endMin - 30);
  });
}

export function formatAvailabilitySummary(availability: string): string {
  return availability.trim() || 'Lun–Vie · 9:00–17:00';
}

export const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function getAvailableDayLabels(availability: string): string {
  const windows = parseAvailabilityWindows(availability);
  const days = new Set<number>();
  windows.forEach((w) => w.days.forEach((d) => days.add(d)));
  return [...days].sort().map((d) => DAY_NAMES[d]).join(', ');
}
