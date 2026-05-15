import { createPortal } from 'react-dom';
import { CardArt } from './CardArt';
import { centeringLabel, centeringLean, centeringScore } from '../game/centering';
import type { CardRarity, GradingCompanyId } from '../types';

type Props = {
  name: string;
  rarity: CardRarity;
  hue: number;
  cardId: string;
  grade?: number;
  gradingCompany?: GradingCompanyId;
  centeringOffsetX: number;
  centeringOffsetY: number;
  /** Optional raw-condition label shown alongside the centering readout. */
  condition?: string;
  onClose: () => void;
};

/** Full-screen magnified card view for inspecting quality & centering. */
export function CardZoomOverlay({
  name,
  rarity,
  hue,
  cardId,
  grade,
  gradingCompany,
  centeringOffsetX,
  centeringOffsetY,
  condition,
  onClose,
}: Props) {
  // Render at the large card layout, then scale up modestly. The bigger native
  // size keeps slab label text proportionate and lets it fit without cropping
  // (the old approach magnified the tiny default layout 3.6x).
  const scale = 2.3;
  const baseW = 176;
  const baseH = 252;
  const score = centeringScore(centeringOffsetX, centeringOffsetY);
  const lean = centeringLean(centeringOffsetX, centeringOffsetY);
  return createPortal(
    <div
      className="fixed inset-0 z-[230] flex flex-col items-center justify-center gap-5 bg-ink-900/80 backdrop-blur-sm p-6"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div style={{ width: baseW * scale, height: baseH * scale }} className="relative shrink-0">
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <CardArt
            name={name}
            rarity={rarity}
            hue={hue}
            cardId={cardId}
            grade={grade}
            gradingCompany={gradingCompany}
            centeringOffsetX={centeringOffsetX}
            centeringOffsetY={centeringOffsetY}
            large
            detail
          />
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg bg-white/95 border border-line px-4 py-2 shadow-lg">
        <div className="text-xs">
          <div className="text-[9px] uppercase tracking-widest text-ink-400 font-bold">
            Centering
          </div>
          <div
            className={`font-bold ${
              score >= 85
                ? 'text-ebayGreen-600'
                : score >= 60
                ? 'text-ebayYellow-700'
                : 'text-ebayRed-500'
            }`}
          >
            {score}/100 · {centeringLabel(centeringOffsetX, centeringOffsetY)}
            {lean ? `, ${lean}` : ''}
          </div>
        </div>
        {condition && (
          <>
            <span className="w-px h-7 bg-line" />
            <div className="text-xs">
              <div className="text-[9px] uppercase tracking-widest text-ink-400 font-bold">
                Condition
              </div>
              <div className="font-bold text-ink-800">{condition}</div>
            </div>
          </>
        )}
      </div>
      <div className="text-[11px] text-white/70 uppercase tracking-widest font-bold">
        Click anywhere to close
      </div>
    </div>,
    document.body,
  );
}
