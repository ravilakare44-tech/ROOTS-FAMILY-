// server.ts
import "dotenv/config";
import fs2 from "node:fs";
import path2 from "node:path";
import express2 from "express";

// src/server/createApp.ts
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import { GoogleGenAI } from "@google/genai";

// src/shared/pricing.ts
var PRICING_CONFIG = {
  baseIncludedPeople: 12,
  INR: {
    currency: "INR",
    symbol: "\u20B9",
    label: "India (INR)",
    basePrice: 30,
    perAdditionalPerson: 10
  },
  USD: {
    currency: "USD",
    symbol: "US$",
    label: "International (USD)",
    basePrice: 1,
    perAdditionalPerson: 1
  }
};
function calculateTreePrice(peopleCount, currency) {
  const safeCount = Math.max(0, Math.floor(Number.isFinite(peopleCount) ? peopleCount : 0));
  const tier = PRICING_CONFIG[currency];
  if (safeCount === 0) {
    return {
      currency,
      peopleCount: 0,
      includedPeople: PRICING_CONFIG.baseIncludedPeople,
      additionalPeople: 0,
      baseAmount: 0,
      additionalAmount: 0,
      totalAmount: 0,
      formattedTotal: formatCurrency(0, currency),
      formattedBase: formatCurrency(tier.basePrice, currency),
      formattedPerExtra: formatCurrency(tier.perAdditionalPerson, currency)
    };
  }
  const additionalPeople = Math.max(0, safeCount - PRICING_CONFIG.baseIncludedPeople);
  const baseAmount = tier.basePrice;
  const additionalAmount = additionalPeople * tier.perAdditionalPerson;
  const totalAmount = baseAmount + additionalAmount;
  return {
    currency,
    peopleCount: safeCount,
    includedPeople: PRICING_CONFIG.baseIncludedPeople,
    additionalPeople,
    baseAmount,
    additionalAmount,
    totalAmount,
    formattedTotal: formatCurrency(totalAmount, currency),
    formattedBase: formatCurrency(tier.basePrice, currency),
    formattedPerExtra: formatCurrency(tier.perAdditionalPerson, currency)
  };
}
function formatCurrency(amount, currency) {
  const symbol = PRICING_CONFIG[currency].symbol;
  return `${symbol}${amount.toLocaleString("en-US")}`;
}

// src/shared/sampleData.ts
var DEFAULT_DESIGN_CONFIG = {
  style: "classic",
  orientation: "landscape",
  fontFamily: "Fraunces",
  textSize: "medium",
  backgroundColor: "#FAF7F0",
  lineColor: "#6B8E78",
  cardColor: "#FFFFFF",
  cardTextColor: "#1F2421",
  accentColor: "#1B4332",
  seatingModel: "indoor_heirloom_sofa"
};
var SAMPLE_TREE_ID = "sample-kulkarni-rao";
var SAMPLE_TREE = {
  id: SAMPLE_TREE_ID,
  ownerId: "demo-owner-1",
  name: "The Kulkarni & Rao Family (Fictional Sample)",
  description: "Fictional three-generation sample tree demonstrating branches, dates with mixed precision, and heirloom styling.",
  isSample: true,
  design: { ...DEFAULT_DESIGN_CONFIG },
  createdAt: "2026-10-15T10:00:00.000Z",
  updatedAt: "2026-11-18T14:30:00.000Z"
};
var SAMPLE_PEOPLE = [
  {
    id: "p-raghav",
    treeId: SAMPLE_TREE_ID,
    fullName: "Raghavendra Kulkarni",
    birthDate: "1938",
    birthDatePrecision: "year_only",
    deathDate: "2014-03-12",
    deathDatePrecision: "exact",
    notes: "School headmaster in Mysuru; loved classical carnatic music and gardening.",
    createdAt: "2026-10-15T10:05:00.000Z",
    updatedAt: "2026-10-15T10:05:00.000Z"
  },
  {
    id: "p-savitri",
    treeId: SAMPLE_TREE_ID,
    fullName: "Savitri Kulkarni",
    alternateName: "n\xE9e Deshpande",
    birthDate: "1943-08-19",
    birthDatePrecision: "approximate",
    deathDatePrecision: "unknown",
    photoUrl: "/src/assets/images/portrait_elder_sample_1795308575639.jpg",
    notes: "Known across the family for her handwritten recipe notebooks and handloom sarees.",
    createdAt: "2026-10-15T10:06:00.000Z",
    updatedAt: "2026-10-15T10:06:00.000Z"
  },
  {
    id: "p-anand",
    treeId: SAMPLE_TREE_ID,
    fullName: "Anand Kulkarni",
    birthDate: "1967-04-04",
    birthDatePrecision: "exact",
    deathDatePrecision: "unknown",
    notes: "Civil engineer who lived in Pune and London.",
    createdAt: "2026-10-15T10:08:00.000Z",
    updatedAt: "2026-10-15T10:08:00.000Z"
  },
  {
    id: "p-meera",
    treeId: SAMPLE_TREE_ID,
    fullName: "Meera Kulkarni",
    alternateName: "n\xE9e Rao",
    birthDate: "1970-11-22",
    birthDatePrecision: "exact",
    deathDatePrecision: "unknown",
    photoUrl: "/src/assets/images/family_courtyard_sample_1795308575329.jpg",
    notes: "Botanist and family archivist gathering stories across cousins.",
    createdAt: "2026-10-15T10:10:00.000Z",
    updatedAt: "2026-10-15T10:10:00.000Z"
  },
  {
    id: "p-lakshmi",
    treeId: SAMPLE_TREE_ID,
    fullName: "Lakshmi Iyer",
    alternateName: "n\xE9e Kulkarni",
    birthDate: "1971",
    birthDatePrecision: "year_only",
    deathDatePrecision: "unknown",
    notes: "Architect based in Bengaluru.",
    createdAt: "2026-10-15T10:12:00.000Z",
    updatedAt: "2026-10-15T10:12:00.000Z"
  },
  {
    id: "p-vikram",
    treeId: SAMPLE_TREE_ID,
    fullName: "Vikram Iyer",
    birthDate: "",
    birthDatePrecision: "unknown",
    deathDatePrecision: "unknown",
    notes: "Married Lakshmi in 1998.",
    createdAt: "2026-10-15T10:13:00.000Z",
    updatedAt: "2026-10-15T10:13:00.000Z"
  },
  {
    id: "p-arjun",
    treeId: SAMPLE_TREE_ID,
    fullName: "Arjun Kulkarni",
    birthDate: "1997-02-14",
    birthDatePrecision: "exact",
    deathDatePrecision: "unknown",
    notes: "Software designer in Bengaluru.",
    createdAt: "2026-10-15T10:15:00.000Z",
    updatedAt: "2026-10-15T10:15:00.000Z"
  },
  {
    id: "p-kavya",
    treeId: SAMPLE_TREE_ID,
    fullName: "Kavya Kulkarni",
    birthDate: "2001-09-03",
    birthDatePrecision: "exact",
    deathDatePrecision: "unknown",
    notes: "Studying environmental law in Toronto.",
    createdAt: "2026-10-15T10:16:00.000Z",
    updatedAt: "2026-10-15T10:16:00.000Z"
  },
  {
    id: "p-rohan",
    treeId: SAMPLE_TREE_ID,
    fullName: "Rohan Iyer",
    birthDate: "2003-06-18",
    birthDatePrecision: "exact",
    deathDatePrecision: "unknown",
    notes: "Plays violin and studies acoustics.",
    createdAt: "2026-10-15T10:17:00.000Z",
    updatedAt: "2026-10-15T10:17:00.000Z"
  }
];
var SAMPLE_RELATIONSHIPS = [
  {
    id: "r-1",
    treeId: SAMPLE_TREE_ID,
    fromPersonId: "p-raghav",
    toPersonId: "p-savitri",
    type: "spouse_partner",
    label: "Spouse",
    createdAt: "2026-10-15T10:20:00.000Z",
    updatedAt: "2026-10-15T10:20:00.000Z"
  },
  {
    id: "r-2",
    treeId: SAMPLE_TREE_ID,
    fromPersonId: "p-raghav",
    toPersonId: "p-anand",
    type: "parent_child",
    label: "Parent",
    createdAt: "2026-10-15T10:20:00.000Z",
    updatedAt: "2026-10-15T10:20:00.000Z"
  },
  {
    id: "r-3",
    treeId: SAMPLE_TREE_ID,
    fromPersonId: "p-savitri",
    toPersonId: "p-anand",
    type: "parent_child",
    label: "Parent",
    createdAt: "2026-10-15T10:20:00.000Z",
    updatedAt: "2026-10-15T10:20:00.000Z"
  },
  {
    id: "r-4",
    treeId: SAMPLE_TREE_ID,
    fromPersonId: "p-raghav",
    toPersonId: "p-lakshmi",
    type: "parent_child",
    label: "Parent",
    createdAt: "2026-10-15T10:20:00.000Z",
    updatedAt: "2026-10-15T10:20:00.000Z"
  },
  {
    id: "r-5",
    treeId: SAMPLE_TREE_ID,
    fromPersonId: "p-savitri",
    toPersonId: "p-lakshmi",
    type: "parent_child",
    label: "Parent",
    createdAt: "2026-10-15T10:20:00.000Z",
    updatedAt: "2026-10-15T10:20:00.000Z"
  },
  {
    id: "r-6",
    treeId: SAMPLE_TREE_ID,
    fromPersonId: "p-anand",
    toPersonId: "p-meera",
    type: "spouse_partner",
    label: "Spouse",
    createdAt: "2026-10-15T10:20:00.000Z",
    updatedAt: "2026-10-15T10:20:00.000Z"
  },
  {
    id: "r-7",
    treeId: SAMPLE_TREE_ID,
    fromPersonId: "p-anand",
    toPersonId: "p-arjun",
    type: "parent_child",
    label: "Parent",
    createdAt: "2026-10-15T10:20:00.000Z",
    updatedAt: "2026-10-15T10:20:00.000Z"
  },
  {
    id: "r-8",
    treeId: SAMPLE_TREE_ID,
    fromPersonId: "p-meera",
    toPersonId: "p-arjun",
    type: "parent_child",
    label: "Parent",
    createdAt: "2026-10-15T10:20:00.000Z",
    updatedAt: "2026-10-15T10:20:00.000Z"
  },
  {
    id: "r-9",
    treeId: SAMPLE_TREE_ID,
    fromPersonId: "p-anand",
    toPersonId: "p-kavya",
    type: "parent_child",
    label: "Parent",
    createdAt: "2026-10-15T10:20:00.000Z",
    updatedAt: "2026-10-15T10:20:00.000Z"
  },
  {
    id: "r-10",
    treeId: SAMPLE_TREE_ID,
    fromPersonId: "p-meera",
    toPersonId: "p-kavya",
    type: "parent_child",
    label: "Parent",
    createdAt: "2026-10-15T10:20:00.000Z",
    updatedAt: "2026-10-15T10:20:00.000Z"
  },
  {
    id: "r-11",
    treeId: SAMPLE_TREE_ID,
    fromPersonId: "p-lakshmi",
    toPersonId: "p-vikram",
    type: "spouse_partner",
    label: "Spouse",
    createdAt: "2026-10-15T10:20:00.000Z",
    updatedAt: "2026-10-15T10:20:00.000Z"
  },
  {
    id: "r-12",
    treeId: SAMPLE_TREE_ID,
    fromPersonId: "p-lakshmi",
    toPersonId: "p-rohan",
    type: "parent_child",
    label: "Parent",
    createdAt: "2026-10-15T10:20:00.000Z",
    updatedAt: "2026-10-15T10:20:00.000Z"
  },
  {
    id: "r-13",
    treeId: SAMPLE_TREE_ID,
    fromPersonId: "p-vikram",
    toPersonId: "p-rohan",
    type: "parent_child",
    label: "Parent",
    createdAt: "2026-10-15T10:20:00.000Z",
    updatedAt: "2026-10-15T10:20:00.000Z"
  }
];
var SAMPLE_PENDING_SUBMISSION = {
  id: "sub-sample-1",
  treeId: SAMPLE_TREE_ID,
  ownerId: "demo-owner-1",
  inviteToken: "sample-demo-invite-token-8f4e2a9c7b1d6e3f5a0c8b2d",
  contributorName: "Deepa Rao (Aunt)",
  contributorEmail: "deepa.sample@example.com",
  consentConfirmed: true,
  status: "pending",
  createdAt: "2026-11-19T09:15:00.000Z",
  updatedAt: "2026-11-19T09:15:00.000Z",
  people: [
    {
      tempId: "tmp-1",
      fullName: "Venkatesh Rao",
      birthDate: "1941",
      birthDatePrecision: "year_only",
      deathDate: "2009",
      deathDatePrecision: "approximate",
      notes: "Meera\u2019s father; worked with Indian Railways in Hubballi.",
      relationType: "parent_child",
      relationLabel: "Parent",
      relationTargetId: "p-meera",
      relationTargetName: "Meera Kulkarni",
      relationDirection: "new_is_parent",
      reviewDecision: "pending"
    },
    {
      tempId: "tmp-2",
      fullName: "Savitri Kulkarni",
      alternateName: "Savitri Deshpande",
      birthDate: "1943",
      birthDatePrecision: "approximate",
      deathDatePrecision: "unknown",
      notes: "Confirming Savitri Ajji\u2019s birth year from the family wedding card.",
      reviewDecision: "pending"
    }
  ]
};

// src/shared/treeLimits.ts
var TREE_LIMITS = {
  MAX_PEOPLE_PER_TREE: 100,
  MAX_SPOUSES_PER_PERSON: 4,
  MAX_CHILDREN_PER_PERSON: 10,
  MAX_PHOTO_BYTES: 2 * 1024 * 1024,
  // 2 MB
  ALLOWED_IMAGE_MIME_TYPES: ["image/jpeg", "image/png", "image/webp"]
};
function checkCanAddPerson(existingPeople) {
  if (existingPeople.length >= TREE_LIMITS.MAX_PEOPLE_PER_TREE) {
    return {
      allowed: false,
      reason: `This tree has reached the limit of ${TREE_LIMITS.MAX_PEOPLE_PER_TREE} people. Remove a person before adding another.`
    };
  }
  return { allowed: true };
}
function checkCanAddRelationship(relationships, fromPersonId, toPersonId, type) {
  if (!fromPersonId || !toPersonId) {
    return { allowed: false, reason: "Please select both people for this relationship." };
  }
  if (fromPersonId === toPersonId) {
    return { allowed: false, reason: "A person cannot be linked in a relationship with themselves." };
  }
  const alreadyExists = relationships.some(
    (rel) => rel.type === type && (rel.fromPersonId === fromPersonId && rel.toPersonId === toPersonId || type === "spouse_partner" && rel.fromPersonId === toPersonId && rel.toPersonId === fromPersonId)
  );
  if (alreadyExists) {
    return {
      allowed: false,
      reason: "This relationship already exists between these two people."
    };
  }
  if (type === "spouse_partner") {
    const countA = relationships.filter(
      (r) => r.type === "spouse_partner" && (r.fromPersonId === fromPersonId || r.toPersonId === fromPersonId)
    ).length;
    if (countA >= TREE_LIMITS.MAX_SPOUSES_PER_PERSON) {
      return {
        allowed: false,
        reason: `Limit reached: a person can have up to ${TREE_LIMITS.MAX_SPOUSES_PER_PERSON} spouse/partner relationships in this plan.`
      };
    }
    const countB = relationships.filter(
      (r) => r.type === "spouse_partner" && (r.fromPersonId === toPersonId || r.toPersonId === toPersonId)
    ).length;
    if (countB >= TREE_LIMITS.MAX_SPOUSES_PER_PERSON) {
      return {
        allowed: false,
        reason: `Limit reached: the selected partner already has ${TREE_LIMITS.MAX_SPOUSES_PER_PERSON} spouse/partner relationships.`
      };
    }
  }
  if (type === "parent_child") {
    const childCount = relationships.filter(
      (r) => r.type === "parent_child" && r.fromPersonId === fromPersonId
    ).length;
    if (childCount >= TREE_LIMITS.MAX_CHILDREN_PER_PERSON) {
      return {
        allowed: false,
        reason: `Limit reached: a parent can have up to ${TREE_LIMITS.MAX_CHILDREN_PER_PERSON} children in this plan.`
      };
    }
  }
  return { allowed: true };
}

// src/server/supabaseStore.ts
import { createClient } from "@supabase/supabase-js";
function resolveSupabaseConfig() {
  const rawProjectId = (process.env.SUPABASE_PROJECT_ID ?? "").trim();
  const rawUrl = (process.env.SUPABASE_URL ?? "").trim();
  let url = null;
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co")) {
        url = parsed.origin;
      }
    } catch {
      url = null;
    }
  } else if (/^[a-z0-9-]{8,40}$/i.test(rawProjectId)) {
    url = `https://${rawProjectId}.supabase.co`;
  }
  const secretKey = (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const publishableKey = (process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "").trim();
  const hasSecretKey = Boolean(secretKey && !secretKey.startsWith("MY_"));
  const apiKey = hasSecretKey ? secretKey : publishableKey && !publishableKey.startsWith("MY_") ? publishableKey : null;
  return { url, apiKey, hasSecretKey };
}
var cachedClient = null;
var cachedConfigKey = "";
var schemaReadyState = false;
function getSupabaseClient() {
  const { url, apiKey, hasSecretKey } = resolveSupabaseConfig();
  if (!url || !apiKey) {
    return { client: null, hasSecretKey: false };
  }
  const key = `${url}::${hasSecretKey ? "secret" : "pub"}`;
  if (!cachedClient || cachedConfigKey !== key) {
    cachedClient = createClient(url, apiKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    cachedConfigKey = key;
  }
  return { client: cachedClient, hasSecretKey };
}
function getSupabaseStatus() {
  const { url, apiKey, hasSecretKey } = resolveSupabaseConfig();
  return {
    configured: Boolean(url && apiKey),
    hasSecretKey,
    schemaReady: schemaReadyState
  };
}
async function loadSnapshotFromSupabase(defaultDesign) {
  const { client } = getSupabaseClient();
  if (!client) {
    schemaReadyState = false;
    return null;
  }
  try {
    const [usersRes, treesRes, peopleRes, relsRes, invitesRes, subsRes, ordersRes] = await Promise.all([
      client.from("rb_users").select("id, name, email, password_hash, created_at"),
      client.from("rb_trees").select("id, owner_id, name, description, is_sample, design, created_at, updated_at"),
      client.from("rb_people").select(
        "id, tree_id, full_name, alternate_name, birth_date, birth_date_precision, death_date, death_date_precision, photo_url, notes, created_at, updated_at"
      ),
      client.from("rb_relationships").select("id, tree_id, from_person_id, to_person_id, type, label, created_at, updated_at"),
      client.from("rb_invites").select("id, tree_id, owner_id, token, is_active, share_anchor_names, created_at, updated_at"),
      client.from("rb_submissions").select(
        "id, tree_id, owner_id, invite_token, contributor_name, contributor_email, consent_confirmed, status, people, created_at, updated_at"
      ),
      client.from("rb_orders").select(
        "id, tree_id, owner_id, people_count, currency, amount, provider, status, note, created_at"
      )
    ]);
    const firstError = usersRes.error || treesRes.error || peopleRes.error || relsRes.error || invitesRes.error || subsRes.error || ordersRes.error;
    if (firstError) {
      schemaReadyState = false;
      console.warn("Supabase sync waiting on schema or secret key:", firstError.code ?? firstError.message);
      return null;
    }
    schemaReadyState = true;
    const users = (usersRes.data ?? []).map((u) => ({
      id: String(u.id),
      name: String(u.name),
      email: String(u.email),
      passwordHash: String(u.password_hash),
      createdAt: String(u.created_at)
    }));
    const trees = (treesRes.data ?? []).map((t) => ({
      id: String(t.id),
      ownerId: String(t.owner_id),
      name: String(t.name),
      description: t.description ? String(t.description) : void 0,
      isSample: Boolean(t.is_sample),
      design: {
        ...defaultDesign,
        ...t.design ?? {}
      },
      createdAt: String(t.created_at),
      updatedAt: String(t.updated_at)
    }));
    const peopleByTreeId = {};
    for (const p of peopleRes.data ?? []) {
      const treeId = String(p.tree_id);
      if (!peopleByTreeId[treeId]) peopleByTreeId[treeId] = [];
      peopleByTreeId[treeId].push({
        id: String(p.id),
        treeId,
        fullName: String(p.full_name),
        alternateName: p.alternate_name ? String(p.alternate_name) : void 0,
        birthDate: p.birth_date ? String(p.birth_date) : void 0,
        birthDatePrecision: p.birth_date_precision ?? "unknown",
        deathDate: p.death_date ? String(p.death_date) : void 0,
        deathDatePrecision: p.death_date_precision ?? "unknown",
        photoUrl: p.photo_url ? String(p.photo_url) : void 0,
        notes: p.notes ? String(p.notes) : void 0,
        createdAt: String(p.created_at),
        updatedAt: String(p.updated_at)
      });
    }
    const relationshipsByTreeId = {};
    for (const r of relsRes.data ?? []) {
      const treeId = String(r.tree_id);
      if (!relationshipsByTreeId[treeId]) relationshipsByTreeId[treeId] = [];
      relationshipsByTreeId[treeId].push({
        id: String(r.id),
        treeId,
        fromPersonId: String(r.from_person_id),
        toPersonId: String(r.to_person_id),
        type: r.type ?? "other",
        label: r.label ? String(r.label) : void 0,
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at)
      });
    }
    const invites = (invitesRes.data ?? []).map((inv) => ({
      id: String(inv.id),
      treeId: String(inv.tree_id),
      ownerId: String(inv.owner_id),
      token: String(inv.token),
      isActive: Boolean(inv.is_active),
      shareAnchorNames: Boolean(inv.share_anchor_names),
      createdAt: String(inv.created_at),
      updatedAt: String(inv.updated_at)
    }));
    const submissions = (subsRes.data ?? []).map((sub) => ({
      id: String(sub.id),
      treeId: String(sub.tree_id),
      ownerId: String(sub.owner_id),
      inviteToken: String(sub.invite_token),
      contributorName: String(sub.contributor_name),
      contributorEmail: sub.contributor_email ? String(sub.contributor_email) : void 0,
      consentConfirmed: Boolean(sub.consent_confirmed),
      status: sub.status,
      people: Array.isArray(sub.people) ? sub.people : [],
      createdAt: String(sub.created_at),
      updatedAt: String(sub.updated_at)
    }));
    const orders = (ordersRes.data ?? []).map((o) => ({
      id: String(o.id),
      treeId: String(o.tree_id),
      ownerId: String(o.owner_id),
      peopleCount: Number(o.people_count ?? 0),
      currency: o.currency === "USD" ? "USD" : "INR",
      amount: Number(o.amount ?? 0),
      provider: "unconfigured_demo",
      status: "demo_preview",
      note: String(o.note ?? ""),
      createdAt: String(o.created_at)
    }));
    return {
      users,
      trees,
      peopleByTreeId,
      relationshipsByTreeId,
      invites,
      submissions,
      orders
    };
  } catch (err) {
    schemaReadyState = false;
    console.warn("Unable to reach Supabase store, using local persistence:", err instanceof Error ? err.message : err);
    return null;
  }
}
async function syncUserToSupabase(user) {
  const { client } = getSupabaseClient();
  if (!client || !schemaReadyState) return;
  try {
    const { error } = await client.from("rb_users").upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      password_hash: user.passwordHash,
      created_at: user.createdAt
    });
    if (error) console.warn("Supabase user sync warning:", error.code ?? error.message);
  } catch (err) {
    console.warn("Supabase user sync skipped:", err instanceof Error ? err.message : err);
  }
}
async function syncTreeBundleToSupabase(tree, people, relationships) {
  const { client } = getSupabaseClient();
  if (!client || !schemaReadyState) return;
  try {
    const { error: treeErr } = await client.from("rb_trees").upsert({
      id: tree.id,
      owner_id: tree.ownerId,
      name: tree.name,
      description: tree.description ?? null,
      is_sample: Boolean(tree.isSample),
      design: tree.design,
      created_at: tree.createdAt,
      updated_at: tree.updatedAt
    });
    if (treeErr) {
      console.warn("Supabase tree upsert warning:", treeErr.code ?? treeErr.message);
      return;
    }
    await client.from("rb_relationships").delete().eq("tree_id", tree.id);
    await client.from("rb_people").delete().eq("tree_id", tree.id);
    if (people.length > 0) {
      const { error: peopleErr } = await client.from("rb_people").insert(
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
          updated_at: p.updatedAt
        }))
      );
      if (peopleErr) {
        console.warn("Supabase people sync warning:", peopleErr.code ?? peopleErr.message);
        return;
      }
    }
    if (relationships.length > 0) {
      const { error: relErr } = await client.from("rb_relationships").insert(
        relationships.map((r) => ({
          id: r.id,
          tree_id: tree.id,
          from_person_id: r.fromPersonId,
          to_person_id: r.toPersonId,
          type: r.type,
          label: r.label ?? null,
          created_at: r.createdAt,
          updated_at: r.updatedAt
        }))
      );
      if (relErr) {
        console.warn("Supabase relationships sync warning:", relErr.code ?? relErr.message);
      }
    }
  } catch (err) {
    console.warn("Supabase tree sync skipped:", err instanceof Error ? err.message : err);
  }
}
async function deleteTreeFromSupabase(treeId) {
  const { client } = getSupabaseClient();
  if (!client || !schemaReadyState) return;
  try {
    const { error } = await client.from("rb_trees").delete().eq("id", treeId);
    if (error) console.warn("Supabase tree delete warning:", error.code ?? error.message);
  } catch (err) {
    console.warn("Supabase tree delete skipped:", err instanceof Error ? err.message : err);
  }
}
async function syncInviteToSupabase(invite) {
  const { client } = getSupabaseClient();
  if (!client || !schemaReadyState) return;
  try {
    await client.from("rb_invites").delete().eq("tree_id", invite.treeId);
    const { error } = await client.from("rb_invites").upsert({
      id: invite.id,
      tree_id: invite.treeId,
      owner_id: invite.ownerId,
      token: invite.token,
      is_active: invite.isActive,
      share_anchor_names: invite.shareAnchorNames,
      created_at: invite.createdAt,
      updated_at: invite.updatedAt
    });
    if (error) console.warn("Supabase invite sync warning:", error.code ?? error.message);
  } catch (err) {
    console.warn("Supabase invite sync skipped:", err instanceof Error ? err.message : err);
  }
}
async function syncSubmissionToSupabase(submission) {
  const { client } = getSupabaseClient();
  if (!client || !schemaReadyState) return;
  try {
    const { error } = await client.from("rb_submissions").upsert({
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
      updated_at: submission.updatedAt
    });
    if (error) console.warn("Supabase submission sync warning:", error.code ?? error.message);
  } catch (err) {
    console.warn("Supabase submission sync skipped:", err instanceof Error ? err.message : err);
  }
}
async function syncOrderToSupabase(order) {
  const { client } = getSupabaseClient();
  if (!client || !schemaReadyState) return;
  try {
    const { error } = await client.from("rb_orders").upsert({
      id: order.id,
      tree_id: order.treeId,
      owner_id: order.ownerId,
      people_count: order.peopleCount,
      currency: order.currency,
      amount: order.amount,
      provider: order.provider,
      status: order.status,
      note: order.note,
      created_at: order.createdAt
    });
    if (error) console.warn("Supabase order sync warning:", error.code ?? error.message);
  } catch (err) {
    console.warn("Supabase order sync skipped:", err instanceof Error ? err.message : err);
  }
}
async function pushSnapshotToSupabase(snapshot) {
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

// src/server/createApp.ts
var DATA_DIR = process.env.NETLIFY ? path.join("/tmp", "roots-branches-data") : path.resolve(process.cwd(), ".data");
var STORE_FILE = path.join(DATA_DIR, "store.json");
var SESSION_SECRET = process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16 ? process.env.SESSION_SECRET : crypto.randomBytes(32).toString("hex");
function createApiApp(options = {}) {
  const usersById = /* @__PURE__ */ new Map();
  const userIdByEmail = /* @__PURE__ */ new Map();
  const treesById = /* @__PURE__ */ new Map();
  const peopleByTreeId = /* @__PURE__ */ new Map();
  const relationshipsByTreeId = /* @__PURE__ */ new Map();
  const invitesByToken = /* @__PURE__ */ new Map();
  const submissionsById = /* @__PURE__ */ new Map();
  const ordersById = /* @__PURE__ */ new Map();
  function buildSnapshot() {
    return {
      users: Array.from(usersById.values()),
      trees: Array.from(treesById.values()),
      peopleByTreeId: Object.fromEntries(peopleByTreeId.entries()),
      relationshipsByTreeId: Object.fromEntries(relationshipsByTreeId.entries()),
      invites: Array.from(invitesByToken.values()),
      submissions: Array.from(submissionsById.values()),
      orders: Array.from(ordersById.values())
    };
  }
  function saveStoreToDisk() {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const payload = {
        version: 1,
        ...buildSnapshot()
      };
      const tmpFile = `${STORE_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(payload, null, 2), "utf8");
      fs.renameSync(tmpFile, STORE_FILE);
    } catch {
    }
  }
  function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const derived = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${derived}`;
  }
  function verifyPassword(password, storedHash) {
    const [salt, keyHex] = storedHash.split(":");
    if (!salt || !keyHex) return false;
    const derived = crypto.scryptSync(password, salt, 64);
    const storedBuf = Buffer.from(keyHex, "hex");
    if (derived.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(derived, storedBuf);
  }
  function signToken(userId) {
    const payload = Buffer.from(
      JSON.stringify({ uid: userId, iat: Date.now(), exp: Date.now() + 1e3 * 60 * 60 * 24 * 7 })
    ).toString("base64url");
    const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
    return `${payload}.${sig}`;
  }
  function verifyToken(token) {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payload, sig] = parts;
    const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }
    try {
      const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
      if (!parsed.uid || !parsed.exp || parsed.exp < Date.now()) return null;
      return parsed.uid;
    } catch {
      return null;
    }
  }
  function generateSecureInviteToken() {
    return crypto.randomBytes(24).toString("base64url");
  }
  function sanitizeString(value, maxLen) {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLen);
  }
  function validateDatePrecision(value) {
    if (value === "exact" || value === "approximate" || value === "year_only" || value === "unknown") {
      return value;
    }
    return "unknown";
  }
  function validateRelationshipType(value) {
    if (value === "parent_child" || value === "spouse_partner" || value === "other") {
      return value;
    }
    return "other";
  }
  function validatePhotoUrl(url) {
    if (url === void 0 || url === null || url === "") {
      return { valid: true, value: void 0 };
    }
    if (typeof url !== "string") {
      return { valid: false, error: "Photo must be a valid image string." };
    }
    if (url.startsWith("/src/assets/images/") && !url.includes("..")) {
      return { valid: true, value: url };
    }
    const match = url.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) {
      return {
        valid: false,
        error: "Only JPEG, PNG, or WebP images are supported."
      };
    }
    const base64Data = match[2];
    const approxBytes = Math.floor(base64Data.length * 3 / 4);
    if (approxBytes > TREE_LIMITS.MAX_PHOTO_BYTES) {
      return {
        valid: false,
        error: `Photo exceeds the ${Math.round(TREE_LIMITS.MAX_PHOTO_BYTES / (1024 * 1024))} MB limit.`
      };
    }
    return { valid: true, value: url };
  }
  function seedDemoData() {
    const demoUserId = "demo-owner-1";
    const demoUser = {
      id: demoUserId,
      name: "Meera Kulkarni (Demo Owner)",
      email: "demo@rootsandbranches.example",
      passwordHash: hashPassword("demo-preview-only"),
      createdAt: "2026-10-15T09:50:00.000Z"
    };
    usersById.set(demoUserId, demoUser);
    userIdByEmail.set(demoUser.email, demoUserId);
    treesById.set(SAMPLE_TREE_ID, structuredClone(SAMPLE_TREE));
    peopleByTreeId.set(SAMPLE_TREE_ID, structuredClone(SAMPLE_PEOPLE));
    relationshipsByTreeId.set(SAMPLE_TREE_ID, structuredClone(SAMPLE_RELATIONSHIPS));
    const sampleInvite = {
      id: "inv-sample-1",
      treeId: SAMPLE_TREE_ID,
      ownerId: demoUserId,
      token: SAMPLE_PENDING_SUBMISSION.inviteToken,
      isActive: true,
      shareAnchorNames: true,
      createdAt: "2026-11-10T10:00:00.000Z",
      updatedAt: "2026-11-10T10:00:00.000Z"
    };
    invitesByToken.set(sampleInvite.token, sampleInvite);
    submissionsById.set(SAMPLE_PENDING_SUBMISSION.id, structuredClone(SAMPLE_PENDING_SUBMISSION));
  }
  function loadStoreFromDisk() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, "utf8");
        const parsed = JSON.parse(raw);
        for (const u of parsed.users ?? []) {
          usersById.set(u.id, u);
          userIdByEmail.set(u.email.toLowerCase(), u.id);
        }
        for (const t of parsed.trees ?? []) {
          treesById.set(t.id, {
            ...t,
            design: { ...DEFAULT_DESIGN_CONFIG, ...t.design ?? {} }
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
        if (!usersById.has("demo-owner-1")) {
          seedDemoData();
          saveStoreToDisk();
        }
        return;
      }
    } catch {
    }
    seedDemoData();
    saveStoreToDisk();
  }
  loadStoreFromDisk();
  let initPromise = null;
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
  function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      res.status(401).json({ error: "Please sign in to access your family trees." });
      return;
    }
    const token = header.slice("Bearer ".length).trim();
    const uid = verifyToken(token);
    if (!uid) {
      res.status(401).json({ error: "Your session has expired. Please sign in again." });
      return;
    }
    const stored = usersById.get(uid);
    if (!stored) {
      res.status(401).json({ error: "Account not found. Please sign in again." });
      return;
    }
    const { passwordHash: _ignored, ...safeUser } = stored;
    req.user = safeUser;
    next();
  }
  function getOwnedTree(treeId, ownerId) {
    const tree = treesById.get(treeId);
    if (!tree || tree.ownerId !== ownerId) return null;
    return tree;
  }
  const app = express();
  app.use(express.json({ limit: "8mb" }));
  if (options.serverless) {
    app.use((req, _res, next) => {
      if (req.url.startsWith("/.netlify/functions/api")) {
        const rest = req.url.slice("/.netlify/functions/api".length);
        req.url = `/api${rest.startsWith("/") ? rest : rest ? `/${rest}` : ""}`;
      } else if (!req.url.startsWith("/api/") && req.url !== "/api") {
        req.url = `/api${req.url.startsWith("/") ? req.url : `/${req.url}`}`;
      }
      next();
    });
  }
  app.use("/api", async (_req, _res, next) => {
    await ensureInitialized();
    next();
  });
  app.get("/api/health", (_req, res) => {
    const sb = getSupabaseStatus();
    res.json({
      ok: true,
      mode: sb.schemaReady ? "supabase" : "local_demo",
      persistence: sb.schemaReady ? "supabase" : "local_file",
      runtime: options.serverless ? "netlify_serverless" : "node_server",
      supabaseConfigured: sb.configured,
      supabaseSecretConfigured: sb.hasSecretKey,
      supabaseSchemaReady: sb.schemaReady,
      firebaseConfigured: false,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
    });
  });
  app.get("/api/sample-tree", (_req, res) => {
    res.json({
      tree: SAMPLE_TREE,
      people: SAMPLE_PEOPLE,
      relationships: SAMPLE_RELATIONSHIPS,
      fictional: true
    });
  });
  app.post("/api/auth/register", async (req, res) => {
    const name = sanitizeString(req.body?.name, 80);
    const email = sanitizeString(req.body?.email, 120).toLowerCase();
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!name || !email || !email.includes("@")) {
      res.status(400).json({ error: "Please enter your name and a valid email address." });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Please choose a password of at least 6 characters." });
      return;
    }
    if (userIdByEmail.has(email)) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const userId = `user-${crypto.randomUUID()}`;
    const newUser = {
      id: userId,
      name,
      email,
      passwordHash: hashPassword(password),
      createdAt: now
    };
    usersById.set(userId, newUser);
    userIdByEmail.set(email, userId);
    saveStoreToDisk();
    await syncUserToSupabase(newUser);
    const { passwordHash: _ignored, ...safeUser } = newUser;
    res.status(201).json({
      token: signToken(userId),
      user: safeUser,
      mode: "local_demo"
    });
  });
  app.post("/api/auth/login", (req, res) => {
    const email = sanitizeString(req.body?.email, 120).toLowerCase();
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const userId = userIdByEmail.get(email);
    const stored = userId ? usersById.get(userId) : void 0;
    if (!stored || !verifyPassword(password, stored.passwordHash)) {
      res.status(401).json({ error: "Email or password did not match." });
      return;
    }
    const { passwordHash: _ignored, ...safeUser } = stored;
    res.json({
      token: signToken(stored.id),
      user: safeUser,
      mode: "local_demo"
    });
  });
  app.post("/api/auth/demo", (_req, res) => {
    const stored = usersById.get("demo-owner-1");
    if (!stored) {
      res.status(500).json({ error: "Demo account unavailable." });
      return;
    }
    const { passwordHash: _ignored, ...safeUser } = stored;
    res.json({
      token: signToken(stored.id),
      user: safeUser,
      mode: "local_demo"
    });
  });
  app.get("/api/auth/me", requireAuth, (req, res) => {
    res.json({ user: req.user, mode: "local_demo" });
  });
  app.get("/api/trees", requireAuth, (req, res) => {
    const ownerId = req.user.id;
    const list = Array.from(treesById.values()).filter((t) => t.ownerId === ownerId).map((tree) => {
      const peopleCount = (peopleByTreeId.get(tree.id) ?? []).length;
      const pendingSubmissionsCount = Array.from(submissionsById.values()).filter(
        (s) => s.treeId === tree.id && (s.status === "pending" || s.status === "partially_reviewed")
      ).length;
      return {
        ...tree,
        peopleCount,
        pendingSubmissionsCount
      };
    }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    res.json({ trees: list });
  });
  app.post("/api/trees", requireAuth, async (req, res) => {
    const ownerId = req.user.id;
    const name = sanitizeString(req.body?.name, 100);
    const description = sanitizeString(req.body?.description, 300);
    if (!name) {
      res.status(400).json({ error: "Please provide a name for your family tree." });
      return;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const treeId = `tree-${crypto.randomUUID()}`;
    const tree = {
      id: treeId,
      ownerId,
      name,
      description: description || void 0,
      design: { ...DEFAULT_DESIGN_CONFIG },
      createdAt: now,
      updatedAt: now
    };
    treesById.set(treeId, tree);
    peopleByTreeId.set(treeId, []);
    relationshipsByTreeId.set(treeId, []);
    saveStoreToDisk();
    await syncTreeBundleToSupabase(tree, [], []);
    res.status(201).json({ tree, people: [], relationships: [] });
  });
  app.post("/api/trees/import", requireAuth, async (req, res) => {
    const ownerId = req.user.id;
    const name = sanitizeString(req.body?.name, 100);
    const description = sanitizeString(req.body?.description, 300);
    const rawPeople = Array.isArray(req.body?.people) ? req.body.people : [];
    const rawRels = Array.isArray(req.body?.relationships) ? req.body.relationships : [];
    if (!name) {
      res.status(400).json({ error: "Imported tree must include a valid tree name." });
      return;
    }
    if (rawPeople.length > TREE_LIMITS.MAX_PEOPLE_PER_TREE) {
      res.status(400).json({
        error: `Imported tree exceeds the ${TREE_LIMITS.MAX_PEOPLE_PER_TREE}-person limit.`
      });
      return;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const treeId = `tree-${crypto.randomUUID()}`;
    const idMap = /* @__PURE__ */ new Map();
    const importedPeople = [];
    for (const item of rawPeople) {
      const fullName = sanitizeString(item?.fullName, 120);
      if (!fullName) {
        res.status(400).json({ error: "Every imported person must have a full name." });
        return;
      }
      const photoCheck = validatePhotoUrl(item?.photoUrl);
      if (!photoCheck.valid) {
        res.status(400).json({ error: photoCheck.error ?? "Invalid imported photo." });
        return;
      }
      const origId = sanitizeString(item?.id, 128) || `orig-${importedPeople.length}`;
      const nextId = `p-${crypto.randomUUID()}`;
      idMap.set(origId, nextId);
      importedPeople.push({
        id: nextId,
        treeId,
        fullName,
        alternateName: sanitizeString(item?.alternateName, 120) || void 0,
        birthDate: sanitizeString(item?.birthDate, 40) || void 0,
        birthDatePrecision: validateDatePrecision(item?.birthDatePrecision),
        deathDate: sanitizeString(item?.deathDate, 40) || void 0,
        deathDatePrecision: validateDatePrecision(item?.deathDatePrecision),
        photoUrl: photoCheck.value,
        notes: sanitizeString(item?.notes, 1e3) || void 0,
        createdAt: sanitizeString(item?.createdAt, 40) || now,
        updatedAt: now
      });
    }
    const importedRels = [];
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
        label: sanitizeString(rel?.label, 60) || void 0,
        createdAt: sanitizeString(rel?.createdAt, 40) || now,
        updatedAt: now
      });
    }
    const incomingDesign = req.body?.design;
    const tree = {
      id: treeId,
      ownerId,
      name,
      description: description || void 0,
      design: { ...DEFAULT_DESIGN_CONFIG, ...incomingDesign ?? {} },
      createdAt: now,
      updatedAt: now
    };
    treesById.set(treeId, tree);
    peopleByTreeId.set(treeId, importedPeople);
    relationshipsByTreeId.set(treeId, importedRels);
    saveStoreToDisk();
    await syncTreeBundleToSupabase(tree, importedPeople, importedRels);
    res.status(201).json({ tree, people: importedPeople, relationships: importedRels });
  });
  app.get("/api/trees/:treeId", requireAuth, (req, res) => {
    const tree = getOwnedTree(req.params.treeId, req.user.id);
    if (!tree) {
      res.status(404).json({ error: "Family tree not found or you do not have access." });
      return;
    }
    const people = peopleByTreeId.get(tree.id) ?? [];
    const relationships = relationshipsByTreeId.get(tree.id) ?? [];
    const invite = Array.from(invitesByToken.values()).find((inv) => inv.treeId === tree.id) ?? null;
    const pendingSubmissionsCount = Array.from(submissionsById.values()).filter(
      (s) => s.treeId === tree.id && (s.status === "pending" || s.status === "partially_reviewed")
    ).length;
    res.json({
      tree,
      people,
      relationships,
      inviteLink: invite,
      pendingSubmissionsCount
    });
  });
  app.patch("/api/trees/:treeId", requireAuth, async (req, res) => {
    const tree = getOwnedTree(req.params.treeId, req.user.id);
    if (!tree) {
      res.status(404).json({ error: "Family tree not found." });
      return;
    }
    const nextName = req.body?.name !== void 0 ? sanitizeString(req.body.name, 100) : tree.name;
    if (!nextName) {
      res.status(400).json({ error: "Tree name cannot be empty." });
      return;
    }
    const nextDescription = req.body?.description !== void 0 ? sanitizeString(req.body.description, 300) || void 0 : tree.description;
    const incomingDesign = req.body?.design;
    const updatedDesign = incomingDesign ? {
      style: incomingDesign.style ?? tree.design.style,
      orientation: incomingDesign.orientation ?? tree.design.orientation,
      fontFamily: incomingDesign.fontFamily ?? tree.design.fontFamily,
      textSize: incomingDesign.textSize ?? tree.design.textSize,
      backgroundColor: sanitizeString(incomingDesign.backgroundColor, 24) || tree.design.backgroundColor,
      lineColor: sanitizeString(incomingDesign.lineColor, 24) || tree.design.lineColor,
      cardColor: sanitizeString(incomingDesign.cardColor, 24) || tree.design.cardColor,
      cardTextColor: sanitizeString(incomingDesign.cardTextColor, 24) || tree.design.cardTextColor,
      accentColor: sanitizeString(incomingDesign.accentColor, 24) || tree.design.accentColor,
      seatingModel: incomingDesign.seatingModel ?? tree.design.seatingModel
    } : tree.design;
    const updatedTree = {
      ...tree,
      name: nextName,
      description: nextDescription,
      design: updatedDesign,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
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
  app.put("/api/trees/:treeId/snapshot", requireAuth, async (req, res) => {
    const tree = getOwnedTree(req.params.treeId, req.user.id);
    if (!tree) {
      res.status(404).json({ error: "Family tree not found." });
      return;
    }
    const rawPeople = Array.isArray(req.body?.people) ? req.body.people : null;
    const rawRels = Array.isArray(req.body?.relationships) ? req.body.relationships : null;
    if (!rawPeople || !rawRels) {
      res.status(400).json({ error: "Invalid tree payload." });
      return;
    }
    if (rawPeople.length > TREE_LIMITS.MAX_PEOPLE_PER_TREE) {
      res.status(400).json({
        error: `A tree can include up to ${TREE_LIMITS.MAX_PEOPLE_PER_TREE} people.`
      });
      return;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const validatedPeople = [];
    const personIds = /* @__PURE__ */ new Set();
    for (const item of rawPeople) {
      const id = sanitizeString(item?.id, 128) || `p-${crypto.randomUUID()}`;
      const fullName = sanitizeString(item?.fullName, 120);
      if (!fullName) {
        res.status(400).json({ error: "Every person must have a full name." });
        return;
      }
      const photoCheck = validatePhotoUrl(item?.photoUrl);
      if (!photoCheck.valid) {
        res.status(400).json({ error: photoCheck.error ?? "Invalid photo." });
        return;
      }
      personIds.add(id);
      validatedPeople.push({
        id,
        treeId: tree.id,
        fullName,
        alternateName: sanitizeString(item?.alternateName, 120) || void 0,
        birthDate: sanitizeString(item?.birthDate, 40) || void 0,
        birthDatePrecision: validateDatePrecision(item?.birthDatePrecision),
        deathDate: sanitizeString(item?.deathDate, 40) || void 0,
        deathDatePrecision: validateDatePrecision(item?.deathDatePrecision),
        photoUrl: photoCheck.value,
        notes: sanitizeString(item?.notes, 1e3) || void 0,
        createdAt: sanitizeString(item?.createdAt, 40) || now,
        updatedAt: now
      });
    }
    const validatedRels = [];
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
        label: sanitizeString(rel?.label, 60) || void 0,
        createdAt: sanitizeString(rel?.createdAt, 40) || now,
        updatedAt: now
      });
    }
    peopleByTreeId.set(tree.id, validatedPeople);
    relationshipsByTreeId.set(tree.id, validatedRels);
    const nextDesign = req.body?.design ? { ...tree.design, ...req.body.design } : tree.design;
    const updatedTree = {
      ...tree,
      name: req.body?.name ? sanitizeString(req.body.name, 100) || tree.name : tree.name,
      design: nextDesign,
      updatedAt: now
    };
    treesById.set(tree.id, updatedTree);
    saveStoreToDisk();
    await syncTreeBundleToSupabase(updatedTree, validatedPeople, validatedRels);
    res.json({
      tree: updatedTree,
      people: validatedPeople,
      relationships: validatedRels
    });
  });
  app.post("/api/trees/:treeId/duplicate", requireAuth, async (req, res) => {
    const source = getOwnedTree(req.params.treeId, req.user.id);
    if (!source) {
      res.status(404).json({ error: "Family tree not found." });
      return;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newTreeId = `tree-${crypto.randomUUID()}`;
    const idMap = /* @__PURE__ */ new Map();
    const sourcePeople = peopleByTreeId.get(source.id) ?? [];
    const clonedPeople = sourcePeople.map((p) => {
      const nextId = `p-${crypto.randomUUID()}`;
      idMap.set(p.id, nextId);
      return {
        ...p,
        id: nextId,
        treeId: newTreeId,
        createdAt: now,
        updatedAt: now
      };
    });
    const sourceRels = relationshipsByTreeId.get(source.id) ?? [];
    const clonedRels = sourceRels.filter((r) => idMap.has(r.fromPersonId) && idMap.has(r.toPersonId)).map((r) => ({
      ...r,
      id: `r-${crypto.randomUUID()}`,
      treeId: newTreeId,
      fromPersonId: idMap.get(r.fromPersonId),
      toPersonId: idMap.get(r.toPersonId),
      createdAt: now,
      updatedAt: now
    }));
    const duplicatedTree = {
      ...source,
      id: newTreeId,
      name: `${source.name} (Copy)`.slice(0, 100),
      isSample: false,
      design: { ...source.design },
      createdAt: now,
      updatedAt: now
    };
    treesById.set(newTreeId, duplicatedTree);
    peopleByTreeId.set(newTreeId, clonedPeople);
    relationshipsByTreeId.set(newTreeId, clonedRels);
    saveStoreToDisk();
    await syncTreeBundleToSupabase(duplicatedTree, clonedPeople, clonedRels);
    res.status(201).json({ tree: duplicatedTree });
  });
  app.delete("/api/trees/:treeId", requireAuth, async (req, res) => {
    const tree = getOwnedTree(req.params.treeId, req.user.id);
    if (!tree) {
      res.status(404).json({ error: "Family tree not found." });
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
  app.delete("/api/trees/:treeId/photos", requireAuth, async (req, res) => {
    const tree = getOwnedTree(req.params.treeId, req.user.id);
    if (!tree) {
      res.status(404).json({ error: "Family tree not found." });
      return;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const people = (peopleByTreeId.get(tree.id) ?? []).map((p) => ({
      ...p,
      photoUrl: void 0,
      updatedAt: now
    }));
    peopleByTreeId.set(tree.id, people);
    const clearedTree = { ...tree, updatedAt: now };
    treesById.set(tree.id, clearedTree);
    saveStoreToDisk();
    await syncTreeBundleToSupabase(clearedTree, people, relationshipsByTreeId.get(tree.id) ?? []);
    res.json({ cleared: true, people });
  });
  app.post("/api/trees/:treeId/invite", requireAuth, async (req, res) => {
    const tree = getOwnedTree(req.params.treeId, req.user.id);
    if (!tree) {
      res.status(404).json({ error: "Family tree not found." });
      return;
    }
    const existing = Array.from(invitesByToken.values()).find((inv) => inv.treeId === tree.id);
    const regenerate = Boolean(req.body?.regenerate);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (existing && !regenerate) {
      const updated = {
        ...existing,
        isActive: typeof req.body?.isActive === "boolean" ? req.body.isActive : existing.isActive,
        shareAnchorNames: typeof req.body?.shareAnchorNames === "boolean" ? req.body.shareAnchorNames : existing.shareAnchorNames,
        updatedAt: now
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
    const newInvite = {
      id: `inv-${crypto.randomUUID()}`,
      treeId: tree.id,
      ownerId: req.user.id,
      token,
      isActive: typeof req.body?.isActive === "boolean" ? req.body.isActive : true,
      shareAnchorNames: typeof req.body?.shareAnchorNames === "boolean" ? req.body.shareAnchorNames : true,
      createdAt: now,
      updatedAt: now
    };
    invitesByToken.set(token, newInvite);
    saveStoreToDisk();
    await syncInviteToSupabase(newInvite);
    res.status(201).json({ inviteLink: newInvite });
  });
  app.get("/api/invites/:token", (req, res) => {
    const token = sanitizeString(req.params.token, 128);
    if (!/^[a-zA-Z0-9_-]{20,128}$/.test(token)) {
      res.status(404).json({
        active: false,
        error: "This invite link is not valid. Please ask the family tree owner for a new link."
      });
      return;
    }
    const invite = invitesByToken.get(token);
    if (!invite || !invite.isActive) {
      res.status(403).json({
        active: false,
        error: "Submissions via this invite link are currently closed or the link has been replaced."
      });
      return;
    }
    const tree = treesById.get(invite.treeId);
    if (!tree) {
      res.status(404).json({
        active: false,
        error: "This family tree is no longer available."
      });
      return;
    }
    const anchorPeople = invite.shareAnchorNames ? (peopleByTreeId.get(tree.id) ?? []).map((p) => ({
      id: p.id,
      fullName: p.fullName
    })) : [];
    res.json({
      active: true,
      treeName: tree.name,
      shareAnchorNames: invite.shareAnchorNames,
      anchorPeople
    });
  });
  app.post("/api/invites/:token/submit", async (req, res) => {
    const token = sanitizeString(req.params.token, 128);
    const invite = invitesByToken.get(token);
    if (!invite || !invite.isActive) {
      res.status(403).json({
        error: "This invite link is disabled or invalid. No details were saved."
      });
      return;
    }
    const tree = treesById.get(invite.treeId);
    if (!tree) {
      res.status(404).json({ error: "Target family tree not found." });
      return;
    }
    const contributorName = sanitizeString(req.body?.contributorName, 100);
    const contributorEmail = sanitizeString(req.body?.contributorEmail, 120) || void 0;
    const consentConfirmed = req.body?.consentConfirmed === true;
    const rawPeople = Array.isArray(req.body?.people) ? req.body.people : [];
    if (!contributorName) {
      res.status(400).json({ error: "Please enter your name so the tree owner knows who sent this." });
      return;
    }
    if (!consentConfirmed) {
      res.status(400).json({
        error: "Please check the permission box confirming you may share these family details."
      });
      return;
    }
    if (rawPeople.length === 0 || rawPeople.length > 25) {
      res.status(400).json({ error: "Please include between 1 and 25 family members per submission." });
      return;
    }
    const submittedPeople = [];
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
        alternateName: sanitizeString(item?.alternateName, 120) || void 0,
        birthDate: sanitizeString(item?.birthDate, 40) || void 0,
        birthDatePrecision: validateDatePrecision(item?.birthDatePrecision),
        deathDate: sanitizeString(item?.deathDate, 40) || void 0,
        deathDatePrecision: validateDatePrecision(item?.deathDatePrecision),
        photoUrl: photoCheck.value,
        notes: sanitizeString(item?.notes, 1e3) || void 0,
        relationType: item?.relationType ? validateRelationshipType(item.relationType) : void 0,
        relationLabel: sanitizeString(item?.relationLabel, 60) || void 0,
        relationTargetId: sanitizeString(item?.relationTargetId, 128) || void 0,
        relationTargetName: sanitizeString(item?.relationTargetName, 120) || void 0,
        relationDirection: item?.relationDirection === "new_is_parent" || item?.relationDirection === "new_is_child" ? item.relationDirection : void 0,
        reviewDecision: "pending"
      });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const submission = {
      id: `sub-${crypto.randomUUID()}`,
      treeId: tree.id,
      ownerId: tree.ownerId,
      inviteToken: invite.token,
      contributorName,
      contributorEmail,
      consentConfirmed: true,
      status: "pending",
      people: submittedPeople,
      createdAt: now,
      updatedAt: now
    };
    submissionsById.set(submission.id, submission);
    saveStoreToDisk();
    await syncSubmissionToSupabase(submission);
    res.status(201).json({
      submissionId: submission.id,
      submittedCount: submittedPeople.length,
      status: "pending"
    });
  });
  app.get("/api/trees/:treeId/submissions", requireAuth, (req, res) => {
    const tree = getOwnedTree(req.params.treeId, req.user.id);
    if (!tree) {
      res.status(404).json({ error: "Family tree not found." });
      return;
    }
    const list = Array.from(submissionsById.values()).filter((s) => s.treeId === tree.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ submissions: list });
  });
  app.post(
    "/api/trees/:treeId/submissions/:submissionId/review",
    requireAuth,
    async (req, res) => {
      const tree = getOwnedTree(req.params.treeId, req.user.id);
      if (!tree) {
        res.status(404).json({ error: "Family tree not found." });
        return;
      }
      const submission = submissionsById.get(req.params.submissionId);
      if (!submission || submission.treeId !== tree.id) {
        res.status(404).json({ error: "Submission not found." });
        return;
      }
      const action = req.body?.action;
      if (action !== "approve" && action !== "reject") {
        res.status(400).json({ error: "Invalid review action." });
        return;
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      if (action === "reject") {
        const updated = {
          ...submission,
          status: "rejected",
          people: submission.people.map((p) => ({
            ...p,
            reviewDecision: p.reviewDecision === "approved" ? "approved" : "rejected"
          })),
          updatedAt: now
        };
        submissionsById.set(submission.id, updated);
        saveStoreToDisk();
        await syncSubmissionToSupabase(updated);
        res.json({
          submission: updated,
          people: peopleByTreeId.get(tree.id) ?? [],
          relationships: relationshipsByTreeId.get(tree.id) ?? []
        });
        return;
      }
      const selectedTempIds = Array.isArray(req.body?.selectedTempIds) ? req.body.selectedTempIds : submission.people.filter((p) => p.reviewDecision !== "approved").map((p) => p.tempId);
      const editedPeopleMap = /* @__PURE__ */ new Map();
      if (Array.isArray(req.body?.editedPeople)) {
        for (const ep of req.body.editedPeople) {
          if (ep?.tempId) editedPeopleMap.set(ep.tempId, ep);
        }
      }
      const currentPeople = [...peopleByTreeId.get(tree.id) ?? []];
      const currentRels = [...relationshipsByTreeId.get(tree.id) ?? []];
      const tempIdToCreatedPersonId = /* @__PURE__ */ new Map();
      const warnings = [];
      const nextSubmissionPeople = submission.people.map((orig) => {
        if (!selectedTempIds.includes(orig.tempId) || orig.reviewDecision === "approved") {
          return orig;
        }
        const merged = {
          ...orig,
          ...editedPeopleMap.get(orig.tempId) ?? {}
        };
        if (merged.linkToExistingPersonId && currentPeople.some((p) => p.id === merged.linkToExistingPersonId)) {
          tempIdToCreatedPersonId.set(orig.tempId, merged.linkToExistingPersonId);
          return {
            ...merged,
            reviewDecision: "approved"
          };
        }
        const limitCheck = checkCanAddPerson(currentPeople);
        if (!limitCheck.allowed) {
          warnings.push(limitCheck.reason);
          return orig;
        }
        const fullName = sanitizeString(merged.fullName, 120);
        if (!fullName) {
          warnings.push("Skipped an entry without a valid full name.");
          return orig;
        }
        const newPersonId = `p-${crypto.randomUUID()}`;
        const newPerson = {
          id: newPersonId,
          treeId: tree.id,
          fullName,
          alternateName: sanitizeString(merged.alternateName, 120) || void 0,
          birthDate: sanitizeString(merged.birthDate, 40) || void 0,
          birthDatePrecision: validateDatePrecision(merged.birthDatePrecision),
          deathDate: sanitizeString(merged.deathDate, 40) || void 0,
          deathDatePrecision: validateDatePrecision(merged.deathDatePrecision),
          photoUrl: merged.photoUrl,
          notes: sanitizeString(merged.notes, 1e3) || void 0,
          createdAt: now,
          updatedAt: now
        };
        currentPeople.push(newPerson);
        tempIdToCreatedPersonId.set(orig.tempId, newPersonId);
        return {
          ...merged,
          reviewDecision: "approved"
        };
      });
      for (const sp of nextSubmissionPeople) {
        if (sp.reviewDecision !== "approved" || !sp.relationTargetId || !sp.relationType) {
          continue;
        }
        const sourcePersonId = tempIdToCreatedPersonId.get(sp.tempId);
        if (!sourcePersonId) continue;
        const resolvedTargetId = tempIdToCreatedPersonId.get(sp.relationTargetId) ?? (currentPeople.some((p) => p.id === sp.relationTargetId) ? sp.relationTargetId : void 0);
        if (!resolvedTargetId) continue;
        let fromPersonId = sourcePersonId;
        let toPersonId = resolvedTargetId;
        if (sp.relationType === "parent_child" && sp.relationDirection === "new_is_child") {
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
          if (relCheck.reason && !relCheck.reason.includes("already exists")) {
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
          label: sp.relationLabel || void 0,
          createdAt: now,
          updatedAt: now
        });
      }
      const allApproved = nextSubmissionPeople.every((p) => p.reviewDecision === "approved");
      const anyApproved = nextSubmissionPeople.some((p) => p.reviewDecision === "approved");
      const updatedSubmission = {
        ...submission,
        people: nextSubmissionPeople,
        status: allApproved ? "approved" : anyApproved ? "partially_reviewed" : submission.status,
        updatedAt: now
      };
      peopleByTreeId.set(tree.id, currentPeople);
      relationshipsByTreeId.set(tree.id, currentRels);
      const updatedAfterReview = { ...tree, updatedAt: now };
      treesById.set(tree.id, updatedAfterReview);
      submissionsById.set(submission.id, updatedSubmission);
      saveStoreToDisk();
      await syncTreeBundleToSupabase(updatedAfterReview, currentPeople, currentRels);
      await syncSubmissionToSupabase(updatedSubmission);
      res.json({
        submission: updatedSubmission,
        people: currentPeople,
        relationships: currentRels,
        warnings
      });
    }
  );
  app.post("/api/photos/enhance", requireAuth, async (req, res) => {
    const photoCheck = validatePhotoUrl(req.body?.photoUrl);
    if (!photoCheck.valid || !photoCheck.value) {
      res.status(400).json({ error: photoCheck.error ?? "Please upload a valid photo first." });
      return;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      res.json({
        configured: false,
        mode: "demo_unavailable",
        message: "AI photo enhancement is not configured on this server (GEMINI_API_KEY is unset). Showing a clearly labeled preview demonstration."
      });
      return;
    }
    const dataMatch = photoCheck.value.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
    if (!dataMatch) {
      res.json({
        configured: false,
        mode: "demo_unavailable",
        message: "Please upload a JPEG, PNG, or WebP photo file to preview enhancement."
      });
      return;
    }
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: dataMatch[1],
                data: dataMatch[2]
              }
            },
            {
              text: "Gently restore clarity, natural skin tones, and balanced lighting in this family portrait while preserving every facial feature, expression, clothing detail, and authentic age characteristics faithfully. Do not alter identity or add artificial artifacts."
            }
          ]
        }
      });
      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? "image/png";
          res.json({
            configured: true,
            mode: "gemini",
            enhancedPhotoUrl: `data:${mime};base64,${part.inlineData.data}`
          });
          return;
        }
      }
      res.json({
        configured: false,
        mode: "demo_unavailable",
        message: "The image enhancement model did not return an edited image. Showing a clearly labeled preview demonstration instead."
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI photo enhancement unavailable";
      res.json({
        configured: false,
        mode: "demo_unavailable",
        message: `AI photo enhancement could not run with the current server key (${msg.slice(0, 120)}). Showing a clearly labeled preview demonstration.`
      });
    }
  });
  app.post("/api/orders/demo-checkout", requireAuth, async (req, res) => {
    const tree = getOwnedTree(req.body?.treeId, req.user.id);
    if (!tree) {
      res.status(404).json({ error: "Family tree not found." });
      return;
    }
    const currency = req.body?.currency === "USD" ? "USD" : "INR";
    const people = peopleByTreeId.get(tree.id) ?? [];
    const pricing = calculateTreePrice(people.length, currency);
    const order = {
      id: `ord-demo-${crypto.randomUUID()}`,
      treeId: tree.id,
      ownerId: req.user.id,
      peopleCount: people.length,
      currency,
      amount: pricing.totalAmount,
      provider: "unconfigured_demo",
      status: "demo_preview",
      note: "Demo payment only \u2014 no real payment provider or webhook is configured, and no money was charged.",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    ordersById.set(order.id, order);
    saveStoreToDisk();
    await syncOrderToSupabase(order);
    res.status(201).json({ order, pricing });
  });
  app.get("/api/orders", requireAuth, (req, res) => {
    const ownerOrders = Array.from(ordersById.values()).filter((o) => o.ownerId === req.user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ orders: ownerOrders });
  });
  app.post("/api/payments/webhook", (_req, res) => {
    if (!process.env.PAYMENT_WEBHOOK_SECRET) {
      res.status(501).json({
        error: "Payment provider webhook is not configured. Orders remain in demo_preview until server-side credentials are set."
      });
      return;
    }
    res.status(400).json({ error: "Signature verification required." });
  });
  return { app, ensureInitialized };
}

// server.ts
var PORT = 3e3;
async function startServer() {
  const { app, ensureInitialized } = createApiApp();
  await ensureInitialized();
  if (process.env.NODE_ENV === "production") {
    const distDir = path2.resolve(process.cwd(), "dist");
    app.use(express2.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path2.join(distDir, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api/")) {
        next();
        return;
      }
      try {
        const indexPath = path2.resolve(process.cwd(), "index.html");
        const rawHtml = fs2.readFileSync(indexPath, "utf-8");
        const html = await vite.transformIndexHtml(req.originalUrl, rawHtml);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        next(e);
      }
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Roots & Branches server listening on http://localhost:${PORT}`);
  });
}
startServer();
