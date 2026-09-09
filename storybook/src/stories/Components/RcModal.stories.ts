import type { Meta, StoryObj } from '@storybook/vue3';
import { RcModal } from '@components/RcModal';

/**
 * `RcModal` is the standard chrome for a modal's contents: a titled header, a
 * body that scrolls when it has to, and a footer whose actions sit in one place
 * at one size.
 *
 * It is layout only. Overlay, teleport, focus trap, `Esc` and click-outside
 * close, and width stay with `AppModal`. A component registered in
 * `shell/dialog/` writes the `RcModal` alone, because `PromptModal` already
 * supplies the `AppModal` around it. A standalone modal writes both:
 *
 * ```html
 * <AppModal :width="600" :trigger-focus-trap="true" @close="close">
 *   <RcModal :title="t('some.title')">
 *     ...
 *   </RcModal>
 * </AppModal>
 * ```
 *
 * The title gives the surrounding dialog its accessible name on its own, so
 * there is nothing to wire up. Do not reach for `Card` inside a modal; this
 * replaces it.
 *
 * The stories below render the chrome on its own, inside a box standing in for
 * the dialog `AppModal` would provide.
 */
const meta: Meta<typeof RcModal> = {
  component: RcModal,
  argTypes:  {
    title:   { control: 'text' },
    titleId: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof RcModal>;

// Stands in for the box AppModal renders. The three layout declarations are the
// ones AppModal puts on `.modal-container:has(.rc-modal)`; the rest is just so
// the chrome is shown at a realistic width against the modal background.
const DIALOG = `
  background: var(--modal-bg);
  border: 1px solid var(--modal-border);
  border-radius: var(--border-radius);
  width: 600px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const render = (body: string, actions: string) => (args: Record<string, unknown>) => ({
  components: { RcModal },
  setup() {
    return { args, DIALOG };
  },
  template: `
    <div :style="DIALOG">
      <RcModal v-bind="args">
        ${ body }
        ${ actions ? `<template #actions>${ actions }</template>` : '' }
      </RcModal>
    </div>
  `,
});

const CONFIRM_ACTIONS = `
  <button class="btn role-secondary">Cancel</button>
  <button class="btn role-primary">Move</button>
`;

/**
 * The shape almost every modal wants: a title, some body copy, and a secondary
 * then primary action right-aligned in the footer.
 */
export const Default: Story = {
  args:   { title: 'Move to a new project?' },
  render: render('<p>You are moving the following namespaces.</p>', CONFIRM_ACTIONS),
};

/**
 * A destructive confirm. The chrome is identical; only the primary button's
 * role changes, so delete prompts line up with everything else.
 */
export const Destructive: Story = {
  args:   { title: 'Are you sure?' },
  render: render(
    '<p>You are attempting to delete the Namespace <b>my-namespace</b>.</p>',
    `
      <button class="btn role-secondary">Cancel</button>
      <button class="btn bg-error">Delete</button>
    `
  ),
};

/**
 * With no actions slot the footer, and the rule above it, are left out.
 */
export const WithoutActions: Story = {
  args:   { title: 'Diagnostic timings' },
  render: render('<p>Nothing here needs confirming.</p>', ''),
};

/**
 * With no title the header, and the rule beneath it, are left out. Used by
 * modals that are all content, such as the search dialog.
 */
export const WithoutHeader: Story = {
  args:   {},
  render: render('<p>All content, no chrome above it.</p>', CONFIRM_ACTIONS),
};

/**
 * When the body outgrows the dialog it is the body that scrolls. The header and
 * the actions stay where they are, and the body becomes a tab stop so that a
 * keyboard can reach the overflow. A body that fits does not become one.
 */
export const ScrollingBody: Story = {
  args:   { title: 'Move to a new project?' },
  render: render(
    `<p v-for="n in 30" :key="n">Namespace {{ n }}</p>`,
    CONFIRM_ACTIONS
  ),
};
