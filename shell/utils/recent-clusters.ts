import { MENU_MAX_RECENT_CLUSTERS } from '@shell/store/prefs';

/**
 * Pure helper for the app-bar "recently visited clusters" list (SURE-8192 / #11043).
 *
 * RECENT is a "last-seen" list of EVERY cluster the user has visited, most-recent-first and de-duped.
 * It is written ONLY on a cluster visit (never by pin/unpin) — a cluster can be both recent and pinned
 * in storage; being pinned just hides it from the RECENT group at display time (the shelf filters out
 * pinned ids, then shows the latest MENU_MAX_RECENT_CLUSTERS). So the list can grow up to the size of
 * the estate; it is a plain visit-order log, not a curated 3-item list.
 *
 * The list is UNCAPPED — it's a plain "recently viewed" log that grows with every distinct cluster
 * visited (bounded in practice by the size of the estate). Only DISPLAY is capped (pinned filtered
 * out, latest few shown — see `visibleRecentClusters`). `max` stays overridable for tests.
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

  // Move the just-visited cluster to the front, de-duping. Pinned status is irrelevant here — it only
  // affects display (see MENU_MAX_RECENT_CLUSTERS and the side-nav helper's recent filtering).
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
