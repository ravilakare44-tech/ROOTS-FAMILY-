import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Check,
  Copy,
  Eye,
  Inbox,
  Link2,
  List,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Share2,
  Trash2,
  Undo2,
  UserPlus,
} from 'lucide-react';
import { PhotoEditorModal } from '../components/PhotoEditorModal.tsx';
import { TreeVisualizer } from '../components/TreeVisualizer.tsx';
import { useApp } from '../context/AppContext.tsx';
import { apiClient } from '../services/apiClient.ts';
import { findPossibleDuplicates } from '../shared/duplicateCheck.ts';
import { calculateTreePrice } from '../shared/pricing.ts';
import { DEFAULT_DESIGN_CONFIG, SEATING_MODELS } from '../shared/sampleData.ts';
import {
  TREE_LIMITS,
  checkCanAddPerson,
  checkCanAddRelationship,
} from '../shared/treeLimits.ts';
import type {
  DatePrecision,
  FamilyTree,
  InviteLink,
  Person,
  Relationship,
  RelationshipType,
  SeatingModelId,
  TreeDesignConfig,
} from '../shared/types.ts';
import { formatLifeSpan, getInitials } from '../utils/dateFormat.ts';

interface EditorSnapshot {
  people: Person[];
  relationships: Relationship[];
  design: TreeDesignConfig;
}

export function TreeEditorPage({ treeId }: { treeId: string }) {
  const { user, navigate, currency, setCurrency } = useApp();

  const [tree, setTree] = useState<FamilyTree | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [design, setDesign] = useState<TreeDesignConfig>(DEFAULT_DESIGN_CONFIG);
  const [savedSnapshot, setSavedSnapshot] = useState<EditorSnapshot | null>(null);
  const [undoStack, setUndoStack] = useState<EditorSnapshot[]>([]);
  const [inviteLink, setInviteLink] = useState<InviteLink | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'tree'>('tree');

  // Person Add/Edit Modal
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [pFullName, setPFullName] = useState('');
  const [pAltName, setPAltName] = useState('');
  const [pBirthDate, setPBirthDate] = useState('');
  const [pBirthPrec, setPBirthPrec] = useState<DatePrecision>('exact');
  const [pDeathDate, setPDeathDate] = useState('');
  const [pDeathPrec, setPDeathPrec] = useState<DatePrecision>('unknown');
  const [pNotes, setPNotes] = useState('');
  const [pPhotoUrl, setPPhotoUrl] = useState<string | undefined>(undefined);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [dupAcknowledged, setDupAcknowledged] = useState(false);

  // Add Relationship quick form
  const [relModalOpen, setRelModalOpen] = useState(false);
  const [relType, setRelType] = useState<RelationshipType>('parent_child');
  const [relRoleFromSelected, setRelRoleFromSelected] = useState<'is_parent' | 'is_child'>(
    'is_parent'
  );
  const [relTargetId, setRelTargetId] = useState('');
  const [relCustomLabel, setRelCustomLabel] = useState('');

  // Invite Link Drawer/Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const loadTree = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getTree(treeId);
      setTree(res.tree);
      setPeople(res.people);
      setRelationships(res.relationships);
      setDesign(res.tree.design);
      setInviteLink(res.inviteLink);
      setPendingCount(res.pendingSubmissionsCount);
      setSavedSnapshot({
        people: structuredClone(res.people),
        relationships: structuredClone(res.relationships),
        design: structuredClone(res.tree.design),
      });
      setUndoStack([]);
      if (res.people.length > 0) {
        setSelectedPersonId((prev) =>
          prev && res.people.some((p) => p.id === prev) ? prev : res.people[0].id
        );
      } else {
        setSelectedPersonId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this family tree.');
    } finally {
      setLoading(false);
    }
  }, [treeId, user]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadTree();
  }, [user, navigate, loadTree]);

  const hasUnsavedChanges = useMemo(() => {
    if (!savedSnapshot) return false;
    return (
      JSON.stringify({ people, relationships, design }) !== JSON.stringify(savedSnapshot)
    );
  }, [people, relationships, design, savedSnapshot]);

  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [
      ...prev.slice(-19),
      {
        people: structuredClone(people),
        relationships: structuredClone(relationships),
        design: structuredClone(design),
      },
    ]);
  }, [people, relationships, design]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setPeople(prev.people);
    setRelationships(prev.relationships);
    setDesign(prev.design);
    setWarning(null);
    setSuccessMsg('Undid last change.');
  };

  const handleDiscardUnsaved = () => {
    if (!savedSnapshot) return;
    setPeople(structuredClone(savedSnapshot.people));
    setRelationships(structuredClone(savedSnapshot.relationships));
    setDesign(structuredClone(savedSnapshot.design));
    setUndoStack([]);
    setWarning(null);
    setSuccessMsg('Reverted to last saved version.');
  };

  const handleSaveChanges = async () => {
    if (!tree) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await apiClient.saveTreeSnapshot(tree.id, {
        name: tree.name,
        people,
        relationships,
        design,
      });
      setTree(res.tree);
      setPeople(res.people);
      setRelationships(res.relationships);
      setSavedSnapshot({
        people: structuredClone(res.people),
        relationships: structuredClone(res.relationships),
        design: structuredClone(res.tree.design),
      });
      setUndoStack([]);
      setSuccessMsg('Changes saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const filteredPeople = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        (p.alternateName && p.alternateName.toLowerCase().includes(q))
    );
  }, [people, searchQuery]);

  const selectedPerson = useMemo(
    () => people.find((p) => p.id === selectedPersonId) ?? null,
    [people, selectedPersonId]
  );

  const selectedPersonRels = useMemo(() => {
    if (!selectedPerson) return [];
    const personMap = new Map(people.map((p) => [p.id, p]));
    return relationships
      .filter(
        (r) => r.fromPersonId === selectedPerson.id || r.toPersonId === selectedPerson.id
      )
      .map((r) => {
        const isFrom = r.fromPersonId === selectedPerson.id;
        const other = personMap.get(isFrom ? r.toPersonId : r.fromPersonId);
        let roleDesc = r.label || 'Relative';
        if (r.type === 'parent_child') {
          roleDesc = isFrom ? 'Child' : 'Parent';
          if (r.label && r.label !== 'Parent') roleDesc = `${roleDesc} (${r.label})`;
        } else if (r.type === 'spouse_partner') {
          roleDesc = r.label || 'Spouse / Partner';
        }
        return { rel: r, other, roleDesc };
      })
      .filter((item) => Boolean(item.other));
  }, [selectedPerson, people, relationships]);

  const possibleDuplicates = useMemo(() => {
    if (!personModalOpen || !pFullName.trim()) return [];
    return findPossibleDuplicates(
      {
        fullName: pFullName,
        alternateName: pAltName,
        birthDate: pBirthDate,
        excludePersonId: editingPersonId ?? undefined,
      },
      people
    );
  }, [personModalOpen, pFullName, pAltName, pBirthDate, editingPersonId, people]);

  const openAddPersonModal = () => {
    const limitCheck = checkCanAddPerson(people);
    if (!limitCheck.allowed) {
      setWarning(limitCheck.reason!);
      return;
    }
    setWarning(null);
    setEditingPersonId(null);
    setPFullName('');
    setPAltName('');
    setPBirthDate('');
    setPBirthPrec('exact');
    setPDeathDate('');
    setPDeathPrec('unknown');
    setPNotes('');
    setPPhotoUrl(undefined);
    setDupAcknowledged(false);
    setPersonModalOpen(true);
  };

  const openEditPersonModal = (person: Person) => {
    setWarning(null);
    setEditingPersonId(person.id);
    setPFullName(person.fullName);
    setPAltName(person.alternateName ?? '');
    setPBirthDate(person.birthDate ?? '');
    setPBirthPrec(person.birthDatePrecision);
    setPDeathDate(person.deathDate ?? '');
    setPDeathPrec(person.deathDatePrecision);
    setPNotes(person.notes ?? '');
    setPPhotoUrl(person.photoUrl);
    setDupAcknowledged(false);
    setPersonModalOpen(true);
  };

  const handleSubmitPersonModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tree || !pFullName.trim()) return;

    if (possibleDuplicates.length > 0 && !dupAcknowledged) {
      setDupAcknowledged(true);
      return;
    }

    pushUndo();
    const now = new Date().toISOString();

    if (editingPersonId) {
      setPeople((prev) =>
        prev.map((p) =>
          p.id === editingPersonId
            ? {
                ...p,
                fullName: pFullName.trim(),
                alternateName: pAltName.trim() || undefined,
                birthDate: pBirthPrec === 'unknown' ? undefined : pBirthDate.trim() || undefined,
                birthDatePrecision: pBirthPrec,
                deathDate: pDeathPrec === 'unknown' ? undefined : pDeathDate.trim() || undefined,
                deathDatePrecision: pDeathPrec,
                notes: pNotes.trim() || undefined,
                photoUrl: pPhotoUrl,
                updatedAt: now,
              }
            : p
        )
      );
      setSuccessMsg(`Updated ${pFullName.trim()}. Remember to save changes.`);
    } else {
      const limitCheck = checkCanAddPerson(people);
      if (!limitCheck.allowed) {
        setWarning(limitCheck.reason!);
        return;
      }
      const newPerson: Person = {
        id: `p-${crypto.randomUUID()}`,
        treeId: tree.id,
        fullName: pFullName.trim(),
        alternateName: pAltName.trim() || undefined,
        birthDate: pBirthPrec === 'unknown' ? undefined : pBirthDate.trim() || undefined,
        birthDatePrecision: pBirthPrec,
        deathDate: pDeathPrec === 'unknown' ? undefined : pDeathDate.trim() || undefined,
        deathDatePrecision: pDeathPrec,
        notes: pNotes.trim() || undefined,
        photoUrl: pPhotoUrl,
        createdAt: now,
        updatedAt: now,
      };
      setPeople((prev) => [...prev, newPerson]);
      setSelectedPersonId(newPerson.id);
      setSuccessMsg(`Added ${newPerson.fullName}. Remember to save changes.`);
    }
    setPersonModalOpen(false);
  };

  const handleRemovePerson = (person: Person) => {
    pushUndo();
    setPeople((prev) => prev.filter((p) => p.id !== person.id));
    setRelationships((prev) =>
      prev.filter((r) => r.fromPersonId !== person.id && r.toPersonId !== person.id)
    );
    if (selectedPersonId === person.id) {
      setSelectedPersonId(null);
    }
    setSuccessMsg(`Removed ${person.fullName}. Click Save changes to confirm.`);
  };

  const openAddRelModal = () => {
    if (!selectedPerson) return;
    const others = people.filter((p) => p.id !== selectedPerson.id);
    if (others.length === 0) {
      setWarning('Add at least one more person before creating a relationship.');
      return;
    }
    setWarning(null);
    setRelType('parent_child');
    setRelRoleFromSelected('is_parent');
    setRelTargetId(others[0].id);
    setRelCustomLabel('');
    setRelModalOpen(true);
  };

  const handleSubmitRelModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tree || !selectedPerson || !relTargetId) return;

    let fromId = selectedPerson.id;
    let toId = relTargetId;
    if (relType === 'parent_child' && relRoleFromSelected === 'is_child') {
      fromId = relTargetId;
      toId = selectedPerson.id;
    }

    const check = checkCanAddRelationship(relationships, fromId, toId, relType);
    if (!check.allowed) {
      setWarning(check.reason ?? 'Could not add relationship.');
      return;
    }

    pushUndo();
    const now = new Date().toISOString();
    const newRel: Relationship = {
      id: `r-${crypto.randomUUID()}`,
      treeId: tree.id,
      fromPersonId: fromId,
      toPersonId: toId,
      type: relType,
      label:
        relCustomLabel.trim() ||
        (relType === 'spouse_partner' ? 'Spouse' : relType === 'parent_child' ? 'Parent' : 'Relative'),
      createdAt: now,
      updatedAt: now,
    };

    setRelationships((prev) => [...prev, newRel]);
    setRelModalOpen(false);
    setWarning(null);
    setSuccessMsg('Relationship added. Remember to save changes.');
  };

  const handleRemoveRel = (relId: string) => {
    pushUndo();
    setRelationships((prev) => prev.filter((r) => r.id !== relId));
    setSuccessMsg('Relationship removed.');
  };

  const handleEnsureInvite = async (opts?: {
    isActive?: boolean;
    regenerate?: boolean;
    shareAnchorNames?: boolean;
  }) => {
    if (!tree) return;
    try {
      const res = await apiClient.upsertInviteLink(tree.id, opts ?? {});
      setInviteLink(res.inviteLink);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update invite link.');
    }
  };

  const inviteUrl = inviteLink
    ? `${window.location.origin}/contribute/${inviteLink.token}`
    : '';

  const priceEst = calculateTreePrice(people.length, currency);

  if (!user) return null;

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="h-12 w-64 animate-pulse rounded-lg bg-[#E5DEC9]" />
        <div className="mt-6 h-[500px] animate-pulse rounded-xl bg-[#E5DEC9]/60" />
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-[#1F2421]">
          {error || 'Family tree not found'}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mt-6 rounded-lg bg-[#1B4332] px-5 py-2.5 text-sm font-medium text-[#FAF7F0] cursor-pointer"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Top Workspace Bar */}
      <div className="flex flex-col gap-4 border-b border-[#E5DEC9] pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5E6660] hover:text-[#1B4332] cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to trees</span>
          </button>
          <h1 className="mt-1 font-display text-2xl font-semibold text-[#1B4332] truncate">
            {tree.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#5E6660]">
            <span className="tabular-nums">
              {people.length} / {TREE_LIMITS.MAX_PEOPLE_PER_TREE} people
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums font-medium text-[#1B4332]">
              Est. export: {priceEst.formattedTotal}
            </span>
            <button
              type="button"
              onClick={() => setCurrency(currency === 'INR' ? 'USD' : 'INR')}
              className="underline underline-offset-2 hover:text-[#1B4332] cursor-pointer"
            >
              Switch to {currency === 'INR' ? 'USD ($)' : 'INR (₹)'}
            </button>
            {hasUnsavedChanges && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[#9C6B21]">Unsaved edits</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openAddPersonModal}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#1B4332] px-3.5 py-2 text-xs sm:text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add person</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInviteModalOpen(true);
              if (!inviteLink) handleEnsureInvite({ isActive: true });
            }}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#DCD4BE] bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-[#1F2421] hover:bg-[#F2EDE2] cursor-pointer"
          >
            <Share2 className="h-4 w-4 text-[#1B4332]" />
            <span>Invite family</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/trees/${tree.id}/review`)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#DCD4BE] bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-[#1F2421] hover:bg-[#F2EDE2] cursor-pointer"
          >
            <Inbox className="h-4 w-4 text-[#1B4332]" />
            <span>Review ({pendingCount})</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/trees/${tree.id}/preview`)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#DCD4BE] bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-[#1F2421] hover:bg-[#F2EDE2] cursor-pointer"
          >
            <Eye className="h-4 w-4 text-[#1B4332]" />
            <span>Preview &amp; Download</span>
          </button>
        </div>
      </div>

      {/* Editor Sub-toolbar: Orientation, Undo, Cancel, Save */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DCD4BE] bg-white px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Mobile List vs Tree switch */}
          <div className="inline-flex lg:hidden rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] p-0.5">
            <button
              type="button"
              onClick={() => setMobileView('tree')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer ${
                mobileView === 'tree' ? 'bg-[#1B4332] text-[#FAF7F0]' : 'text-[#3A413C]'
              }`}
            >
              Tree view
            </button>
            <button
              type="button"
              onClick={() => setMobileView('list')}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer ${
                mobileView === 'list' ? 'bg-[#1B4332] text-[#FAF7F0]' : 'text-[#3A413C]'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>People list</span>
            </button>
          </div>

          <label htmlFor="editor-orientation" className="text-xs font-medium text-[#5E6660]">
            Layout:
          </label>
          <select
            id="editor-orientation"
            value={design.orientation}
            onChange={(e) => {
              const nextOrientation = e.target.value as 'portrait' | 'landscape';
              pushUndo();
              setDesign((d) => ({
                ...d,
                orientation: nextOrientation,
                style:
                  d.style === 'portrait' || d.style === 'landscape'
                    ? nextOrientation
                    : d.style,
              }));
            }}
            className="rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-2.5 py-1 text-xs font-medium text-[#1F2421]"
          >
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
          </select>

          <label htmlFor="editor-style" className="ml-2 text-xs font-medium text-[#5E6660]">
            Style:
          </label>
          <select
            id="editor-style"
            value={design.style}
            onChange={(e) => {
              const nextStyle = e.target.value as TreeDesignConfig['style'];
              pushUndo();
              setDesign((d) => ({ ...d, style: nextStyle }));
            }}
            className="rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-2.5 py-1 text-xs font-medium text-[#1F2421]"
          >
            <option value="classic">Classic Chart</option>
            <option value="portrait">Portrait Layout</option>
            <option value="landscape">Landscape Layout</option>
            <option value="green_tree">Green Tree (Upward)</option>
            <option value="photo_cards">Photo Cards</option>
          </select>

          <label htmlFor="editor-seating" className="ml-2 text-xs font-medium text-[#5E6660]">
            Seating:
          </label>
          <select
            id="editor-seating"
            value={design.seatingModel ?? 'indoor_heirloom_sofa'}
            onChange={(e) => {
              const nextSeating = e.target.value as SeatingModelId;
              pushUndo();
              setDesign((d) => ({ ...d, seatingModel: nextSeating }));
            }}
            className="rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-2.5 py-1 text-xs font-medium text-[#1F2421]"
          >
            <optgroup label="Indoor (3)">
              {SEATING_MODELS.filter((m) => m.category === 'indoor').map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Outdoor (3)">
              {SEATING_MODELS.filter((m) => m.category === 'outdoor').map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </optgroup>
            <option value="none">None</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={undoStack.length === 0}
            onClick={handleUndo}
            className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-[#DCD4BE] bg-white px-3 py-1 text-xs font-medium text-[#3A413C] hover:bg-[#F2EDE2] disabled:opacity-40 cursor-pointer"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Undo</span>
          </button>
          <button
            type="button"
            disabled={!hasUnsavedChanges}
            onClick={handleDiscardUnsaved}
            className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-[#DCD4BE] bg-white px-3 py-1 text-xs font-medium text-[#3A413C] hover:bg-[#F2EDE2] disabled:opacity-40 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Cancel unsaved</span>
          </button>
          <button
            type="button"
            disabled={saving || !hasUnsavedChanges}
            onClick={handleSaveChanges}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-[#1B4332] px-4 py-1 text-xs font-medium text-[#FAF7F0] hover:bg-[#143326] disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? 'Saving…' : 'Save changes'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banners */}
      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-800"
        >
          {error}
        </div>
      )}
      {warning && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2 rounded-lg border border-[#B08D57] bg-[#FAF3E6] px-4 py-2.5 text-sm text-[#6B4F24]"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{warning}</span>
        </div>
      )}
      {successMsg && (
        <div
          role="status"
          className="mt-4 flex items-center gap-2 rounded-lg border border-[#6B8E78]/50 bg-[#EAF0EC] px-4 py-2.5 text-sm text-[#1B4332]"
        >
          <Check className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main 3-Panel Editor Grid */}
      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        {/* Left: People Search & List */}
        <aside
          className={`lg:col-span-3 rounded-xl border border-[#DCD4BE] bg-white p-4 ${
            mobileView === 'list' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-[#1F2421]">
              People ({people.length})
            </h2>
            <button
              type="button"
              onClick={openAddPersonModal}
              className="text-xs font-medium text-[#1B4332] hover:underline cursor-pointer"
            >
              + Add
            </button>
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5E6660]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name…"
              aria-label="Search people by name"
              className="w-full rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] py-2 pl-9 pr-3 text-sm focus:border-[#1B4332] focus:outline-none"
            />
          </div>

          <div className="mt-3 max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
            {filteredPeople.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#5E6660]">
                {people.length === 0 ? 'No people added yet.' : 'No matching names found.'}
              </p>
            ) : (
              filteredPeople.map((person) => {
                const active = selectedPersonId === person.id;
                const life = formatLifeSpan(person);
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => setSelectedPersonId(person.id)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors cursor-pointer flex items-center gap-2.5 ${
                      active
                        ? 'border-[#1B4332] bg-[#EAF0EC]/70'
                        : 'border-transparent hover:bg-[#FAF7F0]'
                    }`}
                  >
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[#DCD4BE] bg-[#EAF0EC] flex items-center justify-center">
                      {person.photoUrl ? (
                        <img
                          src={person.photoUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[11px] font-semibold text-[#1B4332]">
                          {getInitials(person.fullName)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1F2421] truncate">
                        {person.fullName}
                      </p>
                      {life && (
                        <p className="text-[11px] text-[#5E6660] truncate tabular-nums">{life}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Center: Tree Preview Canvas */}
        <main
          className={`lg:col-span-6 ${
            mobileView === 'tree' ? 'block' : 'hidden lg:block'
          }`}
        >
          <TreeVisualizer
            treeName={tree.name}
            people={people}
            relationships={relationships}
            design={design}
            selectedPersonId={selectedPersonId}
            onSelectPerson={(p) => setSelectedPersonId(p.id)}
            minHeightClass="h-[480px] sm:h-[540px]"
            showCaption={false}
          />
        </main>

        {/* Right: Selected Person Detail & Relationships */}
        <section className="lg:col-span-3 rounded-xl border border-[#DCD4BE] bg-white p-5">
          {selectedPerson ? (
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#DCD4BE] bg-[#EAF0EC] flex items-center justify-center">
                    {selectedPerson.photoUrl ? (
                      <img
                        src={selectedPerson.photoUrl}
                        alt={selectedPerson.fullName}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="font-display text-base font-semibold text-[#1B4332]">
                        {getInitials(selectedPerson.fullName)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-semibold text-[#1F2421] truncate">
                      {selectedPerson.fullName}
                    </h2>
                    {selectedPerson.alternateName && (
                      <p className="text-xs text-[#6B8E78] truncate">
                        {selectedPerson.alternateName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openEditPersonModal(selectedPerson)}
                  className="min-h-[36px] flex-1 rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-3 py-1.5 text-xs font-medium text-[#1F2421] hover:bg-[#EAE4D3] cursor-pointer"
                >
                  Edit details
                </button>
                <button
                  type="button"
                  onClick={() => handleRemovePerson(selectedPerson)}
                  className="min-h-[36px] rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  Remove
                </button>
              </div>

              <dl className="mt-4 space-y-2.5 border-t border-[#E5DEC9] pt-4 text-xs">
                <div>
                  <dt className="text-[#5E6660]">Birth</dt>
                  <dd className="mt-0.5 font-medium text-[#1F2421] tabular-nums">
                    {selectedPerson.birthDate || 'Not set'} (
                    {selectedPerson.birthDatePrecision.replace('_', ' ')})
                  </dd>
                </div>
                <div>
                  <dt className="text-[#5E6660]">Death</dt>
                  <dd className="mt-0.5 font-medium text-[#1F2421] tabular-nums">
                    {selectedPerson.deathDate || 'Not set'} (
                    {selectedPerson.deathDatePrecision.replace('_', ' ')})
                  </dd>
                </div>
                {selectedPerson.notes && (
                  <div>
                    <dt className="text-[#5E6660]">Notes</dt>
                    <dd className="mt-0.5 leading-relaxed text-[#3A413C]">
                      {selectedPerson.notes}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-5 border-t border-[#E5DEC9] pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-[#1F2421]">Relationships</h3>
                  <button
                    type="button"
                    onClick={openAddRelModal}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#1B4332] hover:underline cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Connect</span>
                  </button>
                </div>

                {selectedPersonRels.length === 0 ? (
                  <p className="mt-2 text-xs text-[#5E6660]">
                    No relationships connected yet. Click Connect to add a parent, child, or
                    spouse/partner.
                  </p>
                ) : (
                  <ul className="mt-2.5 space-y-2">
                    {selectedPersonRels.map(({ rel, other, roleDesc }) => (
                      <li
                        key={rel.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[#E5DEC9] bg-[#FAF7F0] px-2.5 py-2 text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => other && setSelectedPersonId(other.id)}
                          className="min-w-0 text-left hover:underline cursor-pointer"
                        >
                          <span className="block font-medium text-[#1F2421] truncate">
                            {other?.fullName}
                          </span>
                          <span className="text-[11px] text-[#5E6660]">{roleDesc}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveRel(rel.id)}
                          aria-label={`Remove relationship with ${other?.fullName}`}
                          className="p-1 text-[#5E6660] hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-[#1F2421]">No person selected</p>
              <p className="mt-1 text-xs text-[#5E6660]">
                Select someone on the tree or list, or add a new family member.
              </p>
              <button
                type="button"
                onClick={openAddPersonModal}
                className="mt-4 rounded-lg bg-[#1B4332] px-4 py-2 text-xs font-medium text-[#FAF7F0] cursor-pointer"
              >
                Add first person
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Add / Edit Person Modal */}
      {personModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="person-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2421]/50 p-4 backdrop-blur-xs"
        >
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#DCD4BE] bg-[#FAF7F0] p-6 shadow-xl">
            <h2 id="person-modal-title" className="font-display text-xl font-semibold text-[#1B4332]">
              {editingPersonId ? 'Edit family member' : 'Add family member'}
            </h2>

            <form onSubmit={handleSubmitPersonModal} className="mt-4 space-y-4">
              {/* Photo Row */}
              <div className="flex items-center gap-4 rounded-xl border border-[#DCD4BE] bg-white p-3.5">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[#DCD4BE] bg-[#EAF0EC] flex items-center justify-center">
                  {pPhotoUrl ? (
                    <img
                      src={pPhotoUrl}
                      alt={pFullName || 'Portrait'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-display text-base font-semibold text-[#1B4332]">
                      {getInitials(pFullName || '?')}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-[#1F2421]">Profile portrait (optional)</p>
                  <button
                    type="button"
                    onClick={() => setPhotoModalOpen(true)}
                    className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-3 py-1.5 text-xs font-medium text-[#1B4332] hover:bg-[#EAE4D3] cursor-pointer"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>{pPhotoUrl ? 'Change or crop photo' : 'Upload & crop photo'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="p-full-name" className="block text-sm font-medium text-[#1F2421]">
                  Full name <span className="text-red-700">*</span>
                </label>
                <input
                  id="p-full-name"
                  type="text"
                  required
                  value={pFullName}
                  onChange={(e) => {
                    setPFullName(e.target.value);
                    setDupAcknowledged(false);
                  }}
                  placeholder="e.g., Savitri Kulkarni"
                  className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-white px-3.5 py-2 text-sm focus:border-[#1B4332] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="p-alt-name" className="block text-sm font-medium text-[#1F2421]">
                  Maiden or alternate name (optional)
                </label>
                <input
                  id="p-alt-name"
                  type="text"
                  value={pAltName}
                  onChange={(e) => {
                    setPAltName(e.target.value);
                    setDupAcknowledged(false);
                  }}
                  placeholder="e.g., née Deshpande"
                  className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-white px-3.5 py-2 text-sm focus:border-[#1B4332] focus:outline-none"
                />
              </div>

              {/* Duplicate match warning */}
              {possibleDuplicates.length > 0 && (
                <div className="rounded-xl border border-[#B08D57] bg-[#FAF3E6] p-3.5 text-xs text-[#6B4F24]">
                  <p className="font-semibold">Possible match already in tree:</p>
                  <ul className="mt-1 space-y-1">
                    {possibleDuplicates.slice(0, 3).map((m) => (
                      <li key={m.person.id}>
                        {m.person.fullName} ({m.reason})
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2">
                    {dupAcknowledged
                      ? 'Confirmed: click Save again to keep both people with similar names.'
                      : 'If this is a different person with a similar name, you can still save them.'}
                  </p>
                </div>
              )}

              {/* Birth Date + Precision */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="p-birth-prec" className="block text-xs font-medium text-[#1F2421]">
                    Birth date status
                  </label>
                  <select
                    id="p-birth-prec"
                    value={pBirthPrec}
                    onChange={(e) => setPBirthPrec(e.target.value as DatePrecision)}
                    className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-white px-3 py-2 text-sm"
                  >
                    <option value="exact">Exact date</option>
                    <option value="approximate">Approximate</option>
                    <option value="year_only">Year only</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="p-birth-date" className="block text-xs font-medium text-[#1F2421]">
                    Birth date or year
                  </label>
                  <input
                    id="p-birth-date"
                    type={pBirthPrec === 'exact' ? 'date' : 'text'}
                    disabled={pBirthPrec === 'unknown'}
                    value={pBirthPrec === 'unknown' ? '' : pBirthDate}
                    onChange={(e) => setPBirthDate(e.target.value)}
                    placeholder={pBirthPrec === 'year_only' ? 'e.g., 1943' : 'YYYY-MM-DD or year'}
                    className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-white px-3 py-2 text-sm disabled:bg-[#F2EDE2]"
                  />
                </div>
              </div>

              {/* Death Date + Precision */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="p-death-prec" className="block text-xs font-medium text-[#1F2421]">
                    Death date status
                  </label>
                  <select
                    id="p-death-prec"
                    value={pDeathPrec}
                    onChange={(e) => setPDeathPrec(e.target.value as DatePrecision)}
                    className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-white px-3 py-2 text-sm"
                  >
                    <option value="unknown">Living / Unknown</option>
                    <option value="exact">Exact date</option>
                    <option value="approximate">Approximate</option>
                    <option value="year_only">Year only</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="p-death-date" className="block text-xs font-medium text-[#1F2421]">
                    Death date or year
                  </label>
                  <input
                    id="p-death-date"
                    type={pDeathPrec === 'exact' ? 'date' : 'text'}
                    disabled={pDeathPrec === 'unknown'}
                    value={pDeathPrec === 'unknown' ? '' : pDeathDate}
                    onChange={(e) => setPDeathDate(e.target.value)}
                    placeholder={pDeathPrec === 'year_only' ? 'e.g., 2014' : 'YYYY-MM-DD or year'}
                    className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-white px-3 py-2 text-sm disabled:bg-[#F2EDE2]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="p-notes" className="block text-sm font-medium text-[#1F2421]">
                  Notes or memory (optional)
                </label>
                <textarea
                  id="p-notes"
                  rows={2}
                  value={pNotes}
                  onChange={(e) => setPNotes(e.target.value)}
                  placeholder="City, occupation, or a short family story"
                  className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-white px-3.5 py-2 text-sm focus:border-[#1B4332] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPersonModalOpen(false)}
                  className="min-h-[40px] rounded-lg border border-[#DCD4BE] bg-white px-4 py-2 text-sm font-medium text-[#3A413C] hover:bg-[#F2EDE2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] rounded-lg bg-[#1B4332] px-5 py-2 text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] cursor-pointer"
                >
                  {possibleDuplicates.length > 0 && !dupAcknowledged
                    ? 'Keep & Continue'
                    : editingPersonId
                      ? 'Update Person'
                      : 'Add to Tree'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Editor Modal */}
      <PhotoEditorModal
        isOpen={photoModalOpen}
        personName={pFullName}
        initialPhotoUrl={pPhotoUrl}
        canUseServerEnhance={true}
        onSave={(url) => setPPhotoUrl(url)}
        onClose={() => setPhotoModalOpen(false)}
      />

      {/* Add Relationship Modal */}
      {relModalOpen && selectedPerson && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rel-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2421]/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#DCD4BE] bg-[#FAF7F0] p-6 shadow-xl">
            <h2 id="rel-modal-title" className="font-display text-xl font-semibold text-[#1B4332]">
              Connect {selectedPerson.fullName}
            </h2>
            <form onSubmit={handleSubmitRelModal} className="mt-4 space-y-4">
              <div>
                <label htmlFor="rel-type" className="block text-sm font-medium text-[#1F2421]">
                  Relationship type
                </label>
                <select
                  id="rel-type"
                  value={relType}
                  onChange={(e) => setRelType(e.target.value as RelationshipType)}
                  className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-white px-3 py-2 text-sm"
                >
                  <option value="parent_child">Parent / Child</option>
                  <option value="spouse_partner">
                    Spouse / Partner (up to {TREE_LIMITS.MAX_SPOUSES_PER_PERSON})
                  </option>
                  <option value="other">Other labeled relationship</option>
                </select>
              </div>

              {relType === 'parent_child' && (
                <div>
                  <label htmlFor="rel-dir" className="block text-sm font-medium text-[#1F2421]">
                    Direction
                  </label>
                  <select
                    id="rel-dir"
                    value={relRoleFromSelected}
                    onChange={(e) =>
                      setRelRoleFromSelected(e.target.value as 'is_parent' | 'is_child')
                    }
                    className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-white px-3 py-2 text-sm"
                  >
                    <option value="is_parent">
                      {selectedPerson.fullName} is the parent of…
                    </option>
                    <option value="is_child">
                      {selectedPerson.fullName} is the child of…
                    </option>
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="rel-target" className="block text-sm font-medium text-[#1F2421]">
                  Related person
                </label>
                <select
                  id="rel-target"
                  value={relTargetId}
                  onChange={(e) => setRelTargetId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-white px-3 py-2 text-sm"
                >
                  {people
                    .filter((p) => p.id !== selectedPerson.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label htmlFor="rel-label" className="block text-sm font-medium text-[#1F2421]">
                  Editable label (optional)
                </label>
                <input
                  id="rel-label"
                  type="text"
                  value={relCustomLabel}
                  onChange={(e) => setRelCustomLabel(e.target.value)}
                  placeholder="e.g., Mother, Adoptive parent, Second wife, Guardian"
                  className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-white px-3.5 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRelModalOpen(false)}
                  className="min-h-[40px] rounded-lg border border-[#DCD4BE] bg-white px-4 py-2 text-sm font-medium text-[#3A413C] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] rounded-lg bg-[#1B4332] px-5 py-2 text-sm font-medium text-[#FAF7F0] cursor-pointer"
                >
                  Add Relationship
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Private Invite Link Modal */}
      {inviteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2421]/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#DCD4BE] bg-[#FAF7F0] p-6 shadow-xl">
            <h2 id="invite-modal-title" className="font-display text-xl font-semibold text-[#1B4332]">
              Private family contributor link
            </h2>
            <p className="mt-1.5 text-sm text-[#3A413C]">
              Relatives can open this unguessable link to submit names, dates, and photos without
              creating an account. They cannot browse your dashboard or whole tree, and nothing is
              added until you approve it.
            </p>

            {inviteLink ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-[#DCD4BE] bg-white p-3.5">
                  <div className="flex items-center justify-between gap-2 text-xs font-medium text-[#5E6660]">
                    <span>
                      Status:{' '}
                      <strong className={inviteLink.isActive ? 'text-[#1B4332]' : 'text-red-700'}>
                        {inviteLink.isActive ? 'Open for submissions' : 'Disabled'}
                      </strong>
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteUrl}
                      aria-label="Private invite link URL"
                      className="flex-1 rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-3 py-2 text-xs font-mono text-[#1F2421]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(inviteUrl);
                        setCopiedInvite(true);
                        setTimeout(() => setCopiedInvite(false), 2000);
                      }}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-[#1B4332] px-3 py-1.5 text-xs font-medium text-[#FAF7F0] cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copiedInvite ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 text-xs text-[#3A413C] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inviteLink.shareAnchorNames}
                    onChange={(e) =>
                      handleEnsureInvite({ shareAnchorNames: e.target.checked })
                    }
                    className="mt-0.5 accent-[#1B4332]"
                  />
                  <span>
                    Allow contributors to pick existing names from a dropdown when connecting new
                    family members (dates, notes, and photos remain hidden).
                  </span>
                </label>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleEnsureInvite({ isActive: !inviteLink.isActive })}
                    className="min-h-[38px] rounded-lg border border-[#DCD4BE] bg-white px-3.5 py-1.5 text-xs font-medium text-[#1F2421] hover:bg-[#F2EDE2] cursor-pointer"
                  >
                    {inviteLink.isActive ? 'Disable link' : 'Enable link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEnsureInvite({ regenerate: true })}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#DCD4BE] bg-white px-3.5 py-1.5 text-xs font-medium text-[#1F2421] hover:bg-[#F2EDE2] cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Regenerate token</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInviteModalOpen(false);
                      navigate(`/contribute/${inviteLink.token}`);
                    }}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#1B4332]/40 bg-[#EAF0EC] px-3.5 py-1.5 text-xs font-medium text-[#1B4332] hover:bg-[#DCE7E0] cursor-pointer"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    <span>Open contributor form</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#5E6660]">Preparing private link…</p>
            )}

            <div className="mt-6 flex justify-end border-t border-[#E5DEC9] pt-4">
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="min-h-[40px] rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-[#FAF7F0] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
