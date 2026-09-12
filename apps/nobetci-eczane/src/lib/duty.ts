import type { DutyShift, Pharmacy } from '@/services/types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const DEFAULT_SHIFT_START = '18:30';
export const DEFAULT_SHIFT_END = '08:30';

export function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  );
}

export function isValidTimeString(value: string): boolean {
  return TIME_PATTERN.test(value);
}

/** `Date` nesnesini yerel saate göre `YYYY-MM-DD` biçimine çevirir. */
export function toDateString(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseShiftBounds(shift: DutyShift): { start: Date; end: Date } | null {
  if (
    !isValidDateString(shift.date) ||
    !isValidTimeString(shift.startTime) ||
    !isValidTimeString(shift.endTime)
  ) {
    return null;
  }

  const [year, month, day] = shift.date.split('-').map(Number);
  const [startHour, startMinute] = shift.startTime.split(':').map(Number);
  const [endHour, endMinute] = shift.endTime.split(':').map(Number);

  const start = new Date(year, month - 1, day, startHour, startMinute, 0, 0);
  const end = new Date(year, month - 1, day, endHour, endMinute, 0, 0);

  // Bitiş saati başlangıçtan sonra gelmiyorsa vardiya ertesi güne sarkıyordur.
  if (end.getTime() <= start.getTime()) {
    end.setDate(end.getDate() + 1);
  }

  return { start, end };
}

/** Verilen anda vardiyanın sürüp sürmediğini söyler. */
export function isShiftActiveAt(shift: DutyShift, now: Date): boolean {
  const bounds = parseShiftBounds(shift);
  if (!bounds) {
    return false;
  }
  const time = now.getTime();
  return time >= bounds.start.getTime() && time < bounds.end.getTime();
}

/** Eczanenin verilen anda nöbetçi olup olmadığını söyler. */
export function isOnDutyAt(pharmacy: Pharmacy, now: Date = new Date()): boolean {
  return pharmacy.duties.some((shift) => isShiftActiveAt(shift, now));
}

/** Verilen andan sonra başlayacak ilk vardiyayı döndürür. */
export function nextShiftAfter(pharmacy: Pharmacy, now: Date = new Date()): DutyShift | null {
  const upcoming = pharmacy.duties
    .map((shift) => ({ shift, bounds: parseShiftBounds(shift) }))
    .filter((entry): entry is { shift: DutyShift; bounds: { start: Date; end: Date } } =>
      entry.bounds !== null && entry.bounds.start.getTime() > now.getTime()
    )
    .sort((a, b) => a.bounds.start.getTime() - b.bounds.start.getTime());

  return upcoming[0]?.shift ?? null;
}

/** Aktif vardiyanın bitişine kalan süreyi okunur biçimde verir. */
export function remainingDutyLabel(pharmacy: Pharmacy, now: Date = new Date()): string | null {
  const active = pharmacy.duties
    .map(parseShiftBounds)
    .filter((bounds): bounds is { start: Date; end: Date } => bounds !== null)
    .find((bounds) => now.getTime() >= bounds.start.getTime() && now.getTime() < bounds.end.getTime());

  if (!active) {
    return null;
  }

  const totalMinutes = Math.round((active.end.getTime() - now.getTime()) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} dk sonra bitiyor`;
  }
  if (minutes === 0) {
    return `${hours} saat sonra bitiyor`;
  }
  return `${hours} sa ${minutes} dk sonra bitiyor`;
}

/** Vardiyayı `12 Eylül · 18:30 - 08:30` biçiminde yazar. */
export function formatShift(shift: DutyShift): string {
  const bounds = parseShiftBounds(shift);
  if (!bounds) {
    return `${shift.date} · ${shift.startTime} - ${shift.endTime}`;
  }
  const day = bounds.start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  return `${day} · ${shift.startTime} - ${shift.endTime}`;
}

/** Aynı güne ait vardiyaları teke indirir ve tarihe göre sıralar. */
export function normalizeShifts(shifts: DutyShift[]): DutyShift[] {
  const byDate = new Map<string, DutyShift>();
  for (const shift of shifts) {
    byDate.set(shift.date, shift);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Bugünden önce sona ermiş vardiyaları temizler. */
export function dropPastShifts(shifts: DutyShift[], now: Date = new Date()): DutyShift[] {
  return shifts.filter((shift) => {
    const bounds = parseShiftBounds(shift);
    return bounds ? bounds.end.getTime() > now.getTime() : false;
  });
}
