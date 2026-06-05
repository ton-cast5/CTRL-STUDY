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
  return '10:00 AM';
}
