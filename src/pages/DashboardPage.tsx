import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Copy,
  Download,
  Edit3,
  Eye,
  Inbox,
  Info,
  LogOut,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { EN_COPY } from '../i18n/en.ts';
import { apiClient, type TreeListItem } from '../services/apiClient.ts';
import { calculateTreePrice } from '../shared/pricing.ts';

export function DashboardPage() {
  const { user, navigate, logout, currency } = useApp();
  const [trees, setTrees] = useState<TreeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Create tree modal
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<TreeListItem | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const loadTrees = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.listTrees();
      setTrees(res.trees);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your trees.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadTrees();
  }, [user, navigate, loadTrees]);

  if (!user) return null;

  const handleCreateTree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    try {
      const res = await apiClient.createTree(newName.trim(), newDesc.trim() || undefined);
      setCreating(false);
      setNewName('');
      setNewDesc('');
      navigate(`/trees/${res.tree.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create tree.');
    }
  };

  const handleRenameSubmit = async (treeId: string) => {
    if (!renameValue.trim()) return;
    try {
      await apiClient.updateTreeMeta(treeId, { name: renameValue.trim() });
      setRenamingId(null);
      setStatusMessage('Tree renamed.');
      loadTrees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename tree.');
    }
  };

  const handleDuplicate = async (treeId: string) => {
    try {
      await apiClient.duplicateTree(treeId);
      setStatusMessage('Tree duplicated.');
      loadTrees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not duplicate tree.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.deleteTree(deleteTarget.id);
      setDeleteTarget(null);
      setStatusMessage(`Deleted "${deleteTarget.name}".`);
      loadTrees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete tree.');
    }
  };

  const handleSaveBackup = async (treeId: string) => {
    setError(null);
    try {
      const detail = await apiClient.getTree(treeId);
      const backupPayload = {
        format: 'roots-and-branches-backup-v1',
        exportedAt: new Date().toISOString(),
        tree: {
          name: detail.tree.name,
          description: detail.tree.description,
          design: detail.tree.design,
        },
        people: detail.people,
        relationships: detail.relationships,
      };
      const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const slug = detail.tree.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'family-tree';
      const link = document.createElement('a');
      link.href = url;
      link.download = `${slug}-backup.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatusMessage(`Saved backup JSON for "${detail.tree.name}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export backup.');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        tree?: { name?: string; description?: string; design?: TreeListItem['design'] };
        name?: string;
        description?: string;
        design?: TreeListItem['design'];
        people?: unknown[];
        relationships?: unknown[];
      };
      const treeName = (parsed.tree?.name ?? parsed.name ?? file.name.replace(/\.json$/i, '')).trim();
      const res = await apiClient.importTree({
        name: treeName || 'Imported Family Tree',
        description: parsed.tree?.description ?? parsed.description,
        design: parsed.tree?.design ?? parsed.design,
        people: Array.isArray(parsed.people) ? (parsed.people as never[]) : [],
        relationships: Array.isArray(parsed.relationships) ? (parsed.relationships as never[]) : [],
      });
      setStatusMessage(`Imported and saved "${res.tree.name}" (${res.people.length} people).`);
      loadTrees();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not import JSON backup. Check file format.'
      );
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Demo Notice */}
      <div className="mb-6 rounded-xl border border-[#DCD4BE] bg-[#F2EDE2] px-4 py-3 text-xs text-[#3A413C] flex items-start gap-2.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1B4332]" />
        <p>{EN_COPY.demoBanner}</p>
      </div>

      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#6B8E78]">
            Signed in as {user.name} · {user.email}
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-[#1B4332]">
            Your family trees
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportBackup}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-[#DCD4BE] bg-white px-3.5 py-2 text-sm font-medium text-[#1F2421] hover:bg-[#F2EDE2] cursor-pointer"
          >
            <Upload className="h-4 w-4 text-[#1B4332]" />
            <span>Import backup</span>
          </button>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create a tree</span>
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-[#DCD4BE] bg-white px-3.5 py-2 text-sm font-medium text-[#3A413C] hover:bg-[#F2EDE2] cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="mt-4 rounded-lg border border-[#6B8E78]/40 bg-[#EAF0EC] px-4 py-2.5 text-sm text-[#1B4332]">
          {statusMessage}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {/* Create Tree Modal */}
      {creating && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-tree-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2421]/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#DCD4BE] bg-[#FAF7F0] p-6 shadow-xl">
            <h2 id="create-tree-title" className="font-display text-xl font-semibold text-[#1B4332]">
              Create a new family tree
            </h2>
            <form onSubmit={handleCreateTree} className="mt-4 space-y-4">
              <div>
                <label htmlFor="new-tree-name" className="block text-sm font-medium text-[#1F2421]">
                  Tree name
                </label>
                <input
                  id="new-tree-name"
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., The Sharma & Patel Family"
                  className="mt-1.5 w-full rounded-lg border border-[#DCD4BE] bg-white px-3.5 py-2.5 text-sm focus:border-[#1B4332] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="new-tree-desc" className="block text-sm font-medium text-[#1F2421]">
                  Optional note
                </label>
                <textarea
                  id="new-tree-desc"
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g., Maternal and paternal branches starting from 1920"
                  className="mt-1.5 w-full rounded-lg border border-[#DCD4BE] bg-white px-3.5 py-2 text-sm focus:border-[#1B4332] focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="min-h-[40px] rounded-lg border border-[#DCD4BE] bg-white px-4 py-2 text-sm font-medium text-[#3A413C] hover:bg-[#F2EDE2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] cursor-pointer"
                >
                  Create &amp; Open Editor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-tree-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2421]/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#DCD4BE] bg-[#FAF7F0] p-6 shadow-xl">
            <h2 id="delete-tree-title" className="font-display text-xl font-semibold text-[#1F2421]">
              Delete “{deleteTarget.name}”?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#3A413C]">
              This will permanently remove the tree, its <span className="tabular-nums">{deleteTarget.peopleCount}</span> people,
              relationships, photos, and pending submissions from saved storage.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="min-h-[40px] rounded-lg border border-[#DCD4BE] bg-white px-4 py-2 text-sm font-medium text-[#3A413C] hover:bg-[#F2EDE2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="min-h-[40px] rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 cursor-pointer"
              >
                Yes, delete tree
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trees List */}
      <div className="mt-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-28 animate-pulse rounded-xl border border-[#DCD4BE] bg-white/70"
              />
            ))}
          </div>
        ) : trees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#B0A890] bg-white p-10 text-center">
            <h2 className="font-display text-xl font-semibold text-[#1B4332]">
              No family trees yet
            </h2>
            <p className="mt-2 mx-auto max-w-md text-sm text-[#5E6660]">
              Create your first family tree to start adding names, dates, relationships, and
              portraits—or invite relatives to contribute.
            </p>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="mt-5 inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#1B4332] px-5 py-2.5 text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create your first tree</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {trees.map((tree) => {
              const est = calculateTreePrice(tree.peopleCount, currency);
              const isRenaming = renamingId === tree.id;
              return (
                <div
                  key={tree.id}
                  className="rounded-xl border border-[#DCD4BE] bg-white p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      {isRenaming ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            aria-label="New tree name"
                            className="min-w-[220px] flex-1 rounded-lg border border-[#1B4332] bg-[#FAF7F0] px-3 py-1.5 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameSubmit(tree.id)}
                            className="rounded-lg bg-[#1B4332] px-3 py-1.5 text-xs font-medium text-white cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenamingId(null)}
                            className="rounded-lg border border-[#DCD4BE] px-3 py-1.5 text-xs font-medium text-[#3A413C] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <h2 className="font-display text-xl font-semibold text-[#1F2421] truncate">
                          {tree.name}
                        </h2>
                      )}

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#5E6660]">
                        <span className="tabular-nums">
                          {tree.peopleCount} {tree.peopleCount === 1 ? 'person' : 'people'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          Updated {new Date(tree.updatedAt).toLocaleDateString()}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          Est. export {est.formattedTotal}
                        </span>
                        {tree.pendingSubmissionsCount > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-[#9C6B21] tabular-nums">
                              {tree.pendingSubmissionsCount} pending{' '}
                              {tree.pendingSubmissionsCount === 1 ? 'submission' : 'submissions'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/trees/${tree.id}/edit`)}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#1B4332] px-3.5 py-1.5 text-xs font-medium text-[#FAF7F0] hover:bg-[#143326] cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Open editor</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/trees/${tree.id}/review`)}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-3 py-1.5 text-xs font-medium text-[#1F2421] hover:bg-[#EAE4D3] cursor-pointer"
                      >
                        <Inbox className="h-3.5 w-3.5" />
                        <span>
                          Review ({tree.pendingSubmissionsCount})
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/trees/${tree.id}/preview`)}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#DCD4BE] bg-white px-3 py-1.5 text-xs font-medium text-[#1F2421] hover:bg-[#F2EDE2] cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Preview &amp; Export</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingId(tree.id);
                          setRenameValue(tree.name);
                        }}
                        className="inline-flex min-h-[38px] items-center rounded-lg border border-[#DCD4BE] bg-white px-3 py-1.5 text-xs font-medium text-[#3A413C] hover:bg-[#F2EDE2] cursor-pointer"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(tree.id)}
                        className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-[#DCD4BE] bg-white px-3 py-1.5 text-xs font-medium text-[#3A413C] hover:bg-[#F2EDE2] cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>Duplicate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveBackup(tree.id)}
                        className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-[#DCD4BE] bg-white px-3 py-1.5 text-xs font-medium text-[#3A413C] hover:bg-[#F2EDE2] cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Save backup</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(tree)}
                        aria-label={`Delete ${tree.name}`}
                        className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
