export type DatePrecision = 'exact' | 'approximate' | 'year_only' | 'unknown';

export type RelationshipType = 'parent_child' | 'spouse_partner' | 'other';

export type TreeVisualStyle =
  | 'classic'
  | 'portrait'
  | 'landscape'
  | 'green_tree'
  | 'photo_cards';

export type TreeFontFamily =
  | 'Fraunces'
  | 'Cormorant Garamond'
  | 'Playfair Display'
  | 'Lora'
  | 'Plus Jakarta Sans'
  | 'DM Sans';

export type TreeTextSize = 'small' | 'medium' | 'large';

export type CurrencyCode = 'INR' | 'USD';

export type SeatingModelId =
  | 'none'
  | 'indoor_heirloom_sofa'
  | 'indoor_teak_divan'
  | 'indoor_window_settee'
  | 'outdoor_courtyard_bench'
  | 'outdoor_porch_swing'
  | 'outdoor_banyan_stone';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface TreeDesignConfig {
  style: TreeVisualStyle;
  orientation: 'portrait' | 'landscape';
  fontFamily: TreeFontFamily;
  textSize: TreeTextSize;
  backgroundColor: string;
  lineColor: string;
  cardColor: string;
  cardTextColor: string;
  accentColor: string;
  seatingModel?: SeatingModelId;
}

export interface FamilyTree {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  isSample?: boolean;
  design: TreeDesignConfig;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  treeId: string;
  fullName: string;
  alternateName?: string;
  birthDate?: string;
  birthDatePrecision: DatePrecision;
  deathDate?: string;
  deathDatePrecision: DatePrecision;
  photoUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  id: string;
  treeId: string;
  /** For parent_child: fromPersonId is the parent, toPersonId is the child. */
  fromPersonId: string;
  toPersonId: string;
  type: RelationshipType;
  label?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InviteLink {
  id: string;
  treeId: string;
  ownerId: string;
  token: string;
  isActive: boolean;
  /** Optional safe first-name / display labels when owner chooses to share anchor names */
  shareAnchorNames: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubmittedPerson {
  tempId: string;
  fullName: string;
  alternateName?: string;
  birthDate?: string;
  birthDatePrecision: DatePrecision;
  deathDate?: string;
  deathDatePrecision: DatePrecision;
  photoUrl?: string;
  notes?: string;
  /** Optional connection to an existing person ID or another tempId in this submission */
  relationType?: RelationshipType;
  relationLabel?: string;
  relationTargetId?: string;
  relationTargetName?: string;
  /** Direction when relationType is parent_child: 'new_is_parent' or 'new_is_child' */
  relationDirection?: 'new_is_parent' | 'new_is_child';
  /** Owner review state per submitted person */
  reviewDecision?: 'pending' | 'approved' | 'rejected';
  linkToExistingPersonId?: string;
}

export interface Submission {
  id: string;
  treeId: string;
  ownerId: string;
  inviteToken: string;
  contributorName: string;
  contributorEmail?: string;
  consentConfirmed: boolean;
  status: 'pending' | 'partially_reviewed' | 'approved' | 'rejected';
  people: SubmittedPerson[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderRecord {
  id: string;
  treeId: string;
  ownerId: string;
  peopleCount: number;
  currency: CurrencyCode;
  amount: number;
  provider: 'unconfigured_demo';
  status: 'demo_preview';
  note: string;
  createdAt: string;
}

export interface TreeSnapshot {
  tree: FamilyTree;
  people: Person[];
  relationships: Relationship[];
}
