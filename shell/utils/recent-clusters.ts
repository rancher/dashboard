import { MENU_MAX_RECENT_CLUSTERS } from '@shell/store/prefs';

/**
 * Prepend `id` to the "recently visited clusters" list (most-recent-first, de-duped).
 *
 * The stored list is UNCAPPED — a plain visit-order log written only on a visit (never by pin/unpin),
 * growing with the estate. Only DISPLAY is capped, by `visibleRecentClusters`. `max` stays overridable
 * for tests.
 */
export function addRecentCluster(
  recents: string[] = [],
  id: string,
  { max = Infinity }: { max?: number } = {}
): string[] {
  const current = Array.isArray(recents) ? recents : [];

  if (!id) {
    return current.slice(0, max);
  }

  // Pinned status is irrelevant here — it only affects display, not the stored visit log.
  return [id, ...current.filter((r) => r !== id)].slice(0, max);
}

/**
 * The recent clusters to actually SHOW: drop any that are currently pinned (they appear under PINNED),
 * preserve visit order, and cap at the display limit.
 */
export function visibleRecentClusters(
  recents: string[] = [],
  pinnedIds: string[] = [],
  max: number = MENU_MAX_RECENT_CLUSTERS
): string[] {
  const pinned = Array.isArray(pinnedIds) ? pinnedIds : [];

  return (Array.isArray(recents) ? recents : [])
    .filter((id) => !pinned.includes(id))
    .slice(0, max);
}
