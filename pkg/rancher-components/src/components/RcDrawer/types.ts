import { Ref, ref } from 'vue';

export interface RcDrawerHeaderProps {
  /**
   * The drawer title. Renders in the header, names the drawer for assistive
   * technology and names its close buttons. The default slot replaces what the
   * header shows, but this still names the drawer, so keep it to the plain
   * text of that slot.
   */
  title: string;
}

export interface RcDrawerFooterProps {
  /**
   * The secondary button's label. Defaults to Close; the button closes the
   * drawer whatever it says.
   */
  secondaryLabel?: string;

  /**
   * The primary button's label. Clicking the button emits `primary`. Without
   * it, or the `primary` slot, the footer has no primary button.
   */
  primaryLabel?: string;
}

export type DrawerContext = {
  title: Ref<string | undefined>;
  close: () => void;
  closeAriaLabel: Ref<string | undefined>;
};

export const defaultContext = (): DrawerContext => ({
  title:          ref(),
  close:          () => null,
  closeAriaLabel: ref(),
});
