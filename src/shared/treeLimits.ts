import type { Person, Relationship, RelationshipType } from './types.ts';

/**
 * Centralized family tree capacity limits.
 * Adjust these constants in one place to change product limits across editor, validation, and server.
 */
export const TREE_LIMITS = {
  MAX_PEOPLE_PER_TREE: 100,
  MAX_SPOUSES_PER_PERSON: 4,
  MAX_CHILDREN_PER_PERSON: 10,
  MAX_PHOTO_BYTES: 2 * 1024 * 1024, // 2 MB
  ALLOWED_IMAGE_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
};

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
}

export function checkCanAddPerson(existingPeople: Person[]): LimitCheckResult {
  if (existingPeople.length >= TREE_LIMITS.MAX_PEOPLE_PER_TREE) {
    return {
      allowed: false,
      reason: `This tree has reached the limit of ${TREE_LIMITS.MAX_PEOPLE_PER_TREE} people. Remove a person before adding another.`,
    };
  }
  return { allowed: true };
}

export function checkCanAddRelationship(
  relationships: Relationship[],
  fromPersonId: string,
  toPersonId: string,
  type: RelationshipType
): LimitCheckResult {
  if (!fromPersonId || !toPersonId) {
    return { allowed: false, reason: 'Please select both people for this relationship.' };
  }
  if (fromPersonId === toPersonId) {
    return { allowed: false, reason: 'A person cannot be linked in a relationship with themselves.' };
  }

  const alreadyExists = relationships.some(
    (rel) =>
      rel.type === type &&
      ((rel.fromPersonId === fromPersonId && rel.toPersonId === toPersonId) ||
        (type === 'spouse_partner' &&
          rel.fromPersonId === toPersonId &&
          rel.toPersonId === fromPersonId))
  );

  if (alreadyExists) {
    return {
      allowed: false,
      reason: 'This relationship already exists between these two people.',
    };
  }

  if (type === 'spouse_partner') {
    const countA = relationships.filter(
      (r) =>
        r.type === 'spouse_partner' &&
        (r.fromPersonId === fromPersonId || r.toPersonId === fromPersonId)
    ).length;
    if (countA >= TREE_LIMITS.MAX_SPOUSES_PER_PERSON) {
      return {
        allowed: false,
        reason: `Limit reached: a person can have up to ${TREE_LIMITS.MAX_SPOUSES_PER_PERSON} spouse/partner relationships in this plan.`,
      };
    }

    const countB = relationships.filter(
      (r) =>
        r.type === 'spouse_partner' &&
        (r.fromPersonId === toPersonId || r.toPersonId === toPersonId)
    ).length;
    if (countB >= TREE_LIMITS.MAX_SPOUSES_PER_PERSON) {
      return {
        allowed: false,
        reason: `Limit reached: the selected partner already has ${TREE_LIMITS.MAX_SPOUSES_PER_PERSON} spouse/partner relationships.`,
      };
    }
  }

  if (type === 'parent_child') {
    const childCount = relationships.filter(
      (r) => r.type === 'parent_child' && r.fromPersonId === fromPersonId
    ).length;
    if (childCount >= TREE_LIMITS.MAX_CHILDREN_PER_PERSON) {
      return {
        allowed: false,
        reason: `Limit reached: a parent can have up to ${TREE_LIMITS.MAX_CHILDREN_PER_PERSON} children in this plan.`,
      };
    }
  }

  return { allowed: true };
}
