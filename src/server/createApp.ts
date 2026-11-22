import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { calculateTreePrice } from '../shared/pricing.ts';
import {
  DEFAULT_DESIGN_CONFIG,
  SAMPLE_PEOPLE,
  SAMPLE_PENDING_SUBMISSION,
  SAMPLE_RELATIONSHIPS,
  SAMPLE_TREE,
  SAMPLE_TREE_ID,
} from '../shared/sampleData.ts';
import {
  TREE_LIMITS,
  checkCanAddPerson,
  checkCanAddRelationship,
} from '../shared/treeLimits.ts';
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
import {
  deleteTreeFromSupabase,
  getSupabaseStatus,
  loadSnapshotFromSupabase,
  pushSnapshotToSupabase,
  syncInviteToSupabase,
  syncOrderToSupabase,
  syncSubmissionToSupabase,
  syncTreeBundleToSupabase,
  syncUserToSupabase,
  type SupabaseStoreSnapshot,
} from './supabaseStore.ts';

const DATA_DIR = process.env.NETLIFY
  ? path.join('/tmp', 'roots-branches-data')
  : path.resolve(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16
    ? process.env.SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

interface StoredUser extends UserAccount {
  passwordHash: string;
}

interface AuthedRequest extends Request {
  user?: UserAccount;
}

interface PersistedStorePayload {
  version: number;
  users: StoredUser[];
  trees: FamilyTree[];
  peopleByTreeId: Record<string, Person[]>;
  relationshipsByTreeId: Record<string, Relationship[]>;
  invites: InviteLink[];
  submissions: Submission[];
  orders: OrderRecord[];
}

export interface CreateApiAppOptions {
  serverless?: boolean;
}

export function createApiApp(options: CreateApiAppOptions = {}): {
  app: Express;
  ensureInitialized: () => Promise<void>;
} {
  const usersById = new Map<string, StoredUser>();
  const userIdByEmail = new Map<string, string>();
  const treesById = new Map<string, FamilyTree>();
  const peopleByTreeId = new Map<string, Person[]>();
  const relationshipsByTreeId = new Map<string, Relationship[]>();
  const invitesByToken = new Map<string, InviteLink>();
  const submissionsById = new Map<string, Submission>();
  const ordersById = new Map<string, OrderRecord>();

  function buildSnapshot(): SupabaseStoreSnapshot {
    return {
      users: Array.from(usersById.values()),
      trees: Array.from(treesById.values()),
      peopleByTreeId: Object.fromEntries(peopleByTreeId.entries()),
      relationshipsByTreeId: Object.fromEntries(relationshipsByTreeId.entries()),
      invites: Array.from(invitesByToken.values()),
      submissions: Array.from(submissionsById.values()),
      orders: Array.from(ordersById.values()),
    };
  }

  function saveStoreToDisk() {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const payload: PersistedStorePayload = {
        version: 1,
        ...buildSnapshot(),
      };
      const tmpFile = `${STORE_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(payload, null, 2), 'utf8');
      fs.renameSync(tmpFile, STORE_FILE);
    } catch {
      // Ignore read-only filesystem errors in ephemeral serverless environments
    }
  }

  function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derived}`;
  }

  function verifyPassword(password: string, storedHash: string): boolean {
    const [salt, keyHex] = storedHash.split(':');
    if (!salt || !keyHex) return false;
    const derived = crypto.scryptSync(password, salt, 64);
    const storedBuf = Buffer.from(keyHex, 'hex');
    if (derived.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(derived, storedBuf);
  }

  function signToken(userId: string): string {
    const payload = Buffer.from(
      JSON.stringify({ uid: userId, iat: Date.now(), exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })
    ).toString('base64url');
    const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
    return `${payload}.${sig}`;
  }

  function verifyToken(token: string): string | null {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payload, sig] = parts;
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }
    try {
      const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
        uid?: string;
        exp?: number;
      };
      if (!parsed.uid || !parsed.exp || parsed.exp < Date.now()) return null;
      return parsed.uid;
    } catch {
      return null;
    }
  }

  function generateSecureInviteToken(): string {
    return crypto.randomBytes(24).toString('base64url');
  }

  function sanitizeString(value: unknown, maxLen: number): string {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, maxLen);
  }

  function validateDatePrecision(value: unknown): DatePrecision {
    if (
      value === 'exact' ||
      value === 'approximate' ||
      value === 'year_only' ||
      value === 'unknown'
    ) {
      return value;
    }
    return 'unknown';
  }

  function validateRelationshipType(value: unknown): RelationshipType {
    if (value === 'parent_child' || value === 'spouse_partner' || value === 'other') {
      return value;
    }
    return 'other';
  }

  function validatePhotoUrl(url: unknown): { valid: boolean; value?: string; error?: string } {
    if (url === undefined || url === null || url === '') {
      return { valid: true, value: undefined };
    }
    if (typeof url !== 'string') {
      return { valid: false, error: 'Photo must be a valid image string.' };
    }
    if (url.startsWith('/src/assets/images/') && !url.includes('..')) {
      return { valid: true, value: url };
    }
    const match = url.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) {
      return {
        valid: false,
        error: 'Only JPEG, PNG, or WebP images are supported.',
      };
    }
    const base64Data = match[2];
    const approxBytes = Math.floor((base64Data.length * 3) / 4);
    if (approxBytes > TREE_LIMITS.MAX_PHOTO_BYTES) {
      return {
        valid: false,
        error: `Photo exceeds the ${Math.round(TREE_LIMITS.MAX_PHOTO_BYTES / (1024 * 1024))} MB limit.`,
      };
    }
    return { valid: true, value: url };
  }

  function seedDemoData() {
    const demoUserId = 'demo-owner-1';
    const demoUser: StoredUser = {
      id: demoUserId,
      name: 'Meera Kulkarni (Demo Owner)',
      email: 'demo@rootsandbranches.example',
      passwordHash: hashPassword('demo-preview-only'),
      createdAt: '2026-10-15T09:50:00.000Z',
    };
    usersById.set(demoUserId, demoUser);
    userIdByEmail.set(demoUser.email, demoUserId);

    treesById.set(SAMPLE_TREE_ID, structuredClone(SAMPLE_TREE));
    peopleByTreeId.set(SAMPLE_TREE_ID, structuredClone(SAMPLE_PEOPLE));
    relationshipsByTreeId.set(SAMPLE_TREE_ID, structuredClone(SAMPLE_RELATIONSHIPS));

    const sampleInvite: InviteLink = {
      id: 'inv-sample-1',
      treeId: SAMPLE_TREE_ID,
      ownerId: demoUserId,
      token: SAMPLE_PENDING_SUBMISSION.inviteToken,
      isActive: true,
      shareAnchorNames: true,
      createdAt: '2026-11-10T10:00:00.000Z',
      updatedAt: '2026-11-10T10:00:00.000Z',
    };
    invitesByToken.set(sampleInvite.token, sampleInvite);
    submissionsById.set(SAMPLE_PENDING_SUBMISSION.id, structuredClone(SAMPLE_PENDING_SUBMISSION));
  }

  function loadStoreFromDisk() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf8');
        const parsed = JSON.parse(raw) as Partial<PersistedStorePayload>;

        for (const u of parsed.users ?? []) {
          usersById.set(u.id, u);
          userIdByEmail.set(u.email.toLowerCase(), u.id);
        }
        for (const t of parsed.trees ?? []) {
          treesById.set(t.id, {
            ...t,
            design: { ...DEFAULT_DESIGN_CONFIG, ...(t.design ?? {}) },
          });
        }
        for (const [tid, plist] of Object.entries(parsed.peopleByTreeId ?? {})) {
          peopleByTreeId.set(tid, plist);
        }
        for (const [tid, rlist] of Object.entries(parsed.relationshipsByTreeId ?? {})) {
          relationshipsByTreeId.set(tid, rlist);
        }
        for (const inv of parsed.invites ?? []) {
          invitesByToken.set(inv.token, inv);
        }
        for (const sub of parsed.submissions ?? []) {
          submissionsById.set(sub.id, sub);
        }
        for (const ord of parsed.orders ?? []) {
          ordersById.set(ord.id, ord);
        }

        if (!usersById.has('demo-owner-1')) {
          seedDemoData();
          saveStoreToDisk();
        }
        return;
      }
    } catch {
      // Fallback to seeded demo state below
    }
    seedDemoData();
    saveStoreToDisk();
  }

  loadStoreFromDisk();

  let initPromise: Promise<void> | null = null;
  async function ensureInitialized() {
    if (!initPromise) {
      initPromise = (async () => {
        const remote = await loadSnapshotFromSupabase(DEFAULT_DESIGN_CONFIG);
        if (!remote) return;

        if (remote.users.length === 0) {
          await pushSnapshotToSupabase(buildSnapshot());
          return;
        }

        for (const u of remote.users) {
          usersById.set(u.id, u);
          userIdByEmail.set(u.email.toLowerCase(), u.id);
        }
        for (const t of remote.trees) {
          treesById.set(t.id, t);
        }
        for (const [tid, plist] of Object.entries(remote.peopleByTreeId)) {
          peopleByTreeId.set(tid, plist);
        }
        for (const [tid, rlist] of Object.entries(remote.relationshipsByTreeId)) {
          relationshipsByTreeId.set(tid, rlist);
        }
        for (const inv of remote.invites) {
          invitesByToken.set(inv.token, inv);
        }
        for (const sub of remote.submissions) {
          submissionsById.set(sub.id, sub);
        }
        for (const ord of remote.orders) {
          ordersById.set(ord.id, ord);
        }
        saveStoreToDisk();
      })();
    }
    await initPromise;
  }

  function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Please sign in to access your family trees.' });
      return;
    }
    const token = header.slice('Bearer '.length).trim();
    const uid = verifyToken(token);
    if (!uid) {
      res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
      return;
    }
    const stored = usersById.get(uid);
    if (!stored) {
      res.status(401).json({ error: 'Account not found. Please sign in again.' });
      return;
    }
    const { passwordHash: _ignored, ...safeUser } = stored;
    req.user = safeUser;
    next();
  }

  function getOwnedTree(treeId: string, ownerId: string): FamilyTree | null {
    const tree = treesById.get(treeId);
    if (!tree || tree.ownerId !== ownerId) return null;
    return tree;
  }

  const app = express();
  app.use(express.json({ limit: '8mb' }));

  if (options.serverless) {
    app.use((req, _res, next) => {
      if (req.url.startsWith('/.netlify/functions/api')) {
        const rest = req.url.slice('/.netlify/functions/api'.length);
        req.url = `/api${rest.startsWith('/') ? rest : rest ? `/${rest}` : ''}`;
      } else if (!req.url.startsWith('/api/') && req.url !== '/api') {
        req.url = `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
      }
      next();
    });
  }

  app.use('/api', async (_req, _res, next) => {
    await ensureInitialized();
    next();
  });

  // ============================================================================
  // Health & Public Sample Preview
  // ============================================================================
  app.get('/api/health', (_req, res) => {
    const sb = getSupabaseStatus();
    res.json({
      ok: true,
      mode: sb.schemaReady ? 'supabase' : 'local_demo',
      persistence: sb.schemaReady ? 'supabase' : 'local_file',
      runtime: options.serverless ? 'netlify_serverless' : 'node_server',
      supabaseConfigured: sb.configured,
      supabaseSecretConfigured: sb.hasSecretKey,
      supabaseSchemaReady: sb.schemaReady,
      firebaseConfigured: false,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  app.get('/api/sample-tree', (_req, res) => {
    res.json({
      tree: SAMPLE_TREE,
      people: SAMPLE_PEOPLE,
      relationships: SAMPLE_RELATIONSHIPS,
      fictional: true,
    });
  });

  // ============================================================================
  // Authentication (scrypt password hashing + HMAC Bearer token)
  // ============================================================================
  app.post('/api/auth/register', async (req, res) => {
    const name = sanitizeString(req.body?.name, 80);
    const email = sanitizeString(req.body?.email, 120).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!name || !email || !email.includes('@')) {
      res.status(400).json({ error: 'Please enter your name and a valid email address.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Please choose a password of at least 6 characters.' });
      return;
    }
    if (userIdByEmail.has(email)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const now = new Date().toISOString();
    const userId = `user-${crypto.randomUUID()}`;
    const newUser: StoredUser = {
      id: userId,
      name,
      email,
      passwordHash: hashPassword(password),
      createdAt: now,
    };
    usersById.set(userId, newUser);
    userIdByEmail.set(email, userId);
    saveStoreToDisk();
    await syncUserToSupabase(newUser);

    const { passwordHash: _ignored, ...safeUser } = newUser;
    res.status(201).json({
      token: signToken(userId),
      user: safeUser,
      mode: 'local_demo',
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const email = sanitizeString(req.body?.email, 120).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    const userId = userIdByEmail.get(email);
    const stored = userId ? usersById.get(userId) : undefined;
    if (!stored || !verifyPassword(password, stored.passwordHash)) {
      res.status(401).json({ error: 'Email or password did not match.' });
      return;
    }

    const { passwordHash: _ignored, ...safeUser } = stored;
    res.json({
      token: signToken(stored.id),
      user: safeUser,
      mode: 'local_demo',
    });
  });

  app.post('/api/auth/demo', (_req, res) => {
    const stored = usersById.get('demo-owner-1');
    if (!stored) {
      res.status(500).json({ error: 'Demo account unavailable.' });
      return;
    }
    const { passwordHash: _ignored, ...safeUser } = stored;
    res.json({
      token: signToken(stored.id),
      user: safeUser,
      mode: 'local_demo',
    });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
    res.json({ user: req.user, mode: 'local_demo' });
  });

  // ============================================================================
  // Owner Trees CRUD
  // ============================================================================
  app.get('/api/trees', requireAuth, (req: AuthedRequest, res) => {
    const ownerId = req.user!.id;
    const list = Array.from(treesById.values())
      .filter((t) => t.ownerId === ownerId)
      .map((tree) => {
        const peopleCount = (peopleByTreeId.get(tree.id) ?? []).length;
        const pendingSubmissionsCount = Array.from(submissionsById.values()).filter(
          (s) => s.treeId === tree.id && (s.status === 'pending' || s.status === 'partially_reviewed')
        ).length;
        return {
          ...tree,
          peopleCount,
          pendingSubmissionsCount,
        };
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    res.json({ trees: list });
  });

  app.post('/api/trees', requireAuth, async (req: AuthedRequest, res) => {
    const ownerId = req.user!.id;
    const name = sanitizeString(req.body?.name, 100);
    const description = sanitizeString(req.body?.description, 300);

    if (!name) {
      res.status(400).json({ error: 'Please provide a name for your family tree.' });
      return;
    }

    const now = new Date().toISOString();
    const treeId = `tree-${crypto.randomUUID()}`;
    const tree: FamilyTree = {
      id: treeId,
      ownerId,
      name,
      description: description || undefined,
      design: { ...DEFAULT_DESIGN_CONFIG },
      createdAt: now,
      updatedAt: now,
    };

    treesById.set(treeId, tree);
    peopleByTreeId.set(treeId, []);
    relationshipsByTreeId.set(treeId, []);
    saveStoreToDisk();
    await syncTreeBundleToSupabase(tree, [], []);

    res.status(201).json({ tree, people: [], relationships: [] });
  });

  app.post('/api/trees/import', requireAuth, async (req: AuthedRequest, res) => {
    const ownerId = req.user!.id;
    const name = sanitizeString(req.body?.name, 100);
    const description = sanitizeString(req.body?.description, 300);
    const rawPeople = Array.isArray(req.body?.people) ? req.body.people : [];
    const rawRels = Array.isArray(req.body?.relationships) ? req.body.relationships : [];

    if (!name) {
      res.status(400).json({ error: 'Imported tree must include a valid tree name.' });
      return;
    }
    if (rawPeople.length > TREE_LIMITS.MAX_PEOPLE_PER_TREE) {
      res.status(400).json({
        error: `Imported tree exceeds the ${TREE_LIMITS.MAX_PEOPLE_PER_TREE}-person limit.`,
      });
      return;
    }

    const now = new Date().toISOString();
    const treeId = `tree-${crypto.randomUUID()}`;
    const idMap = new Map<string, string>();
    const importedPeople: Person[] = [];

    for (const item of rawPeople) {
      const fullName = sanitizeString(item?.fullName, 120);
      if (!fullName) {
        res.status(400).json({ error: 'Every imported person must have a full name.' });
        return;
      }
      const photoCheck = validatePhotoUrl(item?.photoUrl);
      if (!photoCheck.valid) {
        res.status(400).json({ error: photoCheck.error ?? 'Invalid imported photo.' });
        return;
      }
      const origId = sanitizeString(item?.id, 128) || `orig-${importedPeople.length}`;
      const nextId = `p-${crypto.randomUUID()}`;
      idMap.set(origId, nextId);
      importedPeople.push({
        id: nextId,
        treeId,
        fullName,
        alternateName: sanitizeString(item?.alternateName, 120) || undefined,
        birthDate: sanitizeString(item?.birthDate, 40) || undefined,
        birthDatePrecision: validateDatePrecision(item?.birthDatePrecision),
        deathDate: sanitizeString(item?.deathDate, 40) || undefined,
        deathDatePrecision: validateDatePrecision(item?.deathDatePrecision),
        photoUrl: photoCheck.value,
        notes: sanitizeString(item?.notes, 1000) || undefined,
        createdAt: sanitizeString(item?.createdAt, 40) || now,
        updatedAt: now,
      });
    }

    const importedRels: Relationship[] = [];
    for (const rel of rawRels) {
      const fromId = idMap.get(sanitizeString(rel?.fromPersonId, 128));
      const toId = idMap.get(sanitizeString(rel?.toPersonId, 128));
      if (!fromId || !toId) continue;
      const type = validateRelationshipType(rel?.type);
      const check = checkCanAddRelationship(importedRels, fromId, toId, type);
      if (!check.allowed) continue;
      importedRels.push({
        id: `r-${crypto.randomUUID()}`,
        treeId,
        fromPersonId: fromId,
        toPersonId: toId,
        type,
        label: sanitizeString(rel?.label, 60) || undefined,
        createdAt: sanitizeString(rel?.createdAt, 40) || now,
        updatedAt: now,
      });
    }

    const incomingDesign = req.body?.design as Partial<TreeDesignConfig> | undefined;
    const tree: FamilyTree = {
      id: treeId,
      ownerId,
      name,
      description: description || undefined,
      design: { ...DEFAULT_DESIGN_CONFIG, ...(incomingDesign ?? {}) },
      createdAt: now,
      updatedAt: now,
    };

    treesById.set(treeId, tree);
    peopleByTreeId.set(treeId, importedPeople);
    relationshipsByTreeId.set(treeId, importedRels);
    saveStoreToDisk();
    await syncTreeBundleToSupabase(tree, importedPeople, importedRels);

    res.status(201).json({ tree, people: importedPeople, relationships: importedRels });
  });

  app.get('/api/trees/:treeId', requireAuth, (req: AuthedRequest, res) => {
    const tree = getOwnedTree(req.params.treeId, req.user!.id);
    if (!tree) {
      res.status(404).json({ error: 'Family tree not found or you do not have access.' });
      return;
    }

    const people = peopleByTreeId.get(tree.id) ?? [];
    const relationships = relationshipsByTreeId.get(tree.id) ?? [];
    const invite =
      Array.from(invitesByToken.values()).find((inv) => inv.treeId === tree.id) ?? null;
    const pendingSubmissionsCount = Array.from(submissionsById.values()).filter(
      (s) => s.treeId === tree.id && (s.status === 'pending' || s.status === 'partially_reviewed')
    ).length;

    res.json({
      tree,
      people,
      relationships,
      inviteLink: invite,
      pendingSubmissionsCount,
    });
  });

  app.patch('/api/trees/:treeId', requireAuth, async (req: AuthedRequest, res) => {
    const tree = getOwnedTree(req.params.treeId, req.user!.id);
    if (!tree) {
      res.status(404).json({ error: 'Family tree not found.' });
      return;
    }

    const nextName = req.body?.name !== undefined ? sanitizeString(req.body.name, 100) : tree.name;
    if (!nextName) {
      res.status(400).json({ error: 'Tree name cannot be empty.' });
      return;
    }

    const nextDescription =
      req.body?.description !== undefined
        ? sanitizeString(req.body.description, 300) || undefined
        : tree.description;

    const incomingDesign = req.body?.design as Partial<TreeDesignConfig> | undefined;
    const updatedDesign: TreeDesignConfig = incomingDesign
      ? {
          style: incomingDesign.style ?? tree.design.style,
          orientation: incomingDesign.orientation ?? tree.design.orientation,
          fontFamily: incomingDesign.fontFamily ?? tree.design.fontFamily,
          textSize: incomingDesign.textSize ?? tree.design.textSize,
          backgroundColor:
            sanitizeString(incomingDesign.backgroundColor, 24) || tree.design.backgroundColor,
          lineColor: sanitizeString(incomingDesign.lineColor, 24) || tree.design.lineColor,
          cardColor: sanitizeString(incomingDesign.cardColor, 24) || tree.design.cardColor,
          cardTextColor:
            sanitizeString(incomingDesign.cardTextColor, 24) || tree.design.cardTextColor,
          accentColor: sanitizeString(incomingDesign.accentColor, 24) || tree.design.accentColor,
          seatingModel: incomingDesign.seatingModel ?? tree.design.seatingModel,
        }
      : tree.design;

    const updatedTree: FamilyTree = {
      ...tree,
      name: nextName,
      description: nextDescription,
      design: updatedDesign,
      updatedAt: new Date().toISOString(),
    };

    treesById.set(tree.id, updatedTree);
    saveStoreToDisk();
    await syncTreeBundleToSupabase(
      updatedTree,
      peopleByTreeId.get(tree.id) ?? [],
      relationshipsByTreeId.get(tree.id) ?? []
    );
    res.json({ tree: updatedTree });
  });

  app.put('/api/trees/:treeId/snapshot', requireAuth, async (req: AuthedRequest, res) => {
    const tree = getOwnedTree(req.params.treeId, req.user!.id);
    if (!tree) {
      res.status(404).json({ error: 'Family tree not found.' });
      return;
    }

    const rawPeople = Array.isArray(req.body?.people) ? req.body.people : null;
    const rawRels = Array.isArray(req.body?.relationships) ? req.body.relationships : null;
    if (!rawPeople || !rawRels) {
      res.status(400).json({ error: 'Invalid tree payload.' });
      return;
    }

    if (rawPeople.length > TREE_LIMITS.MAX_PEOPLE_PER_TREE) {
      res.status(400).json({
        error: `A tree can include up to ${TREE_LIMITS.MAX_PEOPLE_PER_TREE} people.`,
      });
      return;
    }

    const now = new Date().toISOString();
    const validatedPeople: Person[] = [];
    const personIds = new Set<string>();

    for (const item of rawPeople) {
      const id = sanitizeString(item?.id, 128) || `p-${crypto.randomUUID()}`;
      const fullName = sanitizeString(item?.fullName, 120);
      if (!fullName) {
        res.status(400).json({ error: 'Every person must have a full name.' });
        return;
      }
      const photoCheck = validatePhotoUrl(item?.photoUrl);
      if (!photoCheck.valid) {
        res.status(400).json({ error: photoCheck.error ?? 'Invalid photo.' });
        return;
      }

      personIds.add(id);
      validatedPeople.push({
        id,
        treeId: tree.id,
        fullName,
        alternateName: sanitizeString(item?.alternateName, 120) || undefined,
        birthDate: sanitizeString(item?.birthDate, 40) || undefined,
        birthDatePrecision: validateDatePrecision(item?.birthDatePrecision),
        deathDate: sanitizeString(item?.deathDate, 40) || undefined,
        deathDatePrecision: validateDatePrecision(item?.deathDatePrecision),
        photoUrl: photoCheck.value,
        notes: sanitizeString(item?.notes, 1000) || undefined,
        createdAt: sanitizeString(item?.createdAt, 40) || now,
        updatedAt: now,
      });
    }

    const validatedRels: Relationship[] = [];
    for (const rel of rawRels) {
      const id = sanitizeString(rel?.id, 128) || `r-${crypto.randomUUID()}`;
      const fromPersonId = sanitizeString(rel?.fromPersonId, 128);
      const toPersonId = sanitizeString(rel?.toPersonId, 128);
      const type = validateRelationshipType(rel?.type);

      if (!personIds.has(fromPersonId) || !personIds.has(toPersonId)) {
        continue;
      }
      const check = checkCanAddRelationship(validatedRels, fromPersonId, toPersonId, type);
      if (!check.allowed) {
        res.status(400).json({ error: check.reason });
        return;
      }

      validatedRels.push({
        id,
        treeId: tree.id,
        fromPersonId,
        toPersonId,
        type,
        label: sanitizeString(rel?.label, 60) || undefined,
        createdAt: sanitizeString(rel?.createdAt, 40) || now,
        updatedAt: now,
      });
    }

    peopleByTreeId.set(tree.id, validatedPeople);
    relationshipsByTreeId.set(tree.id, validatedRels);

    const nextDesign = req.body?.design
      ? { ...tree.design, ...(req.body.design as Partial<TreeDesignConfig>) }
      : tree.design;

    const updatedTree: FamilyTree = {
      ...tree,
      name: req.body?.name ? sanitizeString(req.body.name, 100) || tree.name : tree.name,
      design: nextDesign,
      updatedAt: now,
    };
    treesById.set(tree.id, updatedTree);
    saveStoreToDisk();
    await syncTreeBundleToSupabase(updatedTree, validatedPeople, validatedRels);

    res.json({
      tree: updatedTree,
      people: validatedPeople,
      relationships: validatedRels,
    });
  });

  app.post('/api/trees/:treeId/duplicate', requireAuth, async (req: AuthedRequest, res) => {
    const source = getOwnedTree(req.params.treeId, req.user!.id);
    if (!source) {
      res.status(404).json({ error: 'Family tree not found.' });
      return;
    }

    const now = new Date().toISOString();
    const newTreeId = `tree-${crypto.randomUUID()}`;
    const idMap = new Map<string, string>();

    const sourcePeople = peopleByTreeId.get(source.id) ?? [];
    const clonedPeople: Person[] = sourcePeople.map((p) => {
      const nextId = `p-${crypto.randomUUID()}`;
      idMap.set(p.id, nextId);
      return {
        ...p,
        id: nextId,
        treeId: newTreeId,
        createdAt: now,
        updatedAt: now,
      };
    });

    const sourceRels = relationshipsByTreeId.get(source.id) ?? [];
    const clonedRels: Relationship[] = sourceRels
      .filter((r) => idMap.has(r.fromPersonId) && idMap.has(r.toPersonId))
      .map((r) => ({
        ...r,
        id: `r-${crypto.randomUUID()}`,
        treeId: newTreeId,
        fromPersonId: idMap.get(r.fromPersonId)!,
        toPersonId: idMap.get(r.toPersonId)!,
        createdAt: now,
        updatedAt: now,
      }));

    const duplicatedTree: FamilyTree = {
      ...source,
      id: newTreeId,
      name: `${source.name} (Copy)`.slice(0, 100),
      isSample: false,
      design: { ...source.design },
      createdAt: now,
      updatedAt: now,
    };

    treesById.set(newTreeId, duplicatedTree);
    peopleByTreeId.set(newTreeId, clonedPeople);
    relationshipsByTreeId.set(newTreeId, clonedRels);
    saveStoreToDisk();
    await syncTreeBundleToSupabase(duplicatedTree, clonedPeople, clonedRels);

    res.status(201).json({ tree: duplicatedTree });
  });

  app.delete('/api/trees/:treeId', requireAuth, async (req: AuthedRequest, res) => {
    const tree = getOwnedTree(req.params.treeId, req.user!.id);
    if (!tree) {
      res.status(404).json({ error: 'Family tree not found.' });
      return;
    }

    treesById.delete(tree.id);
    peopleByTreeId.delete(tree.id);
    relationshipsByTreeId.delete(tree.id);
    for (const [token, inv] of invitesByToken.entries()) {
      if (inv.treeId === tree.id) invitesByToken.delete(token);
    }
    for (const [subId, sub] of submissionsById.entries()) {
      if (sub.treeId === tree.id) submissionsById.delete(subId);
    }
    saveStoreToDisk();
    await deleteTreeFromSupabase(tree.id);

    res.json({ deleted: true });
  });

  app.delete('/api/trees/:treeId/photos', requireAuth, async (req: AuthedRequest, res) => {
    const tree = getOwnedTree(req.params.treeId, req.user!.id);
    if (!tree) {
      res.status(404).json({ error: 'Family tree not found.' });
      return;
    }

    const now = new Date().toISOString();
    const people = (peopleByTreeId.get(tree.id) ?? []).map((p) => ({
      ...p,
      photoUrl: undefined,
      updatedAt: now,
    }));
    peopleByTreeId.set(tree.id, people);
    const clearedTree: FamilyTree = { ...tree, updatedAt: now };
    treesById.set(tree.id, clearedTree);
    saveStoreToDisk();
    await syncTreeBundleToSupabase(clearedTree, people, relationshipsByTreeId.get(tree.id) ?? []);

    res.json({ cleared: true, people });
  });

  // ============================================================================
  // Private Contributor Invite Link Management (Owner)
  // ============================================================================
  app.post('/api/trees/:treeId/invite', requireAuth, async (req: AuthedRequest, res) => {
    const tree = getOwnedTree(req.params.treeId, req.user!.id);
    if (!tree) {
      res.status(404).json({ error: 'Family tree not found.' });
      return;
    }

    const existing = Array.from(invitesByToken.values()).find((inv) => inv.treeId === tree.id);
    const regenerate = Boolean(req.body?.regenerate);
    const now = new Date().toISOString();

    if (existing && !regenerate) {
      const updated: InviteLink = {
        ...existing,
        isActive:
          typeof req.body?.isActive === 'boolean' ? req.body.isActive : existing.isActive,
        shareAnchorNames:
          typeof req.body?.shareAnchorNames === 'boolean'
            ? req.body.shareAnchorNames
            : existing.shareAnchorNames,
        updatedAt: now,
      };
      invitesByToken.set(existing.token, updated);
      saveStoreToDisk();
      await syncInviteToSupabase(updated);
      res.json({ inviteLink: updated });
      return;
    }

    if (existing && regenerate) {
      invitesByToken.delete(existing.token);
    }

    const token = generateSecureInviteToken();
    const newInvite: InviteLink = {
      id: `inv-${crypto.randomUUID()}`,
      treeId: tree.id,
      ownerId: req.user!.id,
      token,
      isActive: typeof req.body?.isActive === 'boolean' ? req.body.isActive : true,
      shareAnchorNames:
        typeof req.body?.shareAnchorNames === 'boolean' ? req.body.shareAnchorNames : true,
      createdAt: now,
      updatedAt: now,
    };
    invitesByToken.set(token, newInvite);
    saveStoreToDisk();
    await syncInviteToSupabase(newInvite);
    res.status(201).json({ inviteLink: newInvite });
  });

  // ============================================================================
  // Public Private-Token Contributor Endpoints (No Account Required, Zero Tree Leak)
  // ============================================================================
  app.get('/api/invites/:token', (req, res) => {
    const token = sanitizeString(req.params.token, 128);
    if (!/^[a-zA-Z0-9_-]{20,128}$/.test(token)) {
      res.status(404).json({
        active: false,
        error: 'This invite link is not valid. Please ask the family tree owner for a new link.',
      });
      return;
    }

    const invite = invitesByToken.get(token);
    if (!invite || !invite.isActive) {
      res.status(403).json({
        active: false,
        error:
          'Submissions via this invite link are currently closed or the link has been replaced.',
      });
      return;
    }

    const tree = treesById.get(invite.treeId);
    if (!tree) {
      res.status(404).json({
        active: false,
        error: 'This family tree is no longer available.',
      });
      return;
    }

    const anchorPeople = invite.shareAnchorNames
      ? (peopleByTreeId.get(tree.id) ?? []).map((p) => ({
          id: p.id,
          fullName: p.fullName,
        }))
      : [];

    res.json({
      active: true,
      treeName: tree.name,
      shareAnchorNames: invite.shareAnchorNames,
      anchorPeople,
    });
  });

  app.post('/api/invites/:token/submit', async (req, res) => {
    const token = sanitizeString(req.params.token, 128);
    const invite = invitesByToken.get(token);

    if (!invite || !invite.isActive) {
      res.status(403).json({
        error: 'This invite link is disabled or invalid. No details were saved.',
      });
      return;
    }

    const tree = treesById.get(invite.treeId);
    if (!tree) {
      res.status(404).json({ error: 'Target family tree not found.' });
      return;
    }

    const contributorName = sanitizeString(req.body?.contributorName, 100);
    const contributorEmail = sanitizeString(req.body?.contributorEmail, 120) || undefined;
    const consentConfirmed = req.body?.consentConfirmed === true;
    const rawPeople = Array.isArray(req.body?.people) ? req.body.people : [];

    if (!contributorName) {
      res.status(400).json({ error: 'Please enter your name so the tree owner knows who sent this.' });
      return;
    }
    if (!consentConfirmed) {
      res.status(400).json({
        error: 'Please check the permission box confirming you may share these family details.',
      });
      return;
    }
    if (rawPeople.length === 0 || rawPeople.length > 25) {
      res
        .status(400)
        .json({ error: 'Please include between 1 and 25 family members per submission.' });
      return;
    }

    const submittedPeople: SubmittedPerson[] = [];
    for (let i = 0; i < rawPeople.length; i++) {
      const item = rawPeople[i];
      const fullName = sanitizeString(item?.fullName, 120);
      if (!fullName) {
        res.status(400).json({ error: `Person #${i + 1} is missing a full name.` });
        return;
      }

      const photoCheck = validatePhotoUrl(item?.photoUrl);
      if (!photoCheck.valid) {
        res.status(400).json({ error: `Person #${i + 1}: ${photoCheck.error}` });
        return;
      }

      submittedPeople.push({
        tempId: sanitizeString(item?.tempId, 64) || `tmp-${i + 1}`,
        fullName,
        alternateName: sanitizeString(item?.alternateName, 120) || undefined,
        birthDate: sanitizeString(item?.birthDate, 40) || undefined,
        birthDatePrecision: validateDatePrecision(item?.birthDatePrecision),
        deathDate: sanitizeString(item?.deathDate, 40) || undefined,
        deathDatePrecision: validateDatePrecision(item?.deathDatePrecision),
        photoUrl: photoCheck.value,
        notes: sanitizeString(item?.notes, 1000) || undefined,
        relationType: item?.relationType ? validateRelationshipType(item.relationType) : undefined,
        relationLabel: sanitizeString(item?.relationLabel, 60) || undefined,
        relationTargetId: sanitizeString(item?.relationTargetId, 128) || undefined,
        relationTargetName: sanitizeString(item?.relationTargetName, 120) || undefined,
        relationDirection:
          item?.relationDirection === 'new_is_parent' || item?.relationDirection === 'new_is_child'
            ? item.relationDirection
            : undefined,
        reviewDecision: 'pending',
      });
    }

    const now = new Date().toISOString();
    const submission: Submission = {
      id: `sub-${crypto.randomUUID()}`,
      treeId: tree.id,
      ownerId: tree.ownerId,
      inviteToken: invite.token,
      contributorName,
      contributorEmail,
      consentConfirmed: true,
      status: 'pending',
      people: submittedPeople,
      createdAt: now,
      updatedAt: now,
    };

    submissionsById.set(submission.id, submission);
    saveStoreToDisk();
    await syncSubmissionToSupabase(submission);

    res.status(201).json({
      submissionId: submission.id,
      submittedCount: submittedPeople.length,
      status: 'pending',
    });
  });

  // ============================================================================
  // Owner Submission Review Inbox
  // ============================================================================
  app.get('/api/trees/:treeId/submissions', requireAuth, (req: AuthedRequest, res) => {
    const tree = getOwnedTree(req.params.treeId, req.user!.id);
    if (!tree) {
      res.status(404).json({ error: 'Family tree not found.' });
      return;
    }

    const list = Array.from(submissionsById.values())
      .filter((s) => s.treeId === tree.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    res.json({ submissions: list });
  });

  app.post(
    '/api/trees/:treeId/submissions/:submissionId/review',
    requireAuth,
    async (req: AuthedRequest, res) => {
      const tree = getOwnedTree(req.params.treeId, req.user!.id);
      if (!tree) {
        res.status(404).json({ error: 'Family tree not found.' });
        return;
      }

      const submission = submissionsById.get(req.params.submissionId);
      if (!submission || submission.treeId !== tree.id) {
        res.status(404).json({ error: 'Submission not found.' });
        return;
      }

      const action = req.body?.action as 'approve' | 'reject' | undefined;
      if (action !== 'approve' && action !== 'reject') {
        res.status(400).json({ error: 'Invalid review action.' });
        return;
      }

      const now = new Date().toISOString();

      if (action === 'reject') {
        const updated: Submission = {
          ...submission,
          status: 'rejected',
          people: submission.people.map((p) => ({
            ...p,
            reviewDecision: p.reviewDecision === 'approved' ? 'approved' : 'rejected',
          })),
          updatedAt: now,
        };
        submissionsById.set(submission.id, updated);
        saveStoreToDisk();
        await syncSubmissionToSupabase(updated);
        res.json({
          submission: updated,
          people: peopleByTreeId.get(tree.id) ?? [],
          relationships: relationshipsByTreeId.get(tree.id) ?? [],
        });
        return;
      }

      const selectedTempIds: string[] = Array.isArray(req.body?.selectedTempIds)
        ? req.body.selectedTempIds
        : submission.people.filter((p) => p.reviewDecision !== 'approved').map((p) => p.tempId);

      const editedPeopleMap = new Map<string, SubmittedPerson>();
      if (Array.isArray(req.body?.editedPeople)) {
        for (const ep of req.body.editedPeople) {
          if (ep?.tempId) editedPeopleMap.set(ep.tempId, ep as SubmittedPerson);
        }
      }

      const currentPeople = [...(peopleByTreeId.get(tree.id) ?? [])];
      const currentRels = [...(relationshipsByTreeId.get(tree.id) ?? [])];
      const tempIdToCreatedPersonId = new Map<string, string>();
      const warnings: string[] = [];

      const nextSubmissionPeople = submission.people.map((orig) => {
        if (!selectedTempIds.includes(orig.tempId) || orig.reviewDecision === 'approved') {
          return orig;
        }

        const merged: SubmittedPerson = {
          ...orig,
          ...(editedPeopleMap.get(orig.tempId) ?? {}),
        };

        if (
          merged.linkToExistingPersonId &&
          currentPeople.some((p) => p.id === merged.linkToExistingPersonId)
        ) {
          tempIdToCreatedPersonId.set(orig.tempId, merged.linkToExistingPersonId);
          return {
            ...merged,
            reviewDecision: 'approved' as const,
          };
        }

        const limitCheck = checkCanAddPerson(currentPeople);
        if (!limitCheck.allowed) {
          warnings.push(limitCheck.reason!);
          return orig;
        }

        const fullName = sanitizeString(merged.fullName, 120);
        if (!fullName) {
          warnings.push('Skipped an entry without a valid full name.');
          return orig;
        }

        const newPersonId = `p-${crypto.randomUUID()}`;
        const newPerson: Person = {
          id: newPersonId,
          treeId: tree.id,
          fullName,
          alternateName: sanitizeString(merged.alternateName, 120) || undefined,
          birthDate: sanitizeString(merged.birthDate, 40) || undefined,
          birthDatePrecision: validateDatePrecision(merged.birthDatePrecision),
          deathDate: sanitizeString(merged.deathDate, 40) || undefined,
          deathDatePrecision: validateDatePrecision(merged.deathDatePrecision),
          photoUrl: merged.photoUrl,
          notes: sanitizeString(merged.notes, 1000) || undefined,
          createdAt: now,
          updatedAt: now,
        };
        currentPeople.push(newPerson);
        tempIdToCreatedPersonId.set(orig.tempId, newPersonId);

        return {
          ...merged,
          reviewDecision: 'approved' as const,
        };
      });

      for (const sp of nextSubmissionPeople) {
        if (sp.reviewDecision !== 'approved' || !sp.relationTargetId || !sp.relationType) {
          continue;
        }
        const sourcePersonId = tempIdToCreatedPersonId.get(sp.tempId);
        if (!sourcePersonId) continue;

        const resolvedTargetId =
          tempIdToCreatedPersonId.get(sp.relationTargetId) ??
          (currentPeople.some((p) => p.id === sp.relationTargetId)
            ? sp.relationTargetId
            : undefined);

        if (!resolvedTargetId) continue;

        let fromPersonId = sourcePersonId;
        let toPersonId = resolvedTargetId;

        if (sp.relationType === 'parent_child' && sp.relationDirection === 'new_is_child') {
          fromPersonId = resolvedTargetId;
          toPersonId = sourcePersonId;
        }

        const relCheck = checkCanAddRelationship(
          currentRels,
          fromPersonId,
          toPersonId,
          sp.relationType
        );
        if (!relCheck.allowed) {
          if (relCheck.reason && !relCheck.reason.includes('already exists')) {
            warnings.push(relCheck.reason);
          }
          continue;
        }

        currentRels.push({
          id: `r-${crypto.randomUUID()}`,
          treeId: tree.id,
          fromPersonId,
          toPersonId,
          type: sp.relationType,
          label: sp.relationLabel || undefined,
          createdAt: now,
          updatedAt: now,
        });
      }

      const allApproved = nextSubmissionPeople.every((p) => p.reviewDecision === 'approved');
      const anyApproved = nextSubmissionPeople.some((p) => p.reviewDecision === 'approved');

      const updatedSubmission: Submission = {
        ...submission,
        people: nextSubmissionPeople,
        status: allApproved ? 'approved' : anyApproved ? 'partially_reviewed' : submission.status,
        updatedAt: now,
      };

      peopleByTreeId.set(tree.id, currentPeople);
      relationshipsByTreeId.set(tree.id, currentRels);
      const updatedAfterReview: FamilyTree = { ...tree, updatedAt: now };
      treesById.set(tree.id, updatedAfterReview);
      submissionsById.set(submission.id, updatedSubmission);
      saveStoreToDisk();
      await syncTreeBundleToSupabase(updatedAfterReview, currentPeople, currentRels);
      await syncSubmissionToSupabase(updatedSubmission);

      res.json({
        submission: updatedSubmission,
        people: currentPeople,
        relationships: currentRels,
        warnings,
      });
    }
  );

  // ============================================================================
  // Optional Server-Side AI Photo Enhancement
  // ============================================================================
  app.post('/api/photos/enhance', requireAuth, async (req: AuthedRequest, res) => {
    const photoCheck = validatePhotoUrl(req.body?.photoUrl);
    if (!photoCheck.valid || !photoCheck.value) {
      res.status(400).json({ error: photoCheck.error ?? 'Please upload a valid photo first.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.json({
        configured: false,
        mode: 'demo_unavailable',
        message:
          'AI photo enhancement is not configured on this server (GEMINI_API_KEY is unset). Showing a clearly labeled preview demonstration.',
      });
      return;
    }

    const dataMatch = photoCheck.value.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
    if (!dataMatch) {
      res.json({
        configured: false,
        mode: 'demo_unavailable',
        message: 'Please upload a JPEG, PNG, or WebP photo file to preview enhancement.',
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: dataMatch[1],
                data: dataMatch[2],
              },
            },
            {
              text: 'Gently restore clarity, natural skin tones, and balanced lighting in this family portrait while preserving every facial feature, expression, clothing detail, and authentic age characteristics faithfully. Do not alter identity or add artificial artifacts.',
            },
          ],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? 'image/png';
          res.json({
            configured: true,
            mode: 'gemini',
            enhancedPhotoUrl: `data:${mime};base64,${part.inlineData.data}`,
          });
          return;
        }
      }

      res.json({
        configured: false,
        mode: 'demo_unavailable',
        message:
          'The image enhancement model did not return an edited image. Showing a clearly labeled preview demonstration instead.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI photo enhancement unavailable';
      res.json({
        configured: false,
        mode: 'demo_unavailable',
        message: `AI photo enhancement could not run with the current server key (${msg.slice(0, 120)}). Showing a clearly labeled preview demonstration.`,
      });
    }
  });

  // ============================================================================
  // Demo Checkout & Webhook-Ready Payment Architecture
  // ============================================================================
  app.post('/api/orders/demo-checkout', requireAuth, async (req: AuthedRequest, res) => {
    const tree = getOwnedTree(req.body?.treeId, req.user!.id);
    if (!tree) {
      res.status(404).json({ error: 'Family tree not found.' });
      return;
    }

    const currency: CurrencyCode = req.body?.currency === 'USD' ? 'USD' : 'INR';
    const people = peopleByTreeId.get(tree.id) ?? [];
    const pricing = calculateTreePrice(people.length, currency);

    const order: OrderRecord = {
      id: `ord-demo-${crypto.randomUUID()}`,
      treeId: tree.id,
      ownerId: req.user!.id,
      peopleCount: people.length,
      currency,
      amount: pricing.totalAmount,
      provider: 'unconfigured_demo',
      status: 'demo_preview',
      note: 'Demo payment only — no real payment provider or webhook is configured, and no money was charged.',
      createdAt: new Date().toISOString(),
    };

    ordersById.set(order.id, order);
    saveStoreToDisk();
    await syncOrderToSupabase(order);
    res.status(201).json({ order, pricing });
  });

  app.get('/api/orders', requireAuth, (req: AuthedRequest, res) => {
    const ownerOrders = Array.from(ordersById.values())
      .filter((o) => o.ownerId === req.user!.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ orders: ownerOrders });
  });

  app.post('/api/payments/webhook', (_req, res) => {
    if (!process.env.PAYMENT_WEBHOOK_SECRET) {
      res.status(501).json({
        error:
          'Payment provider webhook is not configured. Orders remain in demo_preview until server-side credentials are set.',
      });
      return;
    }
    res.status(400).json({ error: 'Signature verification required.' });
  });

  return { app, ensureInitialized };
}
