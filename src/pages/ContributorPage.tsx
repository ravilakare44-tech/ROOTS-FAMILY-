import React, { useEffect, useState } from 'react';
import { CheckCircle2, Lock, Plus, Trash2, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { apiClient } from '../services/apiClient.ts';
import { TREE_LIMITS } from '../shared/treeLimits.ts';
import type { DatePrecision, RelationshipType, SubmittedPerson } from '../shared/types.ts';

function createBlankPerson(index: number): SubmittedPerson {
  return {
    tempId: `tmp-${Date.now()}-${index}`,
    fullName: '',
    alternateName: '',
    birthDate: '',
    birthDatePrecision: 'exact',
    deathDate: '',
    deathDatePrecision: 'unknown',
    notes: '',
    relationType: undefined,
    relationLabel: '',
    relationTargetId: '',
    relationTargetName: '',
    relationDirection: 'new_is_child',
  };
}

export function ContributorPage({ token }: { token: string }) {
  const { navigate } = useApp();
  const [loading, setLoading] = useState(true);
  const [inviteInfo, setInviteInfo] = useState<{
    active: boolean;
    treeName: string;
    shareAnchorNames: boolean;
    anchorPeople: { id: string; fullName: string }[];
  } | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [contributorName, setContributorName] = useState('');
  const [contributorEmail, setContributorEmail] = useState('');
  const [people, setPeople] = useState<SubmittedPerson[]>([createBlankPerson(1)]);
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedReceipt, setSubmittedReceipt] = useState<{
    submissionId: string;
    submittedCount: number;
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    setLinkError(null);
    apiClient
      .getPublicInvite(token)
      .then((res) => {
        setInviteInfo(res);
      })
      .catch((err) => {
        setLinkError(
          err instanceof Error
            ? err.message
            : 'This private invite link is invalid or currently disabled.'
        );
      })
      .finally(() => setLoading(false));
  }, [token]);

  const updatePerson = (tempId: string, patch: Partial<SubmittedPerson>) => {
    setPeople((prev) => prev.map((p) => (p.tempId === tempId ? { ...p, ...patch } : p)));
  };

  const handlePhotoUpload = (tempId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !TREE_LIMITS.ALLOWED_IMAGE_MIME_TYPES.includes(
        file.type as 'image/jpeg' | 'image/png' | 'image/webp'
      )
    ) {
      setFormError('Please upload a JPEG, PNG, or WebP photo.');
      return;
    }
    if (file.size > TREE_LIMITS.MAX_PHOTO_BYTES) {
      setFormError('Photo must be smaller than 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setUploadProgress((prev) => ({
          ...prev,
          [tempId]: Math.round((ev.loaded / ev.total) * 100),
        }));
      }
    };
    reader.onload = () => {
      setUploadProgress((prev) => ({ ...prev, [tempId]: 100 }));
      if (typeof reader.result === 'string') {
        updatePerson(tempId, { photoUrl: reader.result });
      }
    };
    reader.onerror = () => setFormError('Could not read the selected photo.');
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!contributorName.trim()) {
      setFormError('Please enter your name so the tree owner recognizes your submission.');
      return;
    }
    if (!consentConfirmed) {
      setFormError(
        'Please confirm you have permission to share these family details and photos.'
      );
      return;
    }
    for (let i = 0; i < people.length; i++) {
      if (!people[i].fullName.trim()) {
        setFormError(`Please enter a full name for Person #${i + 1}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await apiClient.submitContribution(token, {
        contributorName: contributorName.trim(),
        contributorEmail: contributorEmail.trim() || undefined,
        consentConfirmed,
        people,
      });
      setSubmittedReceipt({
        submissionId: res.submissionId,
        submittedCount: res.submittedCount,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to submit right now.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="h-40 animate-pulse rounded-2xl border border-[#DCD4BE] bg-white" />
      </div>
    );
  }

  if (linkError || !inviteInfo || !inviteInfo.active) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-[#DCD4BE] bg-white p-8">
          <Lock className="mx-auto h-8 w-8 text-[#6B8E78]" />
          <h1 className="mt-4 font-display text-2xl font-semibold text-[#1F2421]">
            Invite link unavailable
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#5E6660]">
            {linkError ||
              'Submissions for this invite link are currently closed or the link is no longer valid.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 min-h-[40px] rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-5 py-2 text-sm font-medium text-[#1F2421] hover:bg-[#EAE4D3] cursor-pointer"
          >
            Return home
          </button>
        </div>
      </div>
    );
  }

  if (submittedReceipt) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-[#6B8E78]/40 bg-white p-8">
          <CheckCircle2 className="mx-auto h-10 w-10 text-[#1B4332]" />
          <h1 className="mt-4 font-display text-2xl font-semibold text-[#1B4332]">
            Thank you—your submission is waiting for review
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#3A413C]">
            We sent <strong className="tabular-nums">{submittedReceipt.submittedCount}</strong>{' '}
            {submittedReceipt.submittedCount === 1 ? 'person’s details' : 'people’s details'} to
            the owner of <strong>{inviteInfo.treeName}</strong>. Submissions remain private and
            pending until reviewed by the tree owner.
          </p>
          <p className="mt-4 text-xs text-[#5E6660] tabular-nums">
            Reference: {submittedReceipt.submissionId}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-[#DCD4BE] bg-white p-6 sm:p-8">
        <p className="text-xs font-medium text-[#6B8E78]">Private family invite · No account needed</p>
        <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-semibold text-[#1B4332]">
          Add family details for {inviteInfo.treeName}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#3A413C]">
          Your submission stays private to the tree owner and will remain pending until they review
          and approve it. You cannot view other family members’ private details from this form.
        </p>

        {formError && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-8">
          {/* Contributor Info */}
          <div className="grid gap-4 sm:grid-cols-2 border-b border-[#E5DEC9] pb-6">
            <div>
              <label htmlFor="c-name" className="block text-sm font-medium text-[#1F2421]">
                Your name <span className="text-red-700">*</span>
              </label>
              <input
                id="c-name"
                type="text"
                required
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                placeholder="e.g., Deepa Rao"
                className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="c-email" className="block text-sm font-medium text-[#1F2421]">
                Your email (optional)
              </label>
              <input
                id="c-email"
                type="email"
                value={contributorEmail}
                onChange={(e) => setContributorEmail(e.target.value)}
                placeholder="If the owner needs to follow up"
                className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          {/* Submitted People List */}
          <div className="space-y-6">
            {people.map((person, index) => {
              const otherSubmitted = people.filter((p) => p.tempId !== person.tempId && p.fullName.trim());
              return (
                <div
                  key={person.tempId}
                  className="rounded-xl border border-[#DCD4BE] bg-[#FAF7F0]/70 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold text-[#1B4332]">
                      Family member #{index + 1}
                    </h2>
                    {people.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setPeople((prev) => prev.filter((p) => p.tempId !== person.tempId))
                        }
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:underline cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`fn-${person.tempId}`}
                        className="block text-xs font-medium text-[#1F2421]"
                      >
                        Full name <span className="text-red-700">*</span>
                      </label>
                      <input
                        id={`fn-${person.tempId}`}
                        type="text"
                        required
                        value={person.fullName}
                        onChange={(e) => updatePerson(person.tempId, { fullName: e.target.value })}
                        placeholder="Full name"
                        className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`alt-${person.tempId}`}
                        className="block text-xs font-medium text-[#1F2421]"
                      >
                        Maiden or alternate name (optional)
                      </label>
                      <input
                        id={`alt-${person.tempId}`}
                        type="text"
                        value={person.alternateName ?? ''}
                        onChange={(e) =>
                          updatePerson(person.tempId, { alternateName: e.target.value })
                        }
                        placeholder="Optional"
                        className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* Birth & Death Dates */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`bp-${person.tempId}`}
                        className="block text-xs font-medium text-[#1F2421]"
                      >
                        Birth date precision
                      </label>
                      <div className="mt-1 flex gap-2">
                        <select
                          id={`bp-${person.tempId}`}
                          value={person.birthDatePrecision}
                          onChange={(e) =>
                            updatePerson(person.tempId, {
                              birthDatePrecision: e.target.value as DatePrecision,
                            })
                          }
                          className="rounded-lg border border-[#DCD4BE] bg-white px-2.5 py-2 text-xs"
                        >
                          <option value="exact">Exact</option>
                          <option value="approximate">Approximate</option>
                          <option value="year_only">Year only</option>
                          <option value="unknown">Unknown</option>
                        </select>
                        <input
                          type={person.birthDatePrecision === 'exact' ? 'date' : 'text'}
                          disabled={person.birthDatePrecision === 'unknown'}
                          value={
                            person.birthDatePrecision === 'unknown' ? '' : person.birthDate ?? ''
                          }
                          onChange={(e) =>
                            updatePerson(person.tempId, { birthDate: e.target.value })
                          }
                          aria-label="Birth date"
                          placeholder="YYYY or date"
                          className="min-w-0 flex-1 rounded-lg border border-[#DCD4BE] bg-white px-3 py-2 text-sm disabled:bg-[#F2EDE2]"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={`dp-${person.tempId}`}
                        className="block text-xs font-medium text-[#1F2421]"
                      >
                        Death date precision
                      </label>
                      <div className="mt-1 flex gap-2">
                        <select
                          id={`dp-${person.tempId}`}
                          value={person.deathDatePrecision}
                          onChange={(e) =>
                            updatePerson(person.tempId, {
                              deathDatePrecision: e.target.value as DatePrecision,
                            })
                          }
                          className="rounded-lg border border-[#DCD4BE] bg-white px-2.5 py-2 text-xs"
                        >
                          <option value="unknown">Living / Unknown</option>
                          <option value="exact">Exact</option>
                          <option value="approximate">Approximate</option>
                          <option value="year_only">Year only</option>
                        </select>
                        <input
                          type={person.deathDatePrecision === 'exact' ? 'date' : 'text'}
                          disabled={person.deathDatePrecision === 'unknown'}
                          value={
                            person.deathDatePrecision === 'unknown' ? '' : person.deathDate ?? ''
                          }
                          onChange={(e) =>
                            updatePerson(person.tempId, { deathDate: e.target.value })
                          }
                          aria-label="Death date"
                          placeholder="YYYY or date"
                          className="min-w-0 flex-1 rounded-lg border border-[#DCD4BE] bg-white px-3 py-2 text-sm disabled:bg-[#F2EDE2]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Connection to existing tree person or another person in this submission */}
                  <div className="rounded-lg border border-[#E5DEC9] bg-white p-3.5 space-y-3">
                    <p className="text-xs font-semibold text-[#1F2421]">
                      How is this person connected? (optional)
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <select
                        aria-label="Relationship type"
                        value={person.relationType ?? ''}
                        onChange={(e) =>
                          updatePerson(person.tempId, {
                            relationType: (e.target.value || undefined) as
                              | RelationshipType
                              | undefined,
                          })
                        }
                        className="rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-2.5 py-2 text-xs"
                      >
                        <option value="">Select relationship…</option>
                        <option value="parent_child">Parent / Child</option>
                        <option value="spouse_partner">Spouse / Partner</option>
                        <option value="other">Other relative</option>
                      </select>

                      {person.relationType === 'parent_child' && (
                        <select
                          aria-label="Relationship direction"
                          value={person.relationDirection ?? 'new_is_child'}
                          onChange={(e) =>
                            updatePerson(person.tempId, {
                              relationDirection: e.target.value as
                                | 'new_is_parent'
                                | 'new_is_child',
                            })
                          }
                          className="rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-2.5 py-2 text-xs"
                        >
                          <option value="new_is_child">Is child of…</option>
                          <option value="new_is_parent">Is parent of…</option>
                        </select>
                      )}

                      {person.relationType && (
                        <select
                          aria-label="Connect to person"
                          value={person.relationTargetId ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const anchor = inviteInfo.anchorPeople.find((a) => a.id === val);
                            const subMatch = otherSubmitted.find((o) => o.tempId === val);
                            updatePerson(person.tempId, {
                              relationTargetId: val || undefined,
                              relationTargetName:
                                anchor?.fullName || subMatch?.fullName || person.relationTargetName,
                            });
                          }}
                          className="rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-2.5 py-2 text-xs"
                        >
                          <option value="">Choose person or type below…</option>
                          {inviteInfo.shareAnchorNames && inviteInfo.anchorPeople.length > 0 && (
                            <optgroup label="People already in tree">
                              {inviteInfo.anchorPeople.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.fullName}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {otherSubmitted.length > 0 && (
                            <optgroup label="People in this submission">
                              {otherSubmitted.map((o) => (
                                <option key={o.tempId} value={o.tempId}>
                                  {o.fullName}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      )}
                    </div>

                    {person.relationType && !person.relationTargetId && (
                      <input
                        type="text"
                        value={person.relationTargetName ?? ''}
                        onChange={(e) =>
                          updatePerson(person.tempId, { relationTargetName: e.target.value })
                        }
                        placeholder="Type the relative’s name (e.g., Meera Kulkarni)"
                        className="w-full rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-3 py-1.5 text-xs"
                      />
                    )}
                  </div>

                  {/* Photo & Note */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-[#1F2421]">
                        Photo (optional · JPEG, PNG, WebP up to 2 MB)
                      </p>
                      <div className="mt-1.5 flex items-center gap-3">
                        <label className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-lg border border-[#DCD4BE] bg-white px-3 py-1.5 text-xs font-medium text-[#1B4332] hover:bg-[#EAE4D3]">
                          <Upload className="h-3.5 w-3.5" />
                          <span>{person.photoUrl ? 'Replace photo' : 'Choose photo'}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => handlePhotoUpload(person.tempId, e)}
                            className="sr-only"
                          />
                        </label>
                        {person.photoUrl && (
                          <img
                            src={person.photoUrl}
                            alt="Uploaded preview"
                            className="h-10 w-10 rounded-full object-cover border border-[#DCD4BE]"
                          />
                        )}
                      </div>
                      {uploadProgress[person.tempId] !== undefined && (
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E5DEC9]">
                          <div
                            style={{ width: `${uploadProgress[person.tempId]}%` }}
                            className="h-full bg-[#1B4332] transition-all"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor={`note-${person.tempId}`}
                        className="block text-xs font-medium text-[#1F2421]"
                      >
                        Note (optional)
                      </label>
                      <textarea
                        id={`note-${person.tempId}`}
                        rows={2}
                        value={person.notes ?? ''}
                        onChange={(e) => updatePerson(person.tempId, { notes: e.target.value })}
                        placeholder="Birthplace, story, or context"
                        className="mt-1 w-full rounded-lg border border-[#DCD4BE] bg-white px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => setPeople((prev) => [...prev, createBlankPerson(prev.length + 1)])}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#1B4332] bg-white px-4 py-2 text-sm font-medium text-[#1B4332] hover:bg-[#EAF0EC] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add another person</span>
            </button>
          </div>

          {/* Unchecked Consent Checkbox */}
          <div className="rounded-xl border border-[#DCD4BE] bg-[#F2EDE2]/70 p-4">
            <label className="flex items-start gap-3 text-sm text-[#1F2421] cursor-pointer">
              <input
                type="checkbox"
                checked={consentConfirmed}
                onChange={(e) => setConsentConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[#1B4332]"
              />
              <span>
                I confirm I have permission to submit these family details and photos, and I
                understand the tree owner will review them before adding them to the tree.
              </span>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] rounded-lg bg-[#1B4332] px-6 py-2.5 text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Submitting privately…' : 'Submit to tree owner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
