import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, CreditCard, Download, FileJson, Printer, Save } from 'lucide-react';
import { TreeVisualizer } from '../components/TreeVisualizer.tsx';
import { useApp } from '../context/AppContext.tsx';
import { apiClient } from '../services/apiClient.ts';
import { calculateTreePrice } from '../shared/pricing.ts';
import { DEFAULT_DESIGN_CONFIG, DESIGN_COLOR_PRESETS, SEATING_MODELS } from '../shared/sampleData.ts';
import type {
  FamilyTree,
  Person,
  Relationship,
  SeatingModelId,
  TreeDesignConfig,
  TreeFontFamily,
  TreeTextSize,
  TreeVisualStyle,
} from '../shared/types.ts';
import { exportTreeToPng } from '../utils/exportPng.ts';

const STYLES: { id: TreeVisualStyle; label: string }[] = [
  { id: 'classic', label: 'Classic family chart' },
  { id: 'portrait', label: 'Portrait layout' },
  { id: 'landscape', label: 'Landscape layout' },
  { id: 'green_tree', label: 'Green tree (upward)' },
  { id: 'photo_cards', label: 'Simple photo cards' },
];

const FONTS: TreeFontFamily[] = [
  'Fraunces',
  'Cormorant Garamond',
  'Playfair Display',
  'Lora',
  'Plus Jakarta Sans',
  'DM Sans',
];

export function PreviewExportPage({ treeId }: { treeId: string }) {
  const { user, navigate, currency } = useApp();
  const [tree, setTree] = useState<FamilyTree | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [design, setDesign] = useState<TreeDesignConfig>(DEFAULT_DESIGN_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTree = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await apiClient.getTree(treeId);
      setTree(res.tree);
      setPeople(res.people);
      setRelationships(res.relationships);
      setDesign(res.tree.design);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load tree preview.');
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

  if (!user) return null;

  const handleSaveDesign = async () => {
    if (!tree) return;
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      const res = await apiClient.updateTreeMeta(tree.id, { design });
      setTree(res.tree);
      setFeedback('Design preferences saved to your tree.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save design.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPng = async () => {
    if (!tree) return;
    setExporting(true);
    setError(null);
    setFeedback(null);
    try {
      await exportTreeToPng({
        treeName: tree.name,
        people,
        relationships,
        design,
      });
      setFeedback('PNG preview downloaded.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export PNG.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleSaveBackupJson = () => {
    if (!tree) return;
    const backupPayload = {
      format: 'roots-and-branches-backup-v1',
      exportedAt: new Date().toISOString(),
      tree: {
        name: tree.name,
        description: tree.description,
        design,
      },
      people,
      relationships,
    };
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const slug = tree.name
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
    setFeedback('Family tree backup (.json) saved to your device.');
  };

  const estimate = calculateTreePrice(people.length, currency);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="no-print flex flex-col gap-4 border-b border-[#E5DEC9] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/trees/${treeId}/edit`)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5E6660] hover:text-[#1B4332] cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to tree editor</span>
          </button>
          <h1 className="mt-1 font-display text-2xl font-semibold text-[#1B4332]">
            Preview &amp; Design Studio
          </h1>
          <p className="text-xs text-[#5E6660] tabular-nums">
            {tree?.name ?? 'Loading…'} · {people.length} people · Est. {estimate.formattedTotal}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveDesign}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#DCD4BE] bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-[#1F2421] hover:bg-[#F2EDE2] cursor-pointer"
          >
            <Save className="h-4 w-4 text-[#1B4332]" />
            <span>{saving ? 'Saving…' : 'Save style'}</span>
          </button>

          <button
            type="button"
            disabled={exporting || people.length === 0}
            onClick={handleDownloadPng}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#1B4332] bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-[#1B4332] hover:bg-[#EAF0EC] disabled:opacity-50 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>{exporting ? 'Rendering PNG…' : 'Download PNG'}</span>
          </button>

          <button
            type="button"
            disabled={people.length === 0}
            onClick={handlePrintPdf}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#DCD4BE] bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-[#1F2421] hover:bg-[#F2EDE2] disabled:opacity-50 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save PDF</span>
          </button>

          <button
            type="button"
            onClick={handleSaveBackupJson}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#DCD4BE] bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-[#1F2421] hover:bg-[#F2EDE2] cursor-pointer"
          >
            <FileJson className="h-4 w-4 text-[#1B4332]" />
            <span>Save backup (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/checkout/${treeId}`)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#1B4332] px-4 py-2 text-xs sm:text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] cursor-pointer"
          >
            <CreditCard className="h-4 w-4" />
            <span>Checkout (Demo)</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="no-print mt-4 flex items-center gap-2 rounded-lg border border-[#6B8E78]/50 bg-[#EAF0EC] px-4 py-2.5 text-sm text-[#1B4332]">
          <Check className="h-4 w-4" />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="no-print mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Customization Controls */}
        <aside className="no-print lg:col-span-3 space-y-5 rounded-xl border border-[#DCD4BE] bg-white p-5">
          <div>
            <label htmlFor="preview-style" className="block text-xs font-semibold text-[#1F2421]">
              Visual style
            </label>
            <select
              id="preview-style"
              value={design.style}
              onChange={(e) => {
                const style = e.target.value as TreeVisualStyle;
                setDesign((d) => ({
                  ...d,
                  style,
                  orientation:
                    style === 'portrait'
                      ? 'portrait'
                      : style === 'landscape'
                        ? 'landscape'
                        : d.orientation,
                }));
              }}
              className="mt-1.5 w-full rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-3 py-2 text-sm"
            >
              {STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="preview-seating" className="block text-xs font-semibold text-[#1F2421]">
                Family gathering seating
              </label>
              <span className="text-[11px] text-[#6B8E78]">3 Indoor · 3 Outdoor</span>
            </div>
            <select
              id="preview-seating"
              value={design.seatingModel ?? 'indoor_heirloom_sofa'}
              onChange={(e) =>
                setDesign((d) => ({ ...d, seatingModel: e.target.value as SeatingModelId }))
              }
              className="mt-1.5 w-full rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-3 py-2 text-sm"
            >
              <optgroup label="Indoor Seating (3)">
                {SEATING_MODELS.filter((m) => m.category === 'indoor').map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Outdoor Seating (3)">
                {SEATING_MODELS.filter((m) => m.category === 'outdoor').map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
              <option value="none">No seating illustration</option>
            </select>
            {design.seatingModel && design.seatingModel !== 'none' && (
              <p className="mt-1 text-[11px] leading-snug text-[#5E6660]">
                {SEATING_MODELS.find((m) => m.id === design.seatingModel)?.subtitle}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="preview-font" className="block text-xs font-semibold text-[#1F2421]">
              Typography
            </label>
            <select
              id="preview-font"
              value={design.fontFamily}
              onChange={(e) =>
                setDesign((d) => ({ ...d, fontFamily: e.target.value as TreeFontFamily }))
              }
              className="mt-1.5 w-full rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-3 py-2 text-sm"
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-xs font-semibold text-[#1F2421]">Text size</span>
            <div className="mt-1.5 grid grid-cols-3 rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] p-1">
              {(['small', 'medium', 'large'] as TreeTextSize[]).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setDesign((d) => ({ ...d, textSize: sz }))}
                  className={`rounded-md py-1.5 text-xs font-medium capitalize cursor-pointer ${
                    design.textSize === sz ? 'bg-[#1B4332] text-[#FAF7F0]' : 'text-[#3A413C]'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-[#1F2421]">
              Accessible color presets
            </span>
            <div className="mt-2 space-y-2">
              {DESIGN_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    setDesign((d) => ({
                      ...d,
                      backgroundColor: preset.backgroundColor,
                      lineColor: preset.lineColor,
                      cardColor: preset.cardColor,
                      cardTextColor: preset.cardTextColor,
                      accentColor: preset.accentColor,
                    }))
                  }
                  className="flex w-full items-center justify-between rounded-lg border border-[#DCD4BE] px-3 py-2 text-xs hover:bg-[#FAF7F0] cursor-pointer"
                >
                  <span className="font-medium text-[#1F2421]">{preset.name}</span>
                  <span className="flex items-center gap-1">
                    <span
                      style={{ backgroundColor: preset.backgroundColor }}
                      className="h-3.5 w-3.5 rounded-full border border-black/15"
                    />
                    <span
                      style={{ backgroundColor: preset.lineColor }}
                      className="h-3.5 w-3.5 rounded-full border border-black/15"
                    />
                    <span
                      style={{ backgroundColor: preset.cardColor }}
                      className="h-3.5 w-3.5 rounded-full border border-black/15"
                    />
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-[#E5DEC9] pt-4 text-xs">
            <label className="flex flex-col gap-1">
              <span className="text-[#5E6660]">Background</span>
              <input
                type="color"
                value={design.backgroundColor}
                onChange={(e) => setDesign((d) => ({ ...d, backgroundColor: e.target.value }))}
                className="h-9 w-full cursor-pointer rounded border border-[#DCD4BE] bg-white p-0.5"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[#5E6660]">Lines</span>
              <input
                type="color"
                value={design.lineColor}
                onChange={(e) => setDesign((d) => ({ ...d, lineColor: e.target.value }))}
                className="h-9 w-full cursor-pointer rounded border border-[#DCD4BE] bg-white p-0.5"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[#5E6660]">Cards</span>
              <input
                type="color"
                value={design.cardColor}
                onChange={(e) => setDesign((d) => ({ ...d, cardColor: e.target.value }))}
                className="h-9 w-full cursor-pointer rounded border border-[#DCD4BE] bg-white p-0.5"
              />
            </label>
          </div>

          <div className="rounded-lg border border-[#E5DEC9] bg-[#FAF7F0] p-3 text-[11px] leading-relaxed text-[#5E6660]">
            <strong>Export note:</strong> Download PNG generates a 2× resolution image immediately.
            Print / Save PDF uses your browser’s print-to-PDF sheet; dedicated print-lab vector PDF
            generation remains to be added before launch.
          </div>
        </aside>

        {/* Live Preview */}
        <div className="lg:col-span-9 print-canvas-only">
          {loading ? (
            <div className="h-[560px] animate-pulse rounded-xl border border-[#DCD4BE] bg-white" />
          ) : (
            <TreeVisualizer
              treeName={tree?.name ?? 'Family Tree'}
              people={people}
              relationships={relationships}
              design={design}
              minHeightClass="h-[540px] sm:h-[620px]"
            />
          )}
        </div>
      </div>
    </div>
  );
}
