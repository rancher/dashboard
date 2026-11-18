/**
 * Screen-reader announcements (WCAG 2.2 SC 4.1.3, "Status Messages", Level AA).
 *
 * Visual-only feedback - a spinner, a tick on a button, a "Copied!" label - is silent to a
 * screen reader. `announce()` pushes the equivalent text into an ARIA live region so JAWS,
 * NVDA and VoiceOver read it out without moving focus.
 *
 * Why one pair of regions created up front, rather than an `aria-live` element per component:
 *  - Screen readers only reliably announce mutations of a region that was already in the
 *    accessibility tree. An element that is `v-if`-ed in with its text already set reads as a
 *    tree mutation, not a region update, and gets missed - most of all by VoiceOver.
 *  - Four nodes per politeness level are rotated via `lastNodeForText`, so the same message
 *    announced repeatedly — whether from the same component or two components sharing a phrase
 *    like "Copied!" — always lands on a node the screen reader has not recently announced from.
 *
 * The regions live on `document.body`, outside the Vue tree, so route changes, layout swaps
 * and dialog teardown cannot take them away.
 */
import { decodeHtml } from '@shell/utils/string';

export const ANNOUNCE_POLITE = 'polite';
export const ANNOUNCE_ASSERTIVE = 'assertive';

export type Politeness = typeof ANNOUNCE_POLITE | typeof ANNOUNCE_ASSERTIVE;

const CONTAINER_ID = 'aria-live-announcer';

/** Let the screen reader settle on the empty node before we write to it. */
const WRITE_DELAY = 100;

/**
 * Longer delay for the first write to a region that this call had to create, which happens
 * when `initAriaAnnouncer` was never run - a UI Extension built against this version of
 * `@rancher/shell` running inside an older Rancher that boots without it. Announcing still
 * works, it just needs the region to be in the accessibility tree first.
 */
const COLD_WRITE_DELAY = 350;

/** Drop the text afterwards so it isn't re-read when the user walks the virtual buffer. */
const CLEAR_DELAY = 1000;

interface Region {
  nodes: HTMLElement[];
  /**
   * Tracks which node was most recently used for each announced text. Ensures consecutive
   * announcements of the same message always land on different DOM nodes — screen readers
   * suppress an identical re-write to the same node even when the node went through '' in between.
   */
  lastNodeForText: Map<string, number>;
  next: number;
  warmedUp: boolean;
  writeTimer?: ReturnType<typeof setTimeout>;
  clearTimer?: ReturnType<typeof setTimeout>;
}

const regions: Partial<Record<Politeness, Region>> = {};

/**
 * Labels reach us as translated markup - tags from `v-clean-html` labels, entities such as
 * `&hellip;`. Strip the tags first, so nothing in the message can be fetched or executed when
 * it is decoded, then resolve the entities to the characters a screen reader should read.
 */
function plainText(message: string): string {
  return decodeHtml(String(message).replace(/<\/?[^>]+(>|$)/g, '')).trim();
}

function container(): HTMLElement | null {
  if (!document.body) {
    // Imported before the document was parsed. Come back once it is.
    document.addEventListener('DOMContentLoaded', () => initAriaAnnouncer(), { once: true });

    return null;
  }

  const existing = document.getElementById(CONTAINER_ID);

  if (existing) {
    return existing;
  }

  const el = document.createElement('div');

  el.id = CONTAINER_ID;
  // Inline rather than the `.sr-only` class, because this node lives outside the Vue tree and
  // has to survive without the app stylesheet. Deliberately not `display: none` or
  // `visibility: hidden` - either takes the region out of the accessibility tree entirely and
  // nothing is ever announced.
  el.setAttribute('style', [
    'position:absolute',
    'width:1px',
    'height:1px',
    'margin:-1px',
    'padding:0',
    'overflow:hidden',
    'clip:rect(0,0,0,0)',
    'white-space:nowrap',
    'border:0'
  ].join(';'));

  document.body.appendChild(el);

  return el;
}

function region(politeness: Politeness): Region | null {
  const existing = regions[politeness];

  // `isConnected` is a self-heal: if anything outside Vue wipes the body the region is
  // rebuilt on the next announcement rather than going permanently silent.
  if (existing?.nodes[0]?.isConnected) {
    return existing;
  }

  const parent = container();

  if (!parent) {
    return null;
  }

  // A UI Extension bundles its own copy of @rancher/shell, so its module state is separate
  // from the host's. Adopt the regions already in the shared container instead of adding a
  // second pair of them per bundle.
  const adopted = Array.from(parent.querySelectorAll<HTMLElement>(`[aria-live="${ politeness }"]`));

  if (adopted.length) {
    const reused: Region = {
      nodes: adopted, next: 0, warmedUp: true, lastNodeForText: new Map()
    };

    regions[politeness] = reused;

    return reused;
  }

  // Screen readers suppress an identical re-write to the same DOM node even when the node
  // was cleared to '' in between — VoiceOver remembers the last text it announced per node
  // and stays silent if the next write is word-for-word the same. Multiple nodes let us
  // always write to one the screen reader has not recently used for that text.
  //
  // Two nodes handle a single component repeating the same message, but any scenario with
  // two components sharing the same phrase (e.g. two "Copy" buttons on the same page)
  // rotates back to the starting node on the third press — still within VoiceOver's
  // suppression window. Four push reuse far enough out (~4+ announcements) that the screen
  // reader's memory of that node's previous content has expired before it is reused.
  const nodes = [0, 1, 2, 3].map(() => {
    const node = document.createElement('div');

    // `role` alongside `aria-live`, because some screen reader and browser pairings only
    // honour one of the two.
    node.setAttribute('role', politeness === ANNOUNCE_ASSERTIVE ? 'alert' : 'status');
    node.setAttribute('aria-live', politeness);
    node.setAttribute('aria-atomic', 'true');
    parent.appendChild(node);

    return node;
  });

  const created: Region = {
    nodes, next: 0, warmedUp: false, lastNodeForText: new Map()
  };

  regions[politeness] = created;

  return created;
}

/**
 * Create the live regions. Called once during app startup so they are in the accessibility
 * tree, and empty, before anything has a status to report.
 */
export function initAriaAnnouncer(): void {
  if (typeof document === 'undefined') {
    return;
  }

  region(ANNOUNCE_POLITE);
}

/**
 * Announce a status message to screen readers.
 *
 * @param message Text to read out. Markup and HTML entities are fine, both are resolved. An
 *                empty or whitespace-only message is a no-op.
 * @param politeness `polite` waits for a pause, `assertive` interrupts. Prefer `polite` unless
 *                   the user has to act on the message right now.
 */
export function announce(message: string, politeness: Politeness = ANNOUNCE_POLITE): void {
  if (typeof document === 'undefined') {
    return;
  }

  const text = plainText(message || '');

  if (!text) {
    return;
  }

  const target = region(politeness);

  if (!target) {
    return;
  }

  clearTimeout(target.writeTimer);
  clearTimeout(target.clearTimer);

  // Always write to the node OPPOSITE to the last one used for this text. Screen readers
  // suppress an identical re-write to the same DOM node even when the node went through ''
  // in between — this applies to rapid repeats AND repeats across full action cycles
  // (click → Applied → reset → click → Applied again).
  const lastNode = target.lastNodeForText.get(text);
  const idx = lastNode !== undefined ? (lastNode + 1) % target.nodes.length : target.next;

  const node = target.nodes[idx];

  target.lastNodeForText.set(text, idx);
  target.next = (idx + 1) % target.nodes.length;

  const delay = target.warmedUp ? WRITE_DELAY : COLD_WRITE_DELAY;

  target.warmedUp = true;

  // Emptying is silent, and it guarantees the write below reads as a change even when the
  // previous message was word for word the same.
  target.nodes.forEach((n) => {
    n.textContent = '';
  });

  target.writeTimer = setTimeout(() => {
    node.textContent = text;

    target.clearTimer = setTimeout(() => {
      node.textContent = '';
    }, CLEAR_DELAY);
  }, delay);
}

/**
 * Tear the regions down. Only needed between unit tests.
 */
export function resetAriaAnnouncer(): void {
  Object.values(regions).forEach((r) => {
    clearTimeout(r?.writeTimer);
    clearTimeout(r?.clearTimer);
  });

  delete regions[ANNOUNCE_POLITE];
  delete regions[ANNOUNCE_ASSERTIVE];
  document.getElementById(CONTAINER_ID)?.remove();
}
