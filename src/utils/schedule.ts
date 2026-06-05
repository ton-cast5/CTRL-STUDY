export interface ParsedSchedule {
  date?: string;
  time?: string;
  modality?: 'Presencial' | 'En línea';
}

export function parseScheduleFromNote(note: string): ParsedSchedule {
  const dateMatch = note.match(/Fecha preferida:\s*(\d{4}-\d{2}-\d{2})/i);
  const timeMatch = note.match(/Hora:\s*([^·]+)/i);
  const modMatch = note.match(/Modalidad:\s*(Presencial|En línea)/i);

  return {
    date: dateMatch?.[1],
    time: timeMatch?.[1]?.trim(),
    modality: modMatch?.[1] as ParsedSchedule['modality'],
  };
}

export function defaultScheduleDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split('T')[0];
}

export function defaultScheduleTime(): string {
  return '10:00';
}

export function formatTimeLabel(time24: string): string {
  const min = parseTimeToMinutes(time24);
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function parseTimeToMinutes(time: string): number {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 10 * 60;
  let h = parseInt(match[1], 10);
  const mi = parseInt(match[2], 10);
  if (/pm/i.test(time) && h < 12) h += 12;
  if (/am/i.test(time) && h === 12) h = 0;
  return h * 60 + mi;
}
