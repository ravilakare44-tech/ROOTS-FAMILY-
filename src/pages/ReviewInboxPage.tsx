import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { apiClient } from '../services/apiClient.ts';
import { findPossibleDuplicates } from '../shared/duplicateCheck.ts';
import type { Person, Submission, SubmittedPerson } from '../shared/types.ts';

export function ReviewInboxPage({ treeId }: { treeId: string }) {
  const { user, navigate } = useApp();
  const [treeName, setTreeName] = useState('');
  const [existingPeople, setExistingPeople] = useState<Person[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Per-submission selection & inline edits
  const [selectedMap, setSelectedMap] = useState<Record<string, Record<string, boolean>>>({});
  const [editedMap, setEditedMap] = useState<Record<string, Record<string, SubmittedPerson>>>({});

  // Confirmation modal
  const [confirmAction, setConfirmAction] = useState<{
    submission: Submission;
    action: 'approve' | 'reject';
    selectedTempIds?: string[];
  } | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [treeRes, subRes] = await Promise.all([
        apiClient.getTree(treeId),
        apiClient.listSubmissions(treeId),
      ]);
      setTreeName(treeRes.tree.name);
      setExistingPeople(treeRes.people);
      setSubmissions(subRes.submissions);

      const nextSel: Record<string, Record<string, boolean>> = {};
      const nextEdits: Record<string, Record<string, SubmittedPerson>> = {};
      for (const sub of subRes.submissions) {
        nextSel[sub.id] = {};
        nextEdits[sub.id] = {};
        for (const p of sub.people) {
          nextSel[sub.id][p.tempId] = p.reviewDecision !== 'approved';
          nextEdits[sub.id][p.tempId] = { ...p };
        }
      }
      setSelectedMap(nextSel);
      setEditedMap(nextEdits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load review inbox.');
    } finally {
      setLoading(false);
    }
  }, [treeId, user]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadData();
  }, [user, navigate, loadData]);

  if (!user) return null;

  const updateEditedPerson = (
    subId: string,
    tempId: string,
    patch: Partial<SubmittedPerson>
  ) => {
    setEditedMap((prev) => ({
      ...prev,
      [subId]: {
        ...(prev[subId] ?? {}),
        [tempId]: {
          ...(prev[subId]?.[tempId] ?? { tempId, fullName: '', birthDatePrecision: 'unknown', deathDatePrecision: 'unknown' }),
          ...patch,
        },
      },
    }));
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    const { submission, action, selectedTempIds } = confirmAction;
    setConfirmAction(null);
    setError(null);
    setWarnings([]);
    setStatusMessage(null);

    try {
      const editedPeople = Object.values(editedMap[submission.id] ?? {});
      const res = await apiClient.reviewSubmission(treeId, submission.id, {
        action,
        selectedTempIds,
        editedPeople,
      });
      setExistingPeople(res.people);
      if (res.warnings && res.warnings.length > 0) {
        setWarnings(res.warnings);
      }
      setStatusMessage(
        action === 'reject'
          ? `Submission from ${submission.contributorName} marked as rejected.`
          : `Approved submission from ${submission.contributorName} and updated tree.`
      );
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review action failed.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <button
        type="button"
        onClick={() => navigate(`/trees/${treeId}/edit`)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5E6660] hover:text-[#1B4332] cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to tree editor</span>
      </button>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1B4332]">
            Submission review inbox
          </h1>
          <p className="mt-1 text-sm text-[#5E6660]">
            Tree: {treeName || 'Loading…'} · Nothing joins your tree until you approve it.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {statusMessage && (
        <div className="mt-4 rounded-lg border border-[#6B8E78]/50 bg-[#EAF0EC] px-4 py-3 text-sm text-[#1B4332]">
          {statusMessage}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mt-4 rounded-lg border border-[#B08D57] bg-[#FAF3E6] px-4 py-3 text-sm text-[#6B4F24]">
          {warnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2421]/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#DCD4BE] bg-[#FAF7F0] p-6 shadow-xl">
            <h2 className="font-display text-xl font-semibold text-[#1F2421]">
              {confirmAction.action === 'reject'
                ? 'Reject this submission?'
                : 'Approve selected family details?'}
            </h2>
            <p className="mt-2 text-sm text-[#3A413C]">
              {confirmAction.action === 'reject'
                ? `This will reject the remaining pending entries submitted by ${confirmAction.submission.contributorName}.`
                : `Approved people and relationships from ${confirmAction.submission.contributorName} will be added to your tree.`}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="min-h-[40px] rounded-lg border border-[#DCD4BE] bg-white px-4 py-2 text-sm font-medium text-[#3A413C] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className={`min-h-[40px] rounded-lg px-4 py-2 text-sm font-medium text-white cursor-pointer ${
                  confirmAction.action === 'reject'
                    ? 'bg-red-700 hover:bg-red-800'
                    : 'bg-[#1B4332] hover:bg-[#143326]'
                }`}
              >
                {confirmAction.action === 'reject' ? 'Confirm reject' : 'Confirm approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-6">
        {loading ? (
          <div className="h-44 animate-pulse rounded-xl border border-[#DCD4BE] bg-white" />
        ) : submissions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#B0A890] bg-white p-10 text-center">
            <h2 className="font-display text-xl font-semibold text-[#1B4332]">
              No submissions yet
            </h2>
            <p className="mt-2 text-sm text-[#5E6660]">
              Share your private contributor invite link from the tree editor to receive family
              updates here.
            </p>
          </div>
        ) : (
          submissions.map((sub) => {
            const isPending = sub.status === 'pending' || sub.status === 'partially_reviewed';
            const selectedIds = sub.people
              .filter((p) => p.reviewDecision !== 'approved' && selectedMap[sub.id]?.[p.tempId])
              .map((p) => p.tempId);

            return (
              <article
                key={sub.id}
                className="rounded-2xl border border-[#DCD4BE] bg-white p-5 sm:p-6"
              >
                <div className="flex flex-col gap-3 border-b border-[#E5DEC9] pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-[#5E6660] tabular-nums">
                      Submitted {new Date(sub.createdAt).toLocaleString()} · Status:{' '}
                      <strong className="capitalize text-[#1B4332]">
                        {sub.status.replace('_', ' ')}
                      </strong>
                    </p>
                    <h2 className="mt-1 font-display text-xl font-semibold text-[#1F2421]">
                      From {sub.contributorName}
                    </h2>
                    {sub.contributorEmail && (
                      <p className="text-xs text-[#5E6660]">{sub.contributorEmail}</p>
                    )}
                  </div>

                  {isPending && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={selectedIds.length === 0}
                        onClick={() =>
                          setConfirmAction({
                            submission: sub,
                            action: 'approve',
                            selectedTempIds: selectedIds,
                          })
                        }
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#1B4332] px-3.5 py-1.5 text-xs font-medium text-[#FAF7F0] hover:bg-[#143326] disabled:opacity-40 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Approve selected ({selectedIds.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmAction({
                            submission: sub,
                            action: 'approve',
                            selectedTempIds: sub.people
                              .filter((p) => p.reviewDecision !== 'approved')
                              .map((p) => p.tempId),
                          })
                        }
                        className="inline-flex min-h-[38px] items-center rounded-lg border border-[#1B4332] px-3.5 py-1.5 text-xs font-medium text-[#1B4332] hover:bg-[#EAF0EC] cursor-pointer"
                      >
                        Approve all
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmAction({
                            submission: sub,
                            action: 'reject',
                          })
                        }
                        className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-red-200 px-3.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-4">
                  {sub.people.map((orig) => {
                    const edited = editedMap[sub.id]?.[orig.tempId] ?? orig;
                    const alreadyDone = orig.reviewDecision === 'approved' || sub.status === 'rejected';
                    const dupMatches = findPossibleDuplicates(
                      {
                        fullName: edited.fullName,
                        alternateName: edited.alternateName,
                        birthDate: edited.birthDate,
                      },
                      existingPeople
                    );

                    return (
                      <div
                        key={orig.tempId}
                        className="rounded-xl border border-[#E5DEC9] bg-[#FAF7F0]/70 p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-[#1F2421] cursor-pointer">
                            {!alreadyDone && (
                              <input
                                type="checkbox"
                                checked={Boolean(selectedMap[sub.id]?.[orig.tempId])}
                                onChange={(e) =>
                                  setSelectedMap((prev) => ({
                                    ...prev,
                                    [sub.id]: {
                                      ...(prev[sub.id] ?? {}),
                                      [orig.tempId]: e.target.checked,
                                    },
                                  }))
                                }
                                className="h-4 w-4 accent-[#1B4332]"
                              />
                            )}
                            <span>{edited.fullName || 'Unnamed person'}</span>
                          </label>
                          <span className="text-xs text-[#5E6660] capitalize">
                            {orig.reviewDecision ?? 'pending'}
                          </span>
                        </div>

                        {/* Duplicate Detection Warning & Link Option */}
                        {!alreadyDone && dupMatches.length > 0 && (
                          <div className="rounded-lg border border-[#B08D57] bg-[#FAF3E6] p-3 text-xs text-[#6B4F24] space-y-2">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                              <span>
                                Possible duplicate match: {dupMatches[0].person.fullName} (
                                {dupMatches[0].reason})
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <label htmlFor={`dup-link-${orig.tempId}`}>Resolution:</label>
                              <select
                                id={`dup-link-${orig.tempId}`}
                                value={edited.linkToExistingPersonId ?? ''}
                                onChange={(e) =>
                                  updateEditedPerson(sub.id, orig.tempId, {
                                    linkToExistingPersonId: e.target.value || undefined,
                                  })
                                }
                                className="rounded border border-[#B08D57]/60 bg-white px-2.5 py-1 text-xs text-[#1F2421]"
                              >
                                <option value="">Create as a new person</option>
                                {dupMatches.map((m) => (
                                  <option key={m.person.id} value={m.person.id}>
                                    Link to existing: {m.person.fullName} (avoid duplicate)
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Editable fields before approval */}
                        <div className="grid gap-3 sm:grid-cols-3 text-xs">
                          <div>
                            <label className="block text-[#5E6660]">Full name</label>
                            <input
                              type="text"
                              disabled={alreadyDone}
                              value={edited.fullName}
                              onChange={(e) =>
                                updateEditedPerson(sub.id, orig.tempId, {
                                  fullName: e.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-white px-2.5 py-1.5 text-sm disabled:bg-[#F2EDE2]"
                            />
                          </div>
                          <div>
                            <label className="block text-[#5E6660]">Alternate name</label>
                            <input
                              type="text"
                              disabled={alreadyDone}
                              value={edited.alternateName ?? ''}
                              onChange={(e) =>
                                updateEditedPerson(sub.id, orig.tempId, {
                                  alternateName: e.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-white px-2.5 py-1.5 text-sm disabled:bg-[#F2EDE2]"
                            />
                          </div>
                          <div>
                            <label className="block text-[#5E6660]">Birth date</label>
                            <input
                              type="text"
                              disabled={alreadyDone}
                              value={edited.birthDate ?? ''}
                              onChange={(e) =>
                                updateEditedPerson(sub.id, orig.tempId, {
                                  birthDate: e.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-white px-2.5 py-1.5 text-sm disabled:bg-[#F2EDE2]"
                            />
                          </div>
                        </div>

                        {(orig.relationTargetName || orig.relationType || orig.notes || orig.photoUrl) && (
                          <div className="flex flex-wrap items-center gap-4 text-xs text-[#3A413C] pt-1">
                            {orig.photoUrl && (
                              <img
                                src={orig.photoUrl}
                                alt={orig.fullName}
                                className="h-12 w-12 rounded-full object-cover border border-[#DCD4BE]"
                              />
                            )}
                            {orig.relationType && (
                              <span>
                                <strong>Relationship:</strong> {orig.relationType.replace('_', ' ')}
                                {orig.relationTargetName ? ` → ${orig.relationTargetName}` : ''}
                              </span>
                            )}
                            {orig.notes && (
                              <span>
                                <strong>Note:</strong> {orig.notes}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
