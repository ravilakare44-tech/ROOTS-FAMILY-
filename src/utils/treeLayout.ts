import type { Person, Relationship, TreeDesignConfig } from '../shared/types.ts';

export interface PositionedNode {
  person: Person;
  x: number;
  y: number;
  width: number;
  height: number;
  generation: number;
}

export interface ConnectorEdge {
  id: string;
  type: Relationship['type'];
  label?: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  fromPersonId: string;
  toPersonId: string;
}

export interface TreeLayoutResult {
  nodes: PositionedNode[];
  edges: ConnectorEdge[];
  width: number;
  height: number;
  maxGeneration: number;
  isUpwardTree: boolean;
}

/**
 * Computes a clean, readable generational tree layout for all 5 visual styles.
 * Handles multiple spouses, up to 10 children per parent, and unlinked people cleanly.
 */
export function computeTreeLayout(
  people: Person[],
  relationships: Relationship[],
  design: TreeDesignConfig
): TreeLayoutResult {
  if (people.length === 0) {
    return {
      nodes: [],
      edges: [],
      width: 800,
      height: 500,
      maxGeneration: 0,
      isUpwardTree: design.style === 'green_tree',
    };
  }

  const isUpwardTree = design.style === 'green_tree';
  const isPortraitStyle =
    design.style === 'portrait' ||
    (design.style !== 'landscape' && design.orientation === 'portrait');

  const cardWidth =
    design.style === 'photo_cards'
      ? 188
      : design.textSize === 'large'
        ? 216
        : design.textSize === 'small'
          ? 176
          : 196;

  const cardHeight =
    design.style === 'photo_cards'
      ? 216
      : design.textSize === 'large'
        ? 106
        : design.textSize === 'small'
          ? 86
          : 96;

  const hasSeating = Boolean(design.seatingModel && design.seatingModel !== 'none');
  const hGap = isPortraitStyle ? 28 : 40;
  const vGap = isPortraitStyle ? 76 : 84;
  const paddingX = 80;
  const paddingTop = 110;
  const paddingBottom = isUpwardTree ? (hasSeating ? 185 : 150) : hasSeating ? 160 : 80;

  const personById = new Map(people.map((p) => [p.id, p]));
  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  const spousesOf = new Map<string, string[]>();

  for (const p of people) {
    parentsOf.set(p.id, []);
    childrenOf.set(p.id, []);
    spousesOf.set(p.id, []);
  }

  for (const rel of relationships) {
    if (!personById.has(rel.fromPersonId) || !personById.has(rel.toPersonId)) continue;
    if (rel.type === 'parent_child') {
      parentsOf.get(rel.toPersonId)!.push(rel.fromPersonId);
      childrenOf.get(rel.fromPersonId)!.push(rel.toPersonId);
    } else if (rel.type === 'spouse_partner') {
      spousesOf.get(rel.fromPersonId)!.push(rel.toPersonId);
      spousesOf.get(rel.toPersonId)!.push(rel.fromPersonId);
    }
  }

  // Assign generational depth via relaxation so parents sit strictly above children
  // and spouses share the same generation level when possible.
  const gen = new Map<string, number>();
  for (const p of people) {
    gen.set(p.id, 0);
  }

  for (let pass = 0; pass < people.length + 2; pass++) {
    let changed = false;
    for (const rel of relationships) {
      if (!personById.has(rel.fromPersonId) || !personById.has(rel.toPersonId)) continue;
      if (rel.type === 'parent_child') {
        const parentGen = gen.get(rel.fromPersonId) ?? 0;
        const childGen = gen.get(rel.toPersonId) ?? 0;
        if (childGen <= parentGen) {
          gen.set(rel.toPersonId, parentGen + 1);
          changed = true;
        }
      }
    }
    // Align spouses without parents to their partner's generation
    for (const rel of relationships) {
      if (!personById.has(rel.fromPersonId) || !personById.has(rel.toPersonId)) continue;
      if (rel.type === 'spouse_partner') {
        const g1 = gen.get(rel.fromPersonId) ?? 0;
        const g2 = gen.get(rel.toPersonId) ?? 0;
        if (g1 !== g2) {
          const maxG = Math.max(g1, g2);
          if ((parentsOf.get(rel.fromPersonId)?.length ?? 0) === 0 && g1 < maxG) {
            gen.set(rel.fromPersonId, maxG);
            changed = true;
          }
          if ((parentsOf.get(rel.toPersonId)?.length ?? 0) === 0 && g2 < maxG) {
            gen.set(rel.toPersonId, maxG);
            changed = true;
          }
        }
      }
    }
    if (!changed) break;
  }

  // Group by generation
  const rows = new Map<number, Person[]>();
  let maxGeneration = 0;
  for (const p of people) {
    const g = gen.get(p.id) ?? 0;
    if (g > maxGeneration) maxGeneration = g;
    const list = rows.get(g) ?? [];
    list.push(p);
    rows.set(g, list);
  }

  // Order within each generation so spouses sit adjacent and children align near parents
  const xIndexScore = new Map<string, number>();
  const orderedRows = new Map<number, Person[]>();

  for (let g = 0; g <= maxGeneration; g++) {
    const rowPeople = rows.get(g) ?? [];
    // Sort primarily by average parent xIndexScore, then cluster spouses together
    const sortedBase = [...rowPeople].sort((a, b) => {
      const pa = parentsOf.get(a.id) ?? [];
      const pb = parentsOf.get(b.id) ?? [];
      const scoreA =
        pa.length > 0
          ? pa.reduce((acc, pid) => acc + (xIndexScore.get(pid) ?? 0), 0) / pa.length
          : 9999;
      const scoreB =
        pb.length > 0
          ? pb.reduce((acc, pid) => acc + (xIndexScore.get(pid) ?? 0), 0) / pb.length
          : 9999;
      if (scoreA !== scoreB) return scoreA - scoreB;
      return a.createdAt.localeCompare(b.createdAt);
    });

    const placed = new Set<string>();
    const clustered: Person[] = [];
    for (const person of sortedBase) {
      if (placed.has(person.id)) continue;
      placed.add(person.id);
      clustered.push(person);
      for (const spouseId of spousesOf.get(person.id) ?? []) {
        if (!placed.has(spouseId) && (gen.get(spouseId) ?? 0) === g) {
          const spouse = personById.get(spouseId);
          if (spouse) {
            placed.add(spouseId);
            clustered.push(spouse);
          }
        }
      }
    }

    clustered.forEach((p, idx) => xIndexScore.set(p.id, idx));
    orderedRows.set(g, clustered);
  }

  // Compute row widths to center every generation horizontally
  let maxRowWidth = 0;
  const maxPerRowPortrait = isPortraitStyle ? 3 : 99;

  // In portrait style, wrap very wide rows gently into sub-rows if needed
  interface VisualRow {
    generation: number;
    people: Person[];
  }
  const visualRows: VisualRow[] = [];

  const genOrder = isUpwardTree
    ? Array.from({ length: maxGeneration + 1 }, (_, i) => maxGeneration - i)
    : Array.from({ length: maxGeneration + 1 }, (_, i) => i);

  for (const g of genOrder) {
    const rowPeople = orderedRows.get(g) ?? [];
    if (rowPeople.length === 0) continue;
    if (isPortraitStyle && rowPeople.length > maxPerRowPortrait) {
      for (let i = 0; i < rowPeople.length; i += maxPerRowPortrait) {
        visualRows.push({
          generation: g,
          people: rowPeople.slice(i, i + maxPerRowPortrait),
        });
      }
    } else {
      visualRows.push({ generation: g, people: rowPeople });
    }
  }

  for (const vr of visualRows) {
    const w = vr.people.length * cardWidth + Math.max(0, vr.people.length - 1) * hGap;
    if (w > maxRowWidth) maxRowWidth = w;
  }

  const canvasWidth = Math.max(760, maxRowWidth + paddingX * 2);
  const canvasHeight =
    paddingTop +
    visualRows.length * cardHeight +
    Math.max(0, visualRows.length - 1) * vGap +
    paddingBottom;

  const nodes: PositionedNode[] = [];
  const nodeById = new Map<string, PositionedNode>();

  visualRows.forEach((vr, rowIdx) => {
    const rowW = vr.people.length * cardWidth + Math.max(0, vr.people.length - 1) * hGap;
    const startX = (canvasWidth - rowW) / 2;
    const y = paddingTop + rowIdx * (cardHeight + vGap);

    vr.people.forEach((person, colIdx) => {
      const x = startX + colIdx * (cardWidth + hGap);
      const node: PositionedNode = {
        person,
        x,
        y,
        width: cardWidth,
        height: cardHeight,
        generation: vr.generation,
      };
      nodes.push(node);
      nodeById.set(person.id, node);
    });
  });

  const edges: ConnectorEdge[] = [];
  for (const rel of relationships) {
    const fromNode = nodeById.get(rel.fromPersonId);
    const toNode = nodeById.get(rel.toPersonId);
    if (!fromNode || !toNode) continue;

    if (rel.type === 'spouse_partner') {
      const left = fromNode.x <= toNode.x ? fromNode : toNode;
      const right = fromNode.x <= toNode.x ? toNode : fromNode;
      edges.push({
        id: rel.id,
        type: rel.type,
        label: rel.label,
        fromPersonId: rel.fromPersonId,
        toPersonId: rel.toPersonId,
        x1: left.x + left.width,
        y1: left.y + left.height / 2,
        x2: right.x,
        y2: right.y + right.height / 2,
      });
    } else if (rel.type === 'parent_child') {
      if (isUpwardTree) {
        // Parent is below child in upward Green Tree
        edges.push({
          id: rel.id,
          type: rel.type,
          label: rel.label,
          fromPersonId: rel.fromPersonId,
          toPersonId: rel.toPersonId,
          x1: fromNode.x + fromNode.width / 2,
          y1: fromNode.y,
          x2: toNode.x + toNode.width / 2,
          y2: toNode.y + toNode.height,
        });
      } else {
        edges.push({
          id: rel.id,
          type: rel.type,
          label: rel.label,
          fromPersonId: rel.fromPersonId,
          toPersonId: rel.toPersonId,
          x1: fromNode.x + fromNode.width / 2,
          y1: fromNode.y + fromNode.height,
          x2: toNode.x + toNode.width / 2,
          y2: toNode.y,
        });
      }
    } else {
      edges.push({
        id: rel.id,
        type: rel.type,
        label: rel.label,
        fromPersonId: rel.fromPersonId,
        toPersonId: rel.toPersonId,
        x1: fromNode.x + fromNode.width / 2,
        y1: fromNode.y + fromNode.height / 2,
        x2: toNode.x + toNode.width / 2,
        y2: toNode.y + toNode.height / 2,
      });
    }
  }

  return {
    nodes,
    edges,
    width: canvasWidth,
    height: canvasHeight,
    maxGeneration,
    isUpwardTree,
  };
}
