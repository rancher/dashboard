export interface RcModalProps {
  /**
   * The modal's title. Can also be supplied through the `title` slot when it
   * needs markup. The header, and the rule beneath it, are omitted entirely
   * when neither is given.
   */
  title?: string;

  /**
   * The `id` put on the title element. The modal names its surrounding dialog
   * on its own, so this is only needed when something else wants to reference
   * the title by a known id. Defaults to a generated one.
   */
  titleId?: string;
}
