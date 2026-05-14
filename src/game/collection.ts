import type { CardDef, CollectionEntry, InventoryItem } from '../types';
import { CARDS } from '../data/cards';

export function cardsBySet(): Record<string, CardDef[]> {
  const out: Record<string, CardDef[]> = {};
  for (const c of CARDS) {
    if (!out[c.set]) out[c.set] = [];
    out[c.set].push(c);
  }
  return out;
}

export function recordAcquisitions(
  prev: Record<string, CollectionEntry>,
  items: InventoryItem[],
): { collection: Record<string, CollectionEntry>; newCardIds: string[] } {
  const next = { ...prev };
  const newIds: string[] = [];
  for (const item of items) {
    const existing = next[item.cardId];
    if (!existing) {
      newIds.push(item.cardId);
      next[item.cardId] = {
        cardId: item.cardId,
        totalOwned: 1,
        bestGrade: item.grade,
        firstAcquiredAt: item.acquiredAt,
      };
    } else {
      next[item.cardId] = {
        ...existing,
        totalOwned: existing.totalOwned + 1,
        bestGrade:
          item.grade !== undefined && (existing.bestGrade === undefined || item.grade > existing.bestGrade)
            ? item.grade
            : existing.bestGrade,
      };
    }
  }
  return { collection: next, newCardIds: newIds };
}

export function recordGradeUpdate(
  prev: Record<string, CollectionEntry>,
  cardId: string,
  grade: number,
): Record<string, CollectionEntry> {
  const existing = prev[cardId];
  if (!existing) return prev;
  if (existing.bestGrade !== undefined && existing.bestGrade >= grade) return prev;
  return {
    ...prev,
    [cardId]: { ...existing, bestGrade: grade },
  };
}

export function collectionSize(collection: Record<string, CollectionEntry>): number {
  return Object.keys(collection).length;
}

export function collectionPercent(collection: Record<string, CollectionEntry>): number {
  return Math.round((collectionSize(collection) / CARDS.length) * 100);
}
