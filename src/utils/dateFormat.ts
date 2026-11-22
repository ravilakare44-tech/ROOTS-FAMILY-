import type { DatePrecision, Person } from '../shared/types.ts';

export function formatSingleDate(dateStr?: string, precision: DatePrecision = 'unknown'): string {
  if (precision === 'unknown' || !dateStr || !dateStr.trim()) {
    return precision === 'unknown' ? 'Unknown' : '';
  }

  const trimmed = dateStr.trim();
  if (precision === 'year_only') {
    const yearMatch = trimmed.match(/\b(\d{4})\b/);
    return yearMatch ? yearMatch[1] : trimmed;
  }

  if (precision === 'approximate') {
    const yearMatch = trimmed.match(/\b(\d{4})\b/);
    if (yearMatch && trimmed.length === 4) {
      return `c. ${yearMatch[1]}`;
    }
    return `c. ${formatReadableDate(trimmed)}`;
  }

  return formatReadableDate(trimmed);
}

function formatReadableDate(raw: string): string {
  if (/^\d{4}$/.test(raw)) return raw;
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const monthIdx = Number(m) - 1;
    const dayNum = Number(d);
    if (monthIdx >= 0 && monthIdx < 12 && dayNum >= 1 && dayNum <= 31) {
      return `${dayNum} ${months[monthIdx]} ${y}`;
    }
  }
  return raw;
}

export function formatLifeSpan(person: Person): string {
  const birth =
    person.birthDatePrecision === 'unknown' && !person.birthDate
      ? ''
      : formatSingleDate(person.birthDate, person.birthDatePrecision);

  const death =
    person.deathDatePrecision === 'unknown' && !person.deathDate
      ? ''
      : formatSingleDate(person.deathDate, person.deathDatePrecision);

  if (birth && death) {
    return `${birth} – ${death}`;
  }
  if (birth) {
    return `b. ${birth}`;
  }
  if (death) {
    return `d. ${death}`;
  }
  if (person.birthDatePrecision === 'unknown' && person.deathDatePrecision === 'unknown') {
    return 'Dates unknown';
  }
  return '';
}

export function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
