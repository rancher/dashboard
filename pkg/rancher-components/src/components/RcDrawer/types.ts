import { Ref, ref } from 'vue';

export interface RcDrawerProps {
  /**
   * The drawer title. Renders in the header and names the drawer for assistive
   * technology. The `title` slot replaces what the header shows, but this
   * still names the drawer, so keep it to the plain text of that slot.
   */
  title: string;
}

export type DrawerContext = {
  close: () => void;
  closeAriaLabel: Ref<string | undefined>;
};

export const defaultContext: DrawerContext = {
  close:          () => null,
  closeAriaLabel: ref(),
};
