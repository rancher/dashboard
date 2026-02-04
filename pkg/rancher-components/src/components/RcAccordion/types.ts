export type RcAccordionVariant = 'primary' | 'secondary';

export interface RcAccordionProps {
  /**
   * The title displayed in the accordion header
   */
  title?: string;

  /**
   * Visual variant determining background color:
   * - 'primary': White background (for top-level accordions)
   * - 'secondary': Light gray background (for nested accordions)
   */
  variant?: RcAccordionVariant;

  /**
   * Controls the expanded/collapsed state.
   * Use with v-model for two-way binding.
   */
  modelValue?: boolean;

  /**
   * Initial expanded state when not using v-model.
   * Only used on mount.
   */
  openInitially?: boolean;
}
