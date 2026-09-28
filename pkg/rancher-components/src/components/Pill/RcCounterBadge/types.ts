import type { Status } from '@components/utils/status';
import { Type } from '../types';

export interface RcCounterBadgeProps {
    count: number;
    type: Type;
    disabled?: boolean;

    /**
     * Accessible name for the badge, bound as `aria-label`. Development warns
     * when `status` is set without one.
     */
    ariaLabel?: string;

    /**
     * Colours the badge from the status palette, the same way RcStatusBadge
     * does. When omitted the badge keeps the neutral colours of its `type`.
     */
    status?: Status;

    /**
     * Escape hatch, strongly discouraged. Prefer `type`, or `status` for a
     * palette colour. A colour set here is outside the palette, so it does not
     * follow a theme, does not move with a token change, and has to be audited
     * by hand every time either changes. Reach for it only when the palette
     * genuinely cannot express what is needed, and consider adding a status
     * instead so every badge benefits.
     *
     * Full override of the fill. Any CSS colour, including a `var(--token)`.
     * Wins over `status` and over the `type` colours.
     */
    backgroundColor?: string;

    /**
     * Full override of the border colour. Escape hatch, strongly discouraged,
     * see `backgroundColor`.
     */
    borderColor?: string;

    /**
     * Full override of the text colour. Escape hatch, strongly discouraged,
     * see `backgroundColor`.
     */
    textColor?: string;
}
