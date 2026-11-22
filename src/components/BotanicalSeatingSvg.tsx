import type { SeatingModelId } from '../shared/types.ts';

interface BotanicalSeatingSvgProps {
  model: SeatingModelId;
  x: number;
  y: number;
  accentColor: string;
  lineColor: string;
}

/**
 * Renders 6 distinct botanical family-gathering seating illustrations (3 indoor, 3 outdoor)
 * positioned inside the family tree SVG layer.
 * Reference coordinate box: width 320, height 110, centered horizontally around x, resting at y.
 */
export function BotanicalSeatingSvg({
  model,
  x,
  y,
  accentColor,
  lineColor,
}: BotanicalSeatingSvgProps) {
  if (!model || model === 'none') return null;

  const left = x - 160;
  const top = y - 104;

  return (
    <g transform={`translate(${left}, ${top})`} aria-hidden="true">
      {/* Shared soft botanical ground shadow & trailing sprigs */}
      <ellipse cx="160" cy="98" rx="136" ry="8" fill={lineColor} opacity="0.16" />

      {/* Left & Right botanical leaves framing all 6 models */}
      <g stroke={lineColor} strokeWidth="1.4" fill="none" opacity="0.85">
        <path d="M 28 92 Q 14 70 22 46" />
        <ellipse cx="17" cy="68" rx="6" ry="3" transform="rotate(-35 17 68)" fill={lineColor} opacity="0.35" />
        <ellipse cx="26" cy="57" rx="6" ry="3" transform="rotate(25 26 57)" fill={accentColor} opacity="0.35" />
        <ellipse cx="20" cy="45" rx="5" ry="2.6" transform="rotate(-15 20 45)" fill={lineColor} opacity="0.45" />

        <path d="M 292 92 Q 306 70 298 46" />
        <ellipse cx="303" cy="68" rx="6" ry="3" transform="rotate(35 303 68)" fill={lineColor} opacity="0.35" />
        <ellipse cx="294" cy="57" rx="6" ry="3" transform="rotate(-25 294 57)" fill={accentColor} opacity="0.35" />
        <ellipse cx="300" cy="45" rx="5" ry="2.6" transform="rotate(15 300 45)" fill={lineColor} opacity="0.45" />
      </g>

      {/* MODEL 1 (Indoor): Heirloom Linen Sofa */}
      {model === 'indoor_heirloom_sofa' && (
        <g>
          {/* Woven rug underneath */}
          <rect x="38" y="88" width="244" height="10" rx="5" fill="#E5DEC9" stroke="#B08D57" strokeWidth="1" />
          {/* Teak legs */}
          <rect x="56" y="78" width="8" height="14" rx="2" fill="#7B5536" />
          <rect x="256" y="78" width="8" height="14" rx="2" fill="#7B5536" />
          {/* Backrest */}
          <rect x="50" y="24" width="220" height="40" rx="14" fill="#F4EFE3" stroke={lineColor} strokeWidth="1.6" />
          {/* Three plush seat cushions */}
          <rect x="58" y="52" width="66" height="22" rx="7" fill="#FAF7F0" stroke={lineColor} strokeWidth="1.2" />
          <rect x="127" y="52" width="66" height="22" rx="7" fill="#FAF7F0" stroke={lineColor} strokeWidth="1.2" />
          <rect x="196" y="52" width="66" height="22" rx="7" fill="#FAF7F0" stroke={lineColor} strokeWidth="1.2" />
          {/* Rolled armrests */}
          <rect x="40" y="38" width="20" height="40" rx="9" fill="#EAE2CF" stroke={lineColor} strokeWidth="1.5" />
          <rect x="260" y="38" width="20" height="40" rx="9" fill="#EAE2CF" stroke={lineColor} strokeWidth="1.5" />
          {/* Wooden plinth base */}
          <rect x="46" y="73" width="228" height="7" rx="3" fill="#8C623E" />
          {/* Accent throw cushions */}
          <rect x="64" y="33" width="24" height="20" rx="5" transform="rotate(-8 76 43)" fill="#A3B8A8" stroke={accentColor} strokeWidth="1.1" />
          <rect x="232" y="33" width="24" height="20" rx="5" transform="rotate(8 244 43)" fill="#D9C39E" stroke="#9C7A45" strokeWidth="1.1" />
          {/* Cozy woven throw draped on center */}
          <path d="M 142 52 L 178 52 L 182 80 L 138 80 Z" fill={accentColor} opacity="0.22" />
          <text x="160" y="109" textAnchor="middle" fontSize="9.5" fill={accentColor} opacity="0.78" fontFamily="Plus Jakarta Sans, sans-serif">
            Indoor · Heirloom Linen Sofa
          </text>
        </g>
      )}

      {/* MODEL 2 (Indoor): Carved Teak Diwan */}
      {model === 'indoor_teak_divan' && (
        <g>
          {/* Traditional dhurrie mat */}
          <rect x="34" y="88" width="252" height="9" rx="4" fill="#E3D7C3" stroke="#9C7A45" strokeWidth="1" />
          {/* Carved legs */}
          <path d="M 54 78 L 50 92 L 60 92 L 63 78 Z" fill="#6D472B" />
          <path d="M 266 78 L 270 92 L 260 92 L 257 78 Z" fill="#6D472B" />
          {/* Carved lattice wooden back rail */}
          <rect x="48" y="22" width="224" height="34" rx="8" fill="#8C5E3C" stroke="#5E3D24" strokeWidth="1.5" />
          <path d="M 64 28 L 64 50 M 96 28 L 96 50 M 128 28 L 128 50 M 160 28 L 160 50 M 192 28 L 192 50 M 224 28 L 224 50 M 256 28 L 256 50" stroke="#D8B88A" strokeWidth="1.5" opacity="0.65" />
          {/* Mattress & botanical runner */}
          <rect x="46" y="53" width="228" height="19" rx="6" fill="#F5EFE2" stroke="#B08D57" strokeWidth="1.4" />
          <rect x="116" y="53" width="88" height="19" fill={accentColor} opacity="0.2" />
          {/* Side round bolsters (masland) */}
          <ellipse cx="64" cy="48" rx="14" ry="11" fill="#C9A96E" stroke="#7C5D2B" strokeWidth="1.3" />
          <ellipse cx="256" cy="48" rx="14" ry="11" fill="#C9A96E" stroke="#7C5D2B" strokeWidth="1.3" />
          {/* Center square cushion */}
          <rect x="145" y="34" width="30" height="22" rx="4" fill="#EAF0EC" stroke={accentColor} strokeWidth="1.2" />
          {/* Base frame */}
          <rect x="44" y="71" width="232" height="8" rx="3" fill="#6D472B" />
          <text x="160" y="109" textAnchor="middle" fontSize="9.5" fill={accentColor} opacity="0.78" fontFamily="Plus Jakarta Sans, sans-serif">
            Indoor · Carved Teak Diwan
          </text>
        </g>
      )}

      {/* MODEL 3 (Indoor): Sunlit Window Settee */}
      {model === 'indoor_window_settee' && (
        <g>
          {/* Arched sunlit window frame behind settee */}
          <path d="M 88 64 L 88 22 A 72 22 0 0 1 232 22 L 232 64" fill="#FAF7F0" stroke="#B08D57" strokeWidth="1.3" opacity="0.75" />
          <line x1="160" y1="2" x2="160" y2="54" stroke="#B08D57" strokeWidth="1" opacity="0.5" />
          {/* Brass legs */}
          <line x1="66" y1="74" x2="60" y2="92" stroke="#B08D57" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="254" y1="74" x2="260" y2="92" stroke="#B08D57" strokeWidth="3.2" strokeLinecap="round" />
          {/* Curved sage velvet settee back */}
          <path d="M 52 58 Q 52 24 100 24 L 220 24 Q 268 24 268 58 Z" fill="#6B8E78" stroke={accentColor} strokeWidth="1.5" />
          {/* Tufting buttons */}
          <circle cx="105" cy="40" r="2" fill="#FAF7F0" opacity="0.8" />
          <circle cx="160" cy="38" r="2" fill="#FAF7F0" opacity="0.8" />
          <circle cx="215" cy="40" r="2" fill="#FAF7F0" opacity="0.8" />
          {/* Curved plush seat */}
          <rect x="48" y="54" width="224" height="20" rx="10" fill="#88A894" stroke={accentColor} strokeWidth="1.4" />
          {/* Cream pillows */}
          <rect x="68" y="37" width="24" height="19" rx="5" fill="#FAF7F0" stroke={lineColor} strokeWidth="1.1" />
          <rect x="228" y="37" width="24" height="19" rx="5" fill="#FAF7F0" stroke={lineColor} strokeWidth="1.1" />
          {/* Brass trim bar */}
          <rect x="54" y="72" width="212" height="4" rx="2" fill="#C9A96E" />
          <text x="160" y="109" textAnchor="middle" fontSize="9.5" fill={accentColor} opacity="0.78" fontFamily="Plus Jakarta Sans, sans-serif">
            Indoor · Sunlit Window Settee
          </text>
        </g>
      )}

      {/* MODEL 4 (Outdoor): Garden Courtyard Bench */}
      {model === 'outdoor_courtyard_bench' && (
        <g>
          {/* Stepping stones */}
          <ellipse cx="110" cy="94" rx="26" ry="5" fill="#D9D2C1" />
          <ellipse cx="205" cy="95" rx="30" ry="5" fill="#D9D2C1" />
          {/* Wrought iron curved legs & armrests */}
          <path d="M 52 46 Q 42 46 42 66 L 44 91 M 268 46 Q 278 46 278 66 L 276 91" fill="none" stroke="#2D3A32" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="68" y1="74" x2="68" y2="91" stroke="#2D3A32" strokeWidth="2.8" />
          <line x1="252" y1="74" x2="252" y2="91" stroke="#2D3A32" strokeWidth="2.8" />
          {/* Teak backrest slats */}
          <rect x="54" y="25" width="212" height="8" rx="3" fill="#9A6E47" stroke="#6D4B2D" strokeWidth="1.1" />
          <rect x="54" y="36" width="212" height="8" rx="3" fill="#A97B52" stroke="#6D4B2D" strokeWidth="1.1" />
          <rect x="54" y="47" width="212" height="8" rx="3" fill="#9A6E47" stroke="#6D4B2D" strokeWidth="1.1" />
          {/* Teak seat */}
          <rect x="46" y="61" width="228" height="12" rx="4" fill="#B28459" stroke="#6D4B2D" strokeWidth="1.3" />
          {/* Trailing jasmine/olive blossoms on top corner */}
          <path d="M 56 26 Q 90 14 128 24" fill="none" stroke={accentColor} strokeWidth="1.6" />
          <circle cx="72" cy="20" r="3" fill="#FAF7F0" stroke="#B08D57" strokeWidth="0.9" />
          <circle cx="96" cy="18" r="3" fill="#FAF7F0" stroke="#B08D57" strokeWidth="0.9" />
          <circle cx="118" cy="22" r="2.8" fill="#FAF7F0" stroke="#B08D57" strokeWidth="0.9" />
          <text x="160" y="109" textAnchor="middle" fontSize="9.5" fill={accentColor} opacity="0.78" fontFamily="Plus Jakarta Sans, sans-serif">
            Outdoor · Garden Courtyard Bench
          </text>
        </g>
      )}

      {/* MODEL 5 (Outdoor): Veranda Jhoola Swing */}
      {model === 'outdoor_porch_swing' && (
        <g>
          {/* Veranda timber beam & suspension chains */}
          <rect x="46" y="6" width="228" height="7" rx="3" fill="#6D4B2D" />
          <line x1="72" y1="13" x2="64" y2="62" stroke="#B08D57" strokeWidth="2.2" strokeDasharray="4 2" />
          <line x1="248" y1="13" x2="256" y2="62" stroke="#B08D57" strokeWidth="2.2" strokeDasharray="4 2" />
          {/* Hanging floral garlands */}
          <circle cx="69" cy="26" r="3.2" fill="#D99B4E" />
          <circle cx="67" cy="38" r="3.2" fill="#E6B86A" />
          <circle cx="251" cy="26" r="3.2" fill="#D99B4E" />
          <circle cx="253" cy="38" r="3.2" fill="#E6B86A" />
          {/* Carved swing backrest */}
          <rect x="66" y="28" width="188" height="28" rx="7" fill="#8C5E3C" stroke="#5E3D24" strokeWidth="1.4" />
          {/* Plush swing cushion */}
          <rect x="60" y="54" width="200" height="14" rx="5" fill="#F2EDE2" stroke={lineColor} strokeWidth="1.2" />
          {/* Suspended timber seat plank */}
          <rect x="54" y="66" width="212" height="9" rx="3" fill="#6D4B2D" />
          {/* Side pillows */}
          <rect x="74" y="40" width="22" height="16" rx="4" fill="#A3B8A8" stroke={accentColor} strokeWidth="1" />
          <rect x="224" y="40" width="22" height="16" rx="4" fill="#A3B8A8" stroke={accentColor} strokeWidth="1" />
          <text x="160" y="109" textAnchor="middle" fontSize="9.5" fill={accentColor} opacity="0.78" fontFamily="Plus Jakarta Sans, sans-serif">
            Outdoor · Veranda Jhoola Swing
          </text>
        </g>
      )}

      {/* MODEL 6 (Outdoor): Banyan Stone Seat */}
      {model === 'outdoor_banyan_stone' && (
        <g>
          {/* Mossy garden turf & banyan root tendrils */}
          <path d="M 38 92 Q 160 80 282 92" fill="none" stroke={accentColor} strokeWidth="2" opacity="0.45" />
          <path d="M 52 20 Q 44 52 54 88" fill="none" stroke="#6E5A46" strokeWidth="2.5" opacity="0.6" />
          <path d="M 268 20 Q 276 52 266 88" fill="none" stroke="#6E5A46" strokeWidth="2.5" opacity="0.6" />
          {/* Carved sandstone pedestals */}
          <path d="M 68 68 L 62 90 L 88 90 L 84 68 Z" fill="#C8BFA8" stroke="#8C826B" strokeWidth="1.3" />
          <path d="M 236 68 L 232 90 L 258 90 L 252 68 Z" fill="#C8BFA8" stroke="#8C826B" strokeWidth="1.3" />
          {/* Curved carved sandstone bench top */}
          <path d="M 46 56 Q 160 48 274 56 L 270 69 Q 160 62 50 69 Z" fill="#E3DAC6" stroke="#8C826B" strokeWidth="1.5" />
          {/* Soft outdoor linen seat pad */}
          <path d="M 68 53 Q 160 47 252 53 L 250 58 Q 160 52 70 58 Z" fill="#6B8E78" opacity="0.75" />
          {/* Ferns sprouting around stone base */}
          <ellipse cx="98" cy="88" rx="10" ry="4" fill={lineColor} opacity="0.45" />
          <ellipse cx="222" cy="88" rx="10" ry="4" fill={lineColor} opacity="0.45" />
          <text x="160" y="109" textAnchor="middle" fontSize="9.5" fill={accentColor} opacity="0.78" fontFamily="Plus Jakarta Sans, sans-serif">
            Outdoor · Banyan Stone Seat
          </text>
        </g>
      )}
    </g>
  );
}

/**
 * Draws the selected botanical seating illustration onto an HTML5 Canvas for PNG export.
 */
export function drawBotanicalSeatingOnCanvas(
  ctx: CanvasRenderingContext2D,
  model: SeatingModelId | undefined,
  centerX: number,
  baseY: number,
  accentColor: string,
  lineColor: string
) {
  if (!model || model === 'none') return;

  ctx.save();
  ctx.translate(centerX - 160, baseY - 104);

  // Ground shadow
  ctx.fillStyle = lineColor;
  ctx.globalAlpha = 0.16;
  ctx.beginPath();
  ctx.ellipse(160, 96, 136, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Botanical flanking sprigs
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(28, 92);
  ctx.quadraticCurveTo(14, 70, 22, 46);
  ctx.moveTo(292, 92);
  ctx.quadraticCurveTo(306, 70, 298, 46);
  ctx.stroke();

  if (model === 'indoor_heirloom_sofa') {
    ctx.fillStyle = '#E5DEC9';
    ctx.fillRect(38, 88, 244, 8);
    ctx.fillStyle = '#7B5536';
    ctx.fillRect(56, 78, 8, 12);
    ctx.fillRect(256, 78, 8, 12);
    ctx.fillStyle = '#F4EFE3';
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.6;
    ctx.fillRect(50, 26, 220, 38);
    ctx.strokeRect(50, 26, 220, 38);
    ctx.fillStyle = '#FAF7F0';
    ctx.fillRect(58, 52, 66, 20);
    ctx.fillRect(127, 52, 66, 20);
    ctx.fillRect(196, 52, 66, 20);
    ctx.fillStyle = '#EAE2CF';
    ctx.fillRect(40, 38, 20, 38);
    ctx.fillRect(260, 38, 20, 38);
    ctx.fillStyle = '#8C623E';
    ctx.fillRect(46, 73, 228, 7);
    ctx.fillStyle = '#A3B8A8';
    ctx.fillRect(64, 34, 22, 18);
    ctx.fillStyle = '#D9C39E';
    ctx.fillRect(234, 34, 22, 18);
  } else if (model === 'indoor_teak_divan') {
    ctx.fillStyle = '#8C5E3C';
    ctx.fillRect(48, 24, 224, 32);
    ctx.fillStyle = '#F5EFE2';
    ctx.fillRect(46, 53, 228, 19);
    ctx.fillStyle = '#6D472B';
    ctx.fillRect(44, 71, 232, 8);
    ctx.fillStyle = '#C9A96E';
    ctx.beginPath();
    ctx.ellipse(64, 48, 14, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(256, 48, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (model === 'indoor_window_settee') {
    ctx.fillStyle = '#6B8E78';
    ctx.fillRect(52, 26, 216, 32);
    ctx.fillStyle = '#88A894';
    ctx.fillRect(48, 54, 224, 20);
    ctx.fillStyle = '#C9A96E';
    ctx.fillRect(54, 72, 212, 4);
  } else if (model === 'outdoor_courtyard_bench') {
    ctx.strokeStyle = '#2D3A32';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(46, 60);
    ctx.lineTo(44, 91);
    ctx.moveTo(274, 60);
    ctx.lineTo(276, 91);
    ctx.stroke();
    ctx.fillStyle = '#9A6E47';
    ctx.fillRect(54, 25, 212, 8);
    ctx.fillRect(54, 36, 212, 8);
    ctx.fillRect(54, 47, 212, 8);
    ctx.fillStyle = '#B28459';
    ctx.fillRect(46, 61, 228, 12);
  } else if (model === 'outdoor_porch_swing') {
    ctx.fillStyle = '#6D4B2D';
    ctx.fillRect(46, 6, 228, 7);
    ctx.strokeStyle = '#B08D57';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(72, 13);
    ctx.lineTo(64, 64);
    ctx.moveTo(248, 13);
    ctx.lineTo(256, 64);
    ctx.stroke();
    ctx.fillStyle = '#8C5E3C';
    ctx.fillRect(66, 28, 188, 28);
    ctx.fillStyle = '#F2EDE2';
    ctx.fillRect(60, 54, 200, 14);
    ctx.fillStyle = '#6D4B2D';
    ctx.fillRect(54, 66, 212, 9);
  } else if (model === 'outdoor_banyan_stone') {
    ctx.fillStyle = '#C8BFA8';
    ctx.fillRect(64, 66, 22, 24);
    ctx.fillRect(234, 66, 22, 24);
    ctx.fillStyle = '#E3DAC6';
    ctx.fillRect(48, 52, 224, 15);
    ctx.fillStyle = '#6B8E78';
    ctx.fillRect(70, 49, 180, 5);
  }

  ctx.fillStyle = accentColor;
  ctx.globalAlpha = 0.78;
  ctx.textAlign = 'center';
  ctx.font = '500 10px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Family Gathering Seating', 160, 110);
  ctx.restore();
}
