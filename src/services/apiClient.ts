import type {
  CurrencyCode,
  FamilyTree,
  InviteLink,
  OrderRecord,
  Person,
  Relationship,
  Submission,
  SubmittedPerson,
  TreeDesignConfig,
  UserAccount,
} from '../shared/types.ts';

let inMemoryToken: string | null = null;

export function setAuthToken(token: string | null) {
  inMemoryToken = token;
}

export function getAuthToken(): string | null {
  return inMemoryToken;
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (inMemoryToken) {
    headers.set('Authorization', `Bearer ${inMemoryToken}`);
  }

  const res = await fetch(url, { ...options, headers });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message =
      typeof data.error === 'string' && data.error
        ? data.error
        : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export interface TreeListItem extends FamilyTree {
  peopleCount: number;
  pendingSubmissionsCount: number;
}

export interface TreeDetailResponse {
  tree: FamilyTree;
  people: Person[];
  relationships: Relationship[];
  inviteLink: InviteLink | null;
  pendingSubmissionsCount: number;
}

export const apiClient = {
  getSampleTree: () =>
    apiFetch<{
      tree: FamilyTree;
      people: Person[];
      relationships: Relationship[];
      fictional: boolean;
    }>('/api/sample-tree'),

  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: UserAccount }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    apiFetch<{ token: string; user: UserAccount }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  loginDemo: () =>
    apiFetch<{ token: string; user: UserAccount }>('/api/auth/demo', {
      method: 'POST',
    }),

  getMe: () => apiFetch<{ user: UserAccount }>('/api/auth/me'),

  listTrees: () => apiFetch<{ trees: TreeListItem[] }>('/api/trees'),

  createTree: (name: string, description?: string) =>
    apiFetch<{ tree: FamilyTree; people: Person[]; relationships: Relationship[] }>('/api/trees', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  importTree: (payload: {
    name: string;
    description?: string;
    design?: Partial<TreeDesignConfig>;
    people: Person[];
    relationships: Relationship[];
  }) =>
    apiFetch<{ tree: FamilyTree; people: Person[]; relationships: Relationship[] }>(
      '/api/trees/import',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  getTree: (treeId: string) => apiFetch<TreeDetailResponse>(`/api/trees/${treeId}`),

  updateTreeMeta: (
    treeId: string,
    payload: { name?: string; description?: string; design?: Partial<TreeDesignConfig> }
  ) =>
    apiFetch<{ tree: FamilyTree }>(`/api/trees/${treeId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  saveTreeSnapshot: (
    treeId: string,
    payload: {
      name?: string;
      people: Person[];
      relationships: Relationship[];
      design?: TreeDesignConfig;
    }
  ) =>
    apiFetch<{ tree: FamilyTree; people: Person[]; relationships: Relationship[] }>(
      `/api/trees/${treeId}/snapshot`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    ),

  duplicateTree: (treeId: string) =>
    apiFetch<{ tree: FamilyTree }>(`/api/trees/${treeId}/duplicate`, {
      method: 'POST',
    }),

  deleteTree: (treeId: string) =>
    apiFetch<{ deleted: boolean }>(`/api/trees/${treeId}`, {
      method: 'DELETE',
    }),

  deleteTreePhotos: (treeId: string) =>
    apiFetch<{ cleared: boolean; people: Person[] }>(`/api/trees/${treeId}/photos`, {
      method: 'DELETE',
    }),

  upsertInviteLink: (
    treeId: string,
    payload: { isActive?: boolean; regenerate?: boolean; shareAnchorNames?: boolean }
  ) =>
    apiFetch<{ inviteLink: InviteLink }>(`/api/trees/${treeId}/invite`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getPublicInvite: (token: string) =>
    apiFetch<{
      active: boolean;
      treeName: string;
      shareAnchorNames: boolean;
      anchorPeople: { id: string; fullName: string }[];
    }>(`/api/invites/${encodeURIComponent(token)}`),

  submitContribution: (
    token: string,
    payload: {
      contributorName: string;
      contributorEmail?: string;
      consentConfirmed: boolean;
      people: SubmittedPerson[];
    }
  ) =>
    apiFetch<{ submissionId: string; submittedCount: number; status: string }>(
      `/api/invites/${encodeURIComponent(token)}/submit`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  listSubmissions: (treeId: string) =>
    apiFetch<{ submissions: Submission[] }>(`/api/trees/${treeId}/submissions`),

  reviewSubmission: (
    treeId: string,
    submissionId: string,
    payload: {
      action: 'approve' | 'reject';
      selectedTempIds?: string[];
      editedPeople?: SubmittedPerson[];
    }
  ) =>
    apiFetch<{
      submission: Submission;
      people: Person[];
      relationships: Relationship[];
      warnings?: string[];
    }>(`/api/trees/${treeId}/submissions/${submissionId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  enhancePhoto: (photoUrl: string) =>
    apiFetch<{
      configured: boolean;
      mode: 'gemini' | 'demo_unavailable';
      enhancedPhotoUrl?: string;
      message?: string;
    }>('/api/photos/enhance', {
      method: 'POST',
      body: JSON.stringify({ photoUrl }),
    }),

  createDemoCheckoutOrder: (treeId: string, currency: CurrencyCode) =>
    apiFetch<{ order: OrderRecord }>('/api/orders/demo-checkout', {
      method: 'POST',
      body: JSON.stringify({ treeId, currency }),
    }),

  listOrders: () => apiFetch<{ orders: OrderRecord[] }>('/api/orders'),
};
