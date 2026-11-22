import type { Person } from './types.ts';

export interface DuplicateCandidate {
  person: Person;
  reason: string;
  score: number;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractYear(dateStr?: string): string | null {
  if (!dateStr) return null;
  const match = dateStr.match(/\b(1[6-9]\d{2}|20\d{2})\b/);
  return match ? match[1] : null;
}

export function findPossibleDuplicates(
  candidate: {
    fullName: string;
    alternateName?: string;
    birthDate?: string;
    excludePersonId?: string;
  },
  existingPeople: Person[]
): DuplicateCandidate[] {
  const targetName = normalizeName(candidate.fullName);
  if (!targetName) return [];

  const targetTokens = new Set(targetName.split(' ').filter((t) => t.length > 1));
  const targetAlt = candidate.alternateName ? normalizeName(candidate.alternateName) : '';
  const targetYear = extractYear(candidate.birthDate);

  const matches: DuplicateCandidate[] = [];

  for (const person of existingPeople) {
    if (candidate.excludePersonId && person.id === candidate.excludePersonId) continue;

    const pName = normalizeName(person.fullName);
    const pAlt = person.alternateName ? normalizeName(person.alternateName) : '';
    const pYear = extractYear(person.birthDate);

    let score = 0;
    const reasons: string[] = [];

    if (pName === targetName) {
      score += 0.85;
      reasons.push('Exact name match');
    } else if (targetAlt && (pName === targetAlt || pAlt === targetAlt || pAlt === targetName)) {
      score += 0.75;
      reasons.push('Matches alternate/maiden name');
    } else {
      const pTokens = new Set(pName.split(' ').filter((t) => t.length > 1));
      let shared = 0;
      for (const token of targetTokens) {
        if (pTokens.has(token)) shared++;
      }
      const unionSize = new Set([...targetTokens, ...pTokens]).size;
      const jaccard = unionSize > 0 ? shared / unionSize : 0;
      if (jaccard >= 0.5 && shared >= 1) {
        score += jaccard * 0.7;
        reasons.push('Similar name');
      }
    }

    if (targetYear && pYear && targetYear === pYear && score > 0) {
      score += 0.2;
      reasons.push(`Same birth year (${targetYear})`);
    }

    if (score >= 0.45) {
      matches.push({
        person,
        reason: reasons.join(' · '),
        score: Math.min(1, score),
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}
