import { drawBotanicalSeatingOnCanvas } from '../components/BotanicalSeatingSvg.tsx';
import type { Person, Relationship, TreeDesignConfig } from '../shared/types.ts';
import { formatLifeSpan, getInitials } from './dateFormat.ts';
import { computeTreeLayout } from './treeLayout.ts';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function exportTreeToPng(options: {
  treeName: string;
  people: Person[];
  relationships: Relationship[];
  design: TreeDesignConfig;
}): Promise<void> {
  const { treeName, people, relationships, design } = options;
  const layout = computeTreeLayout(people, relationships, design);
  const scale = 2;

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(layout.width * scale);
  canvas.height = Math.ceil(layout.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not initialize canvas for PNG export.');

  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = design.backgroundColor;
  ctx.fillRect(0, 0, layout.width, layout.height);

  // Outer botanical frame
  ctx.strokeStyle = design.lineColor;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(18, 18, layout.width - 36, layout.height - 36);
  ctx.globalAlpha = 1;

  // Title header
  ctx.fillStyle = design.cardTextColor;
  ctx.textAlign = 'center';
  ctx.font = `600 26px "${design.fontFamily}", Georgia, serif`;
  ctx.fillText(treeName, layout.width / 2, 58, layout.width - 100);

  ctx.fillStyle = design.accentColor;
  ctx.font = `500 12px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText(
    `${people.length} ${people.length === 1 ? 'person' : 'people'} · Roots & Branches`,
    layout.width / 2,
    80
  );

  // If Green Tree style, draw warm trunk and roots at bottom
  if (layout.isUpwardTree) {
    const cx = layout.width / 2;
    const baseY = layout.height - 34;
    ctx.strokeStyle = '#4B634E';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, baseY - 12);
    ctx.lineTo(cx, baseY - 90);
    ctx.stroke();

    // Roots
    ctx.lineWidth = 3;
    const rootOffsets = [-90, -48, -18, 22, 54, 92];
    for (const dx of rootOffsets) {
      ctx.beginPath();
      ctx.moveTo(cx, baseY - 22);
      ctx.quadraticCurveTo(cx + dx * 0.5, baseY - 4, cx + dx, baseY + 6);
      ctx.stroke();
    }
  }

  // Decorative botanical seating illustration
  if (design.seatingModel && design.seatingModel !== 'none') {
    drawBotanicalSeatingOnCanvas(
      ctx,
      design.seatingModel,
      layout.width / 2,
      layout.height - 26,
      design.accentColor,
      design.lineColor
    );
  }

  // Draw connectors
  for (const edge of layout.edges) {
    ctx.save();
    ctx.strokeStyle = design.lineColor;
    ctx.lineWidth = edge.type === 'spouse_partner' ? 2 : 1.75;
    if (edge.type === 'other') {
      ctx.setLineDash([5, 5]);
    }
    ctx.beginPath();
    if (edge.type === 'spouse_partner') {
      ctx.moveTo(edge.x1, edge.y1);
      ctx.lineTo(edge.x2, edge.y2);
    } else if (edge.type === 'parent_child') {
      const midY = (edge.y1 + edge.y2) / 2;
      ctx.moveTo(edge.x1, edge.y1);
      ctx.bezierCurveTo(edge.x1, midY, edge.x2, midY, edge.x2, edge.y2);
    } else {
      ctx.moveTo(edge.x1, edge.y1);
      ctx.lineTo(edge.x2, edge.y2);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Preload photos
  const photoMap = new Map<string, HTMLImageElement | null>();
  await Promise.all(
    layout.nodes.map(async (n) => {
      if (n.person.photoUrl) {
        photoMap.set(n.person.id, await loadImage(n.person.photoUrl));
      }
    })
  );

  const nameFontSize =
    design.textSize === 'large' ? 15 : design.textSize === 'small' ? 12 : 13.5;

  // Draw cards
  for (const node of layout.nodes) {
    const { person, x, y, width, height } = node;
    const img = photoMap.get(person.id) ?? null;

    ctx.save();
    drawRoundedRect(ctx, x, y, width, height, 12);
    ctx.fillStyle = design.cardColor;
    ctx.fill();
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = design.lineColor;
    ctx.stroke();
    ctx.restore();

    const lifeSpan = formatLifeSpan(person);

    if (design.style === 'photo_cards') {
      const imgSize = 96;
      const cx = x + width / 2;
      const cy = y + 20 + imgSize / 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, imgSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      if (img) {
        ctx.drawImage(img, cx - imgSize / 2, cy - imgSize / 2, imgSize, imgSize);
      } else {
        ctx.fillStyle = '#EAF0EC';
        ctx.fillRect(cx - imgSize / 2, cy - imgSize / 2, imgSize, imgSize);
        ctx.fillStyle = design.accentColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `600 22px "${design.fontFamily}", serif`;
        ctx.fillText(getInitials(person.fullName), cx, cy);
      }
      ctx.restore();

      ctx.fillStyle = design.cardTextColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.font = `600 ${nameFontSize}px "${design.fontFamily}", Georgia, serif`;
      ctx.fillText(person.fullName, cx, y + 144, width - 20);

      if (person.alternateName) {
        ctx.fillStyle = design.accentColor;
        ctx.font = `400 11px "Plus Jakarta Sans", sans-serif`;
        ctx.fillText(person.alternateName, cx, y + 162, width - 20);
      }

      if (lifeSpan) {
        ctx.fillStyle = design.cardTextColor;
        ctx.globalAlpha = 0.72;
        ctx.font = `400 11px "Plus Jakarta Sans", sans-serif`;
        ctx.fillText(lifeSpan, cx, y + 184, width - 20);
        ctx.globalAlpha = 1;
      }
    } else {
      const avatarSize = 44;
      const ax = x + 14;
      const ay = y + height / 2 - avatarSize / 2;
      const acx = ax + avatarSize / 2;
      const acy = ay + avatarSize / 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(acx, acy, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      if (img) {
        ctx.drawImage(img, ax, ay, avatarSize, avatarSize);
      } else {
        ctx.fillStyle = '#EAF0EC';
        ctx.fillRect(ax, ay, avatarSize, avatarSize);
        ctx.fillStyle = design.accentColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `600 14px "${design.fontFamily}", serif`;
        ctx.fillText(getInitials(person.fullName), acx, acy);
      }
      ctx.restore();

      const textX = ax + avatarSize + 12;
      const maxTextW = width - (avatarSize + 36);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = design.cardTextColor;
      ctx.font = `600 ${nameFontSize}px "${design.fontFamily}", Georgia, serif`;
      ctx.fillText(person.fullName, textX, y + height / 2 - 6, maxTextW);

      if (person.alternateName) {
        ctx.fillStyle = design.accentColor;
        ctx.font = `400 10.5px "Plus Jakarta Sans", sans-serif`;
        ctx.fillText(person.alternateName, textX, y + height / 2 + 10, maxTextW);
      }

      if (lifeSpan) {
        ctx.fillStyle = design.cardTextColor;
        ctx.globalAlpha = 0.72;
        ctx.font = `400 10.5px "Plus Jakarta Sans", sans-serif`;
        ctx.fillText(
          lifeSpan,
          textX,
          y + height / 2 + (person.alternateName ? 25 : 14),
          maxTextW
        );
        ctx.globalAlpha = 1;
      }
    }
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Unable to generate PNG image.');

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const slug =
    treeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'family-tree';
  link.href = url;
  link.download = `${slug}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
