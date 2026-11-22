import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Upload, X } from 'lucide-react';
import { apiClient } from '../services/apiClient.ts';
import { TREE_LIMITS } from '../shared/treeLimits.ts';

interface PhotoEditorModalProps {
  isOpen: boolean;
  personName: string;
  initialPhotoUrl?: string;
  canUseServerEnhance?: boolean;
  onSave: (photoUrl: string | undefined) => void;
  onClose: () => void;
}

export function PhotoEditorModal({
  isOpen,
  personName,
  initialPhotoUrl,
  canUseServerEnhance = true,
  onSave,
  onClose,
}: PhotoEditorModalProps) {
  const [sourceUrl, setSourceUrl] = useState<string | undefined>(initialPhotoUrl);
  const [cropZoom, setCropZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceResult, setEnhanceResult] = useState<{
    originalUrl: string;
    enhancedUrl: string;
    mode: 'gemini' | 'demo_unavailable';
    notice?: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSourceUrl(initialPhotoUrl);
    setCropZoom(1);
    setOffset({ x: 0, y: 0 });
    setError(null);
    setEnhanceResult(null);
  }, [isOpen, initialPhotoUrl]);

  const drawCropCanvas = (
    img: HTMLImageElement,
    zoomVal: number,
    off: { x: number; y: number }
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 280;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#EAF0EC';
    ctx.fillRect(0, 0, size, size);

    const coverScale = Math.max(size / img.width, size / img.height) * zoomVal;
    const drawW = img.width * coverScale;
    const drawH = img.height * coverScale;
    const dx = (size - drawW) / 2 + off.x;
    const dy = (size - drawH) / 2 + off.y;

    ctx.drawImage(img, dx, dy, drawW, drawH);
  };

  useEffect(() => {
    if (!isOpen || !sourceUrl) {
      loadedImageRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadedImageRef.current = img;
      drawCropCanvas(img, cropZoom, offset);
    };
    img.onerror = () => {
      setError('Could not load that image preview.');
    };
    img.src = sourceUrl;
  }, [isOpen, sourceUrl]);

  useEffect(() => {
    if (loadedImageRef.current) {
      drawCropCanvas(loadedImageRef.current, cropZoom, offset);
    }
  }, [cropZoom, offset]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setEnhanceResult(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!TREE_LIMITS.ALLOWED_IMAGE_MIME_TYPES.includes(file.type as 'image/jpeg' | 'image/png' | 'image/webp')) {
      setError('Please select a JPEG, PNG, or WebP photo.');
      return;
    }
    if (file.size > TREE_LIMITS.MAX_PHOTO_BYTES) {
      setError('Please choose a photo smaller than 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSourceUrl(reader.result);
        setCropZoom(1);
        setOffset({ x: 0, y: 0 });
      }
    };
    reader.onerror = () => setError('Could not read the selected file.');
    reader.readAsDataURL(file);
  };

  const getCroppedDataUrl = (): string | undefined => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceUrl) return undefined;
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const createLocalDemoClarityPreview = (croppedUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        if (!ctx) {
          resolve(croppedUrl);
          return;
        }
        ctx.filter = 'contrast(1.08) brightness(1.05) saturate(1.06)';
        ctx.drawImage(img, 0, 0);
        resolve(c.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = () => resolve(croppedUrl);
      img.src = croppedUrl;
    });
  };

  const handleExplicitEnhance = async () => {
    const cropped = getCroppedDataUrl();
    if (!cropped) return;

    setEnhancing(true);
    setError(null);
    try {
      const res = await apiClient.enhancePhoto(cropped);
      if (res.mode === 'gemini' && res.enhancedPhotoUrl) {
        setEnhanceResult({
          originalUrl: cropped,
          enhancedUrl: res.enhancedPhotoUrl,
          mode: 'gemini',
        });
      } else {
        const demoPreview = await createLocalDemoClarityPreview(cropped);
        setEnhanceResult({
          originalUrl: cropped,
          enhancedUrl: demoPreview,
          mode: 'demo_unavailable',
          notice:
            res.message ||
            'AI photo enhancement is not configured on this server. Showing a clearly labeled demo clarity preview.',
        });
      }
    } catch (err) {
      const demoPreview = await createLocalDemoClarityPreview(cropped);
      setEnhanceResult({
        originalUrl: cropped,
        enhancedUrl: demoPreview,
        mode: 'demo_unavailable',
        notice:
          err instanceof Error
            ? `${err.message} Showing a clearly labeled demo clarity preview instead.`
            : 'AI photo enhancement unavailable. Showing a clearly labeled demo preview.',
      });
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2421]/50 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#DCD4BE] bg-[#FAF7F0] p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="photo-modal-title" className="font-display text-xl font-semibold text-[#1B4332]">
              Photo for {personName || 'family member'}
            </h2>
            <p className="mt-1 text-xs text-[#5E6660]">
              JPEG, PNG, or WebP up to 2 MB. Photos are never altered automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo editor"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCD4BE] text-[#3A413C] hover:bg-[#F2EDE2] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {/* Side-by-side comparison when user explicitly invoked Enhance */}
        {enhanceResult ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-[#DCD4BE] bg-[#F2EDE2] p-3.5 text-xs text-[#3A413C]">
              {enhanceResult.mode === 'gemini' ? (
                <p>
                  <strong>AI Enhancement Preview:</strong> Review both portraits below and choose
                  whether to keep the original or accept the enhanced version.
                </p>
              ) : (
                <p>
                  <strong>Demo Preview (AI Enhancement Not Configured):</strong>{' '}
                  {enhanceResult.notice}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#DCD4BE] bg-white p-3 text-center">
                <p className="mb-2 text-xs font-semibold text-[#5E6660]">Original Crop</p>
                <img
                  src={enhanceResult.originalUrl}
                  alt="Original cropped portrait"
                  className="mx-auto h-44 w-44 rounded-full object-cover border border-[#E5DEC9]"
                />
              </div>
              <div className="rounded-xl border border-[#1B4332]/40 bg-white p-3 text-center">
                <p className="mb-2 text-xs font-semibold text-[#1B4332]">
                  {enhanceResult.mode === 'gemini' ? 'Enhanced Preview' : 'Demo Clarity Preview'}
                </p>
                <img
                  src={enhanceResult.enhancedUrl}
                  alt="Enhanced portrait preview"
                  className="mx-auto h-44 w-44 rounded-full object-cover border border-[#E5DEC9]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEnhanceResult(null)}
                className="min-h-[40px] rounded-lg border border-[#DCD4BE] bg-white px-4 py-2 text-sm font-medium text-[#1F2421] hover:bg-[#F2EDE2] cursor-pointer"
              >
                Keep Original
              </button>
              <button
                type="button"
                onClick={() => {
                  onSave(enhanceResult.enhancedUrl);
                  onClose();
                }}
                className="min-h-[40px] rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] cursor-pointer"
              >
                {enhanceResult.mode === 'gemini' ? 'Accept Enhanced Photo' : 'Use Demo Preview'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="flex flex-col items-center gap-4">
              {sourceUrl ? (
                <>
                  <div className="relative overflow-hidden rounded-full border-2 border-[#1B4332]/30 bg-[#EAF0EC] shadow-sm">
                    <canvas
                      ref={canvasRef}
                      onPointerDown={(e) => {
                        setDragging(true);
                        dragStartRef.current = {
                          x: e.clientX,
                          y: e.clientY,
                          ox: offset.x,
                          oy: offset.y,
                        };
                      }}
                      onPointerMove={(e) => {
                        if (!dragging || !dragStartRef.current) return;
                        setOffset({
                          x: dragStartRef.current.ox + (e.clientX - dragStartRef.current.x),
                          y: dragStartRef.current.oy + (e.clientY - dragStartRef.current.y),
                        });
                      }}
                      onPointerUp={() => {
                        setDragging(false);
                        dragStartRef.current = null;
                      }}
                      onPointerLeave={() => {
                        setDragging(false);
                        dragStartRef.current = null;
                      }}
                      className={`h-[240px] w-[240px] touch-none ${
                        dragging ? 'cursor-grabbing' : 'cursor-grab'
                      }`}
                    />
                  </div>

                  <div className="w-full max-w-xs space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-[#5E6660]">
                      <label htmlFor="crop-zoom">Crop zoom (drag photo to reposition)</label>
                      <span className="tabular-nums">{cropZoom.toFixed(1)}×</span>
                    </div>
                    <input
                      id="crop-zoom"
                      type="range"
                      min={1}
                      max={2.6}
                      step={0.1}
                      value={cropZoom}
                      onChange={(e) => setCropZoom(Number(e.target.value))}
                      className="w-full accent-[#1B4332]"
                    />
                  </div>
                </>
              ) : (
                <div className="flex h-48 w-48 flex-col items-center justify-center rounded-full border border-dashed border-[#B0A890] bg-[#F2EDE2]/60 p-6 text-center">
                  <Upload className="h-6 w-6 text-[#6B8E78]" />
                  <p className="mt-2 text-xs text-[#5E6660]">No photo selected yet</p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2">
                <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border border-[#DCD4BE] bg-white px-4 py-2 text-sm font-medium text-[#1F2421] hover:bg-[#F2EDE2]">
                  <Upload className="h-4 w-4 text-[#1B4332]" />
                  <span>{sourceUrl ? 'Choose another photo' : 'Upload photo'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>

                {sourceUrl && canUseServerEnhance && (
                  <button
                    type="button"
                    disabled={enhancing}
                    onClick={handleExplicitEnhance}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[#B08D57]/60 bg-[#FAF3E6] px-4 py-2 text-sm font-medium text-[#6B4F24] hover:bg-[#F3E7D0] disabled:opacity-60 cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{enhancing ? 'Preparing preview…' : 'Enhance photo (optional)'}</span>
                  </button>
                )}

                {sourceUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setSourceUrl(undefined);
                      setEnhanceResult(null);
                    }}
                    className="inline-flex min-h-[40px] items-center rounded-lg px-3 py-2 text-sm text-red-700 hover:bg-red-50 cursor-pointer"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#E5DEC9] pt-4">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] rounded-lg border border-[#DCD4BE] bg-white px-4 py-2 text-sm font-medium text-[#3A413C] hover:bg-[#F2EDE2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onSave(sourceUrl ? getCroppedDataUrl() : undefined);
                  onClose();
                }}
                className="min-h-[40px] rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] cursor-pointer"
              >
                Save Photo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
