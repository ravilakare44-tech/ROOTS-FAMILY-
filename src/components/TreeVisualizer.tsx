import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { BotanicalSeatingSvg } from './BotanicalSeatingSvg.tsx';
import type { Person, Relationship, TreeDesignConfig } from '../shared/types.ts';
import { formatLifeSpan, getInitials } from '../utils/dateFormat.ts';
import { computeTreeLayout } from '../utils/treeLayout.ts';

interface TreeVisualizerProps {
  treeName: string;
  people: Person[];
  relationships: Relationship[];
  design: TreeDesignConfig;
  selectedPersonId?: string | null;
  onSelectPerson?: (person: Person) => void;
  minHeightClass?: string;
  showCaption?: boolean;
}

export function TreeVisualizer({
  treeName,
  people,
  relationships,
  design,
  selectedPersonId,
  onSelectPerson,
  minHeightClass = 'h-[520px]',
  showCaption = true,
}: TreeVisualizerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(0.9);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const layout = useMemo(
    () => computeTreeLayout(people, relationships, design),
    [people, relationships, design]
  );

  const fitToScreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const scaleX = (rect.width - 32) / layout.width;
    const scaleY = (rect.height - 32) / layout.height;
    const nextZoom = Math.max(0.32, Math.min(1.15, Math.min(scaleX, scaleY)));
    const scaledW = layout.width * nextZoom;
    const scaledH = layout.height * nextZoom;

    setZoom(Number(nextZoom.toFixed(2)));
    setPan({
      x: Math.round((rect.width - scaledW) / 2),
      y: Math.round(Math.max(12, (rect.height - scaledH) / 2)),
    });
  }, [layout.width, layout.height]);

  useEffect(() => {
    fitToScreen();
  }, [fitToScreen]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    setDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handlePointerUp = () => {
    setDragging(false);
    dragStartRef.current = null;
  };

  const fontSizeClass =
    design.textSize === 'large'
      ? 'text-[15px]'
      : design.textSize === 'small'
        ? 'text-[12px]'
        : 'text-[13.5px]';

  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl border border-[#DCD4BE] bg-[#FAF7F0]">
      {/* Canvas Controls Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-[#E5DEC9] bg-[#F7F3E9] px-3 py-2">
        <div className="text-xs text-[#5E6660] truncate max-w-[260px] sm:max-w-md">
          {showCaption ? (
            <span>
              {treeName} <span aria-hidden="true">·</span>{' '}
              <span className="tabular-nums">{people.length}</span>{' '}
              {people.length === 1 ? 'person' : 'people'}
            </span>
          ) : (
            <span>Drag to pan · Click any card to inspect</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.25, Number((z - 0.12).toFixed(2))))}
            aria-label="Zoom out"
            title="Zoom out"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#DCD4BE] bg-white text-[#1F2421] hover:bg-[#F2EDE2] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1B4332]"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[46px] text-center text-xs font-medium text-[#3A413C] tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.12).toFixed(2))))}
            aria-label="Zoom in"
            title="Zoom in"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#DCD4BE] bg-white text-[#1F2421] hover:bg-[#F2EDE2] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1B4332]"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={fitToScreen}
            aria-label="Fit tree to screen"
            title="Fit to screen"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-[#DCD4BE] bg-white px-2.5 text-xs font-medium text-[#1F2421] hover:bg-[#F2EDE2] cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#1B4332]"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span>Fit</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 20, y: 20 });
            }}
            aria-label="Reset zoom to 100%"
            title="Reset 100%"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#DCD4BE] bg-white text-[#1F2421] hover:bg-[#F2EDE2] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1B4332]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Viewport */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ backgroundColor: design.backgroundColor }}
        className={`relative w-full overflow-hidden select-none touch-none ${minHeightClass} ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {people.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <p
              className="text-lg font-medium"
              style={{ color: design.cardTextColor, fontFamily: `"${design.fontFamily}", serif` }}
            >
              Your tree canvas is ready
            </p>
            <p className="mt-2 max-w-sm text-sm opacity-75" style={{ color: design.cardTextColor }}>
              Add your first family member to begin growing branches and connecting generations.
            </p>
          </div>
        ) : (
          <div
            style={{
              width: layout.width,
              height: layout.height,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              fontFamily: `"${design.fontFamily}", Georgia, serif`,
            }}
            className="relative"
          >
            {/* Archival frame line */}
            <div
              style={{ borderColor: design.lineColor }}
              className="pointer-events-none absolute inset-4 rounded-lg border opacity-25"
            />

            {/* Header inside canvas */}
            <div className="pointer-events-none absolute inset-x-0 top-7 text-center px-8">
              <h3
                style={{ color: design.cardTextColor, fontFamily: `"${design.fontFamily}", serif` }}
                className="text-2xl font-semibold tracking-tight truncate"
              >
                {treeName}
              </h3>
              <p
                style={{ color: design.accentColor }}
                className="mt-0.5 text-xs font-sans font-medium tracking-wide"
              >
                {layout.isUpwardTree
                  ? 'Growing upward from shared roots'
                  : `${people.length} family ${people.length === 1 ? 'member' : 'members'}`}
              </p>
            </div>

            {/* Connectors & Botanical Trunk (for Green Tree) */}
            <svg
              width={layout.width}
              height={layout.height}
              className="pointer-events-none absolute inset-0"
            >
              {layout.isUpwardTree && (
                <g opacity={0.82}>
                  {/* Botanical trunk and grounding roots */}
                  <path
                    d={`M ${layout.width / 2} ${layout.height - 32} L ${layout.width / 2} ${
                      layout.height - 108
                    }`}
                    stroke="#3C5A45"
                    strokeWidth={10}
                    strokeLinecap="round"
                  />
                  {[-110, -68, -28, 28, 68, 110].map((dx, idx) => (
                    <path
                      key={idx}
                      d={`M ${layout.width / 2} ${layout.height - 38} Q ${
                        layout.width / 2 + dx * 0.45
                      } ${layout.height - 18} ${layout.width / 2 + dx} ${layout.height - 10}`}
                      fill="none"
                      stroke="#4E6F57"
                      strokeWidth={3.2}
                      strokeLinecap="round"
                    />
                  ))}
                  {/* Gentle canopy arc behind top branches */}
                  <ellipse
                    cx={layout.width / 2}
                    cy={Math.max(180, layout.height * 0.42)}
                    rx={Math.max(220, layout.width * 0.36)}
                    ry={Math.max(120, layout.height * 0.28)}
                    fill={design.lineColor}
                    opacity={0.07}
                  />
                </g>
              )}

              {layout.edges.map((edge) => {
                if (edge.type === 'spouse_partner') {
                  return (
                    <g key={edge.id}>
                      <line
                        x1={edge.x1}
                        y1={edge.y1}
                        x2={edge.x2}
                        y2={edge.y2}
                        stroke={design.lineColor}
                        strokeWidth={2}
                      />
                      <circle
                        cx={(edge.x1 + edge.x2) / 2}
                        cy={(edge.y1 + edge.y2) / 2}
                        r={3.5}
                        fill={design.accentColor}
                      />
                    </g>
                  );
                }

                if (edge.type === 'parent_child') {
                  const midY = (edge.y1 + edge.y2) / 2;
                  return (
                    <path
                      key={edge.id}
                      d={`M ${edge.x1} ${edge.y1} C ${edge.x1} ${midY}, ${edge.x2} ${midY}, ${edge.x2} ${edge.y2}`}
                      fill="none"
                      stroke={design.lineColor}
                      strokeWidth={layout.isUpwardTree ? 2.2 : 1.75}
                    />
                  );
                }

                return (
                  <line
                    key={edge.id}
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke={design.lineColor}
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                  />
                );
              })}

              {design.seatingModel && design.seatingModel !== 'none' && (
                <BotanicalSeatingSvg
                  model={design.seatingModel}
                  x={layout.width / 2}
                  y={layout.height - 26}
                  accentColor={design.accentColor}
                  lineColor={design.lineColor}
                />
              )}
            </svg>

            {/* Person Nodes */}
            {layout.nodes.map((node) => {
              const { person, x, y, width, height } = node;
              const isSelected = selectedPersonId === person.id;
              const lifeSpan = formatLifeSpan(person);

              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => onSelectPerson?.(person)}
                  style={{
                    left: x,
                    top: y,
                    width,
                    height,
                    backgroundColor: design.cardColor,
                    color: design.cardTextColor,
                    borderColor: isSelected ? design.accentColor : design.lineColor,
                    boxShadow: isSelected
                      ? `0 0 0 2px ${design.accentColor}`
                      : '0 2px 8px rgba(27, 67, 50, 0.06)',
                  }}
                  aria-label={`${person.fullName}${lifeSpan ? `, ${lifeSpan}` : ''}`}
                  className={`absolute rounded-xl border text-left transition-transform duration-150 hover:-translate-y-0.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332] ${
                    design.style === 'photo_cards'
                      ? 'flex flex-col items-center justify-center p-3 text-center'
                      : 'flex items-center gap-3 px-3.5 py-2.5'
                  }`}
                >
                  {design.style === 'photo_cards' ? (
                    <>
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-[#DCD4BE] bg-[#EAF0EC] flex items-center justify-center">
                        {person.photoUrl ? (
                          <img
                            src={person.photoUrl}
                            alt={person.fullName}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span
                            style={{ color: design.accentColor }}
                            className="text-xl font-semibold"
                          >
                            {getInitials(person.fullName)}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 w-full">
                        <p className={`font-semibold leading-tight truncate ${fontSizeClass}`}>
                          {person.fullName}
                        </p>
                        {person.alternateName && (
                          <p
                            style={{ color: design.accentColor }}
                            className="mt-0.5 text-[11px] font-sans truncate"
                          >
                            {person.alternateName}
                          </p>
                        )}
                        {lifeSpan && (
                          <p className="mt-1 text-[11px] font-sans opacity-75 truncate tabular-nums">
                            {lifeSpan}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[#DCD4BE] bg-[#EAF0EC] flex items-center justify-center">
                        {person.photoUrl ? (
                          <img
                            src={person.photoUrl}
                            alt={person.fullName}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span
                            style={{ color: design.accentColor }}
                            className="text-sm font-semibold"
                          >
                            {getInitials(person.fullName)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold leading-snug truncate ${fontSizeClass}`}>
                          {person.fullName}
                        </p>
                        {person.alternateName && (
                          <p
                            style={{ color: design.accentColor }}
                            className="text-[11px] font-sans truncate"
                          >
                            {person.alternateName}
                          </p>
                        )}
                        {lifeSpan && (
                          <p className="mt-0.5 text-[11px] font-sans opacity-75 truncate tabular-nums">
                            {lifeSpan}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
