import type { Status } from '@components/utils/status';
import type { RcIconType } from '@components/RcIcon/types';

export type SectionType = 'primary' | 'secondary';

export type SectionMode = 'with-header' | 'no-header';

export type SectionBackground = 'primary' | 'secondary';

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

export interface BadgeConfig {
  /** Display text inside the badge. */
  label: string;
  /** Status colour of the badge. */
  status: Status;
}

export interface RcSectionBadgesProps {
  badges: BadgeConfig[];
}

// ---------------------------------------------------------------------------
// Action helpers
// ---------------------------------------------------------------------------

export interface ActionConfig {
  /** Button label. When omitted the button renders as icon-only (ghost). */
  label?: string;
  /** Icon shown on the button (left position for labeled, sole content for icon-only). */
  icon?: RcIconType;
  /** Callback invoked when the action is clicked. */
  action: () => void;
}

export interface RcSectionActionsProps {
  actions: ActionConfig[];
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export interface RcSectionProps {
  /**
   * Visual type of the section.
   * - Primary: no lateral padding, border-radius, or background (inherits from parent). Bolder title (700).
   * - Secondary: has lateral padding (16px), border-radius (8px), and background color. Lighter title (600).
   */
  type: SectionType;

  /**
   * Controls whether the section renders with a header or without.
   * - 'with-header': renders the full header (title, badges, actions, errors).
   * - 'no-header': hides the header entirely; content padding adjusts to 16px vertical.
   */
  mode: SectionMode;

  /**
   * Background color of the section.
   * - 'primary'
   * - 'secondary'
   */
  background: SectionBackground;

  /**
   * Whether the section can be expanded/collapsed via the header.
   */
  expandable: boolean;

  /**
   * Whether the section content is expanded. Only applies when `expandable` is true.
   * Supports `v-model:expanded`.
   */
  expanded?: boolean;

  /**
   * The section title text. Can also be provided via the `title` slot.
   */
  title?: string;
}
