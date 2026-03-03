import type { Status } from '@components/utils/status';
import type { RcIconType } from '@components/RcIcon/types';
import type { ButtonVariant } from '@components/RcButton/types';

export type SectionType = 'primary' | 'secondary';

export type SectionMode = 'with-header' | 'no-header';

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
  /** Identifier emitted when the action is clicked. */
  key: string;
  /** Button label. When omitted the button renders as icon-only (ghost). */
  label?: string;
  /** Icon shown on the button (left position for labeled, sole content for icon-only). */
  icon?: RcIconType;
  /** Override the default variant (secondary for labeled, ghost for icon-only). */
  variant?: ButtonVariant;
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
