import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  CurrencyCode,
  DatePrecision,
  FamilyTree,
  InviteLink,
  OrderRecord,
  Person,
  Relationship,
  RelationshipType,
  Submission,
  SubmittedPerson,
  TreeDesignConfig,
  UserAccount,
} from '../shared/types.ts';

export interface StoredUserRecord extends UserAccount {
  passwordHash: string;
}

export interface SupabaseStoreSnapshot {
  users: StoredUserRecord[];
  trees: FamilyTree[];
  peopleByTreeId: Record<string, Person[]>;
  relationshipsByTreeId: Record<string, Relationship[]>;
  invites: InviteLink[];
  submissions: Submission[];
  orders: OrderRecord[];
}

function resolveSupabaseConfig(): {
  url: string | null;
  apiKey: string | null;
  hasSecretKey: boolean;
} {
  const rawProjectId = (process.env.SUPABASE_PROJECT_ID ?? '').trim();
  const rawUrl = (process.env.SUPABASE_URL ?? '').trim();

  let url: string | null = null;
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co')) {
        url = parsed.origin;
      }
    } catch {
      url = null;
    }
  } else if (/^[a-z0-9-]{8,40}$/i.test(rawProjectId)) {
    url = `https://${rawProjectId}.supabase.co`;
  }

  const secretKey = (
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    ''
  ).trim();
  const publishableKey = (
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    ''
  ).trim();

  const hasSecretKey = Boolean(secretKey && !secretKey.startsWith('MY_'));
  const apiKey = hasSecretKey
    ? secretKey
    : publishableKey && !publishableKey.startsWith('MY_')
      ? publishableKey
      : null;

  return { url, apiKey, hasSecretKey };
}

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = '';
let schemaReadyState = false;

function getSupabaseClient(): {
  client: SupabaseClient | null;
  hasSecretKey: boolean;
} {
  const { url, apiKey, hasSecretKey } = resolveSupabaseConfig();
  if (!url || !apiKey) {
    return { client: null, hasSecretKey: false };
  }
  const key = `${url}::${hasSecretKey ? 'secret' : 'pub'}`;
  if (!cachedClient || cachedConfigKey !== key) {
    cachedClient = createClient(url, apiKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    cachedConfigKey = key;
  }
  return { client: cachedClient, hasSecretKey };
}

export function getSupabaseStatus() {
  const { url, apiKey, hasSecretKey } = resolveSupabaseConfig();
  return {
    configured: Boolean(url && apiKey),
    hasSecretKey,
    schemaReady: schemaReadyState,
  };
}

export async function loadSnapshotFromSupabase(
  defaultDesign: TreeDesignConfig
): Promise<SupabaseStoreSnapshot | null> {
  const { client } = getSupabaseClient();
  if (!client) {
    schemaReadyState = false;
    return null;
  }

  try {
    const [usersRes, treesRes, peopleRes, relsRes, invitesRes, subsRes, ordersRes] =
      await Promise.all([
        client.from('rb_users').select('id, name, email, password_hash, created_at'),
        client
          .from('rb_trees')
          .select('id, owner_id, name, description, is_sample, design, created_at, updated_at'),
        client
          .from('rb_people')
          .select(
            'id, tree_id, full_name, alternate_name, birth_date, birth_date_precision, death_date, death_date_precision, photo_url, notes, created_at, updated_at'
          ),
        client
          .from('rb_relationships')
          .select('id, tree_id, from_person_id, to_person_id, type, label, created_at, updated_at'),
        client
          .from('rb_invites')
          .select('id, tree_id, owner_id, token, is_active, share_anchor_names, created_at, updated_at'),
        client
          .from('rb_submissions')
          .select(
            'id, tree_id, owner_id, invite_token, contributor_name, contributor_email, consent_confirmed, status, people, created_at, updated_at'
          ),
        client
          .from('rb_orders')
          .select(
            'id, tree_id, owner_id, people_count, currency, amount, provider, status, note, created_at'
          ),
      ]);

    const firstError =
      usersRes.error ||
      treesRes.error ||
      peopleRes.error ||
      relsRes.error ||
      invitesRes.error ||
      subsRes.error ||
      ordersRes.error;

    if (firstError) {
      schemaReadyState = false;
      console.warn('Supabase sync waiting on schema or secret key:', firstError.code ?? firstError.message);
      return null;
    }

    schemaReadyState = true;

    const users: StoredUserRecord[] = (usersRes.data ?? []).map((u) => ({
      id: String(u.id),
      name: String(u.name),
      email: String(u.email),
      passwordHash: String(u.password_hash),
      createdAt: String(u.created_at),
    }));

    const trees: FamilyTree[] = (treesRes.data ?? []).map((t) => ({
      id: String(t.id),
      ownerId: String(t.owner_id),
      name: String(t.name),
      description: t.description ? String(t.description) : undefined,
      isSample: Boolean(t.is_sample),
      design: {
        ...defaultDesign,
        ...((t.design as Partial<TreeDesignConfig> | null) ?? {}),
      },
      createdAt: String(t.created_at),
      updatedAt: String(t.updated_at),
    }));

    const peopleByTreeId: Record<string, Person[]> = {};
    for (const p of peopleRes.data ?? []) {
      const treeId = String(p.tree_id);
      if (!peopleByTreeId[treeId]) peopleByTreeId[treeId] = [];
      peopleByTreeId[treeId].push({
        id: String(p.id),
        treeId,
        fullName: String(p.full_name),
        alternateName: p.alternate_name ? String(p.alternate_name) : undefined,
        birthDate: p.birth_date ? String(p.birth_date) : undefined,
        birthDatePrecision: (p.birth_date_precision as DatePrecision) ?? 'unknown',
        deathDate: p.death_date ? String(p.death_date) : undefined,
        deathDatePrecision: (p.death_date_precision as DatePrecision) ?? 'unknown',
        photoUrl: p.photo_url ? String(p.photo_url) : undefined,
        notes: p.notes ? String(p.notes) : undefined,
        createdAt: String(p.created_at),
        updatedAt: String(p.updated_at),
      });
    }

    const relationshipsByTreeId: Record<string, Relationship[]> = {};
    for (const r of relsRes.data ?? []) {
      const treeId = String(r.tree_id);
      if (!relationshipsByTreeId[treeId]) relationshipsByTreeId[treeId] = [];
      relationshipsByTreeId[treeId].push({
        id: String(r.id),
        treeId,
        fromPersonId: String(r.from_person_id),
        toPersonId: String(r.to_person_id),
        type: (r.type as RelationshipType) ?? 'other',
        label: r.label ? String(r.label) : undefined,
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
      });
    }

    const invites: InviteLink[] = (invitesRes.data ?? []).map((inv) => ({
      id: String(inv.id),
      treeId: String(inv.tree_id),
      ownerId: String(inv.owner_id),
      token: String(inv.token),
      isActive: Boolean(inv.is_active),
      shareAnchorNames: Boolean(inv.share_anchor_names),
      createdAt: String(inv.created_at),
      updatedAt: String(inv.updated_at),
    }));

    const submissions: Submission[] = (subsRes.data ?? []).map((sub) => ({
      id: String(sub.id),
      treeId: String(sub.tree_id),
      ownerId: String(sub.owner_id),
      inviteToken: String(sub.invite_token),
      contributorName: String(sub.contributor_name),
      contributorEmail: sub.contributor_email ? String(sub.contributor_email) : undefined,
      consentConfirmed: Boolean(sub.consent_confirmed),
      status: sub.status as Submission['status'],
      people: Array.isArray(sub.people) ? (sub.people as SubmittedPerson[]) : [],
      createdAt: String(sub.created_at),
      updatedAt: String(sub.updated_at),
    }));

    const orders: OrderRecord[] = (ordersRes.data ?? []).map((o) => ({
      id: String(o.id),
      treeId: String(o.tree_id),
      ownerId: String(o.owner_id),
      peopleCount: Number(o.people_count ?? 0),
      currency: (o.currency === 'USD' ? 'USD' : 'INR') as CurrencyCode,
      amount: Number(o.amount ?? 0),
      provider: 'unconfigured_demo',
      status: 'demo_preview',
      note: String(o.note ?? ''),
      createdAt: String(o.created_at),
    }));

    return {
      users,
      trees,
      peopleByTreeId,
      relationshipsByTreeId,
      invites,
      submissions,
      orders,
    };
  } catch (err) {
    schemaReadyState = false;
    console.warn('Unable to reach Supabase store, using local persistence:', err instanceof Error ? err.message : err);
    return null;
  }
}

export async function syncUserToSupabase(user: StoredUserRecord): Promise<void> {
  const { client } = getSupabaseClient();
  if (!client || !schemaReadyState) return;
  try {
    const { error } = await client.from('rb_users').upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      password_hash: user.passwordHash,
      created_at: user.createdAt,
    });
    if (error) console.warn('Supabase user sync warning:', error.code ?? error.message);
  } catch (err) {
    console.warn('Supabase user sync skipped:', err instanceof Error ? err.message : err);
  }
}

export async function syncTreeBundleToSupabase(
  tree: FamilyTree,
  people: Person[],
  relationships: Relationship[]
): Promise<void> {
  const { client } = getSupabaseClient();
  if (!client || !schemaReadyState) return;
  try {
    const { error: treeErr } = await client.from('rb_trees').upsert({
      id: tree.id,
      owner_id: tree.ownerId,
      name: tree.name,
      description: tree.description ?? null,
      is_sample: Boolean(tree.isSample),
      design: tree.design,
      created_at: tree.createdAt,
      updated_at: tree.updatedAt,
    });
    if (treeErr) {
      console.warn('Supabase tree upsert warning:', treeErr.code ?? treeErr.message);
      return;
    }

    // Replace relationships and people for this tree cleanly
    await client.from('rb_relationships').delete().eq('tree_id', tree.id);
    await client.from('rb_people').delete().eq('tree_id', tree.id);

    if (people.length > 0) {
      const { error: peopleErr } = await client.from('rb_people').insert(
        people.map((p) => ({
          id: p.id,
          tree_id: tree.id,
          full_name: p.fullName,
          alternate_name: p.alternateName ?? null,
          birth_date: p.birthDate ?? null,
          birth_date_precision: p.birthDatePrecision,
          death_date: p.deathDate ?? null,
          death_date_precision: p.deathDatePrecision,
          photo_url: p.photoUrl ?? null,
          notes: p.notes ?? null,
          created_at: p.createdAt,
          updated_at: p.updatedAt,
        }))
      );
      if (peopleErr) {
        console.warn('Supabase people sync warning:', peopleErr.code ?? peopleErr.message);
        return;
      }
    }

    if (relationships.length > 0) {
      const { error: relErr } = await client.from('rb_relationships').insert(
        relationships.map((r) => ({
          id: r.id,
          tree_id: tree.id,
          from_person_id: r.fromPersonId,
          to_person_id: r.toPersonId,
          type: r.type,
          label: r.label ?? null,
          created_at: r.createdAt,
          updated_at: r.updatedAt,
        }))
      );
      if (relErr) {
        console.warn('Supabase relationships sync warning:', relErr.code ?? relErr.message);
      }
    }
  } catch (err) {
    console.warn('Supabase tree sync skipped:', err instanceof Error ? err.message : err);
  }
}

export async function deleteTreeFromSupabase(treeId: string): Promise<void> {
  const { client } = getSupabaseClient();
  if (!client || !schemaReadyState) return;
  try {
    const { error } = await client.from('rb_trees').delete().eq('id', treeId);
    if (error) console.warn('Supabase tree delete warning:', error.code ?? error.message);
  } catch (err) {
    console.warn('Supabase tree delete skipped:', err instanceof Error ? err.message : err);
  }
}

export async function syncInviteToSupabase(invite: InviteLink): Promise<void> {
  const { client } = getSupabaseClient();
  if (!client || !schemaReadyState) return;
  try {
    await client.from('rb_invites').delete().eq('tree_id', invite.treeId);
    const { error } = await client.from('rb_invites').upsert({
      id: invite.id,
      tree_id: invite.treeId,
      owner_id: invite.ownerId,
      token: invite.token,
      is_active: invite.isActive,
      share_anchor_names: invite.shareAnchorNames,
      created_at: invite.createdAt,
      updated_at: invite.updatedAt,
    });
    if (error) console.warn('Supabase invite sync warning:', error.code ?? error.message);
  } catch (err) {
    console.warn('Supabase invite sync skipped:', err instanceof Error ? err.message : err);
  }
}

export async function syncSubmissionToSupabase(submission: Submission): Promise<void> {
  const { client } = getSupabaseClient();
  if (!client || !schemaReadyState) return;
  try {
    const { error } = await client.from('rb_submissions').upsert({
      id: submission.id,
      tree_id: submission.treeId,
      owner_id: submission.ownerId,
      invite_token: submission.inviteToken,
      contributor_name: submission.contributorName,
      contributor_email: submission.contributorEmail ?? null,
      consent_confirmed: submission.consentConfirmed,
      status: submission.status,
      people: submission.people,
      created_at: submission.createdAt,
      updated_at: submission.updatedAt,
    });
    if (error) console.warn('Supabase submission sync warning:', error.code ?? error.message);
  } catch (err) {
    console.warn('Supabase submission sync skipped:', err instanceof Error ? err.message : err);
  }
}

export async function syncOrderToSupabase(order: OrderRecord): Promise<void> {
  const { client } = getSupabaseClient();
  if (!client || !schemaReadyState) return;
  try {
    const { error } = await client.from('rb_orders').upsert({
      id: order.id,
      tree_id: order.treeId,
      owner_id: order.ownerId,
      people_count: order.peopleCount,
      currency: order.currency,
      amount: order.amount,
      provider: order.provider,
      status: order.status,
      note: order.note,
      created_at: order.createdAt,
    });
    if (error) console.warn('Supabase order sync warning:', error.code ?? error.message);
  } catch (err) {
    console.warn('Supabase order sync skipped:', err instanceof Error ? err.message : err);
  }
}

export async function pushSnapshotToSupabase(snapshot: SupabaseStoreSnapshot): Promise<void> {
  const { client } = getSupabaseClient();
  if (!client || !schemaReadyState) return;
  for (const user of snapshot.users) {
    await syncUserToSupabase(user);
  }
  for (const tree of snapshot.trees) {
    await syncTreeBundleToSupabase(
      tree,
      snapshot.peopleByTreeId[tree.id] ?? [],
      snapshot.relationshipsByTreeId[tree.id] ?? []
    );
  }
  for (const invite of snapshot.invites) {
    await syncInviteToSupabase(invite);
  }
  for (const sub of snapshot.submissions) {
    await syncSubmissionToSupabase(sub);
  }
  for (const order of snapshot.orders) {
    await syncOrderToSupabase(order);
  }
}
