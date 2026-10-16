import type { Meta, StoryObj } from '@storybook/vue3';
import { RcDrawer, RcDrawerCard } from '@components/RcDrawer';
import { RcButton } from '@components/RcButton';
import StateDot from '@shell/components/StateDot/index.vue';

const meta: Meta<typeof RcDrawer> = {
  component:  RcDrawer,
  decorators: [
    () => ({ template: '<div style="position: relative; height: 560px; border: 1px solid var(--border);"><story /></div>' }),
  ],
  argTypes: {
    title: {
      control:     { type: 'text' },
      description: 'The drawer title. Rendered in the header and used as the drawer\'s accessible name, also when the `title` slot replaces what the header shows.',
    },
    closeLabel: {
      control:     { type: 'text' },
      description: 'The footer close button\'s text, such as Cancel when the drawer has an action to save. Defaults to Close. When set, the button is named by this text rather than by the drawer it closes.',
    },
    close: {
      description: 'Emitted by the header close button and the footer Close button. The drawer stays open until the consumer takes it down.',
      table:       { category: 'events' },
    },
    titleSlot: {
      name:        'title',
      description: 'The title, for when it needs more than the string the `title` prop takes.',
      control:     false,
      table:       { category: 'slots' },
    },
    additionalActionsSlot: {
      name:        'additional-actions',
      description: 'Buttons after the Close button, such as the drawer\'s primary action.',
      control:     false,
      table:       { category: 'slots' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RcDrawer>;

const card = `
  <RcDrawerCard>
    <dl class="mt-0 mb-0">
      <dt class="text-label">Namespace</dt>
      <dd class="ml-0 mb-10">default</dd>
      <dt class="text-label">Created</dt>
      <dd class="ml-0">2 days ago</dd>
    </dl>
  </RcDrawerCard>
`;

/**
 * The drawer Show Configuration opens: the title and a close button in the
 * header, the content on cards over a tinted body, and a footer with Close
 * followed by the drawer's own actions.
 */
export const Default: Story = {
  render: (args: any) => ({
    components: {
      RcDrawer, RcDrawerCard, RcButton
    },
    setup:    () => ({ args }),
    template: `
      <RcDrawer v-bind="args">
        ${ card }
        <template #additional-actions>
          <RcButton variant="primary" size="large">Edit Config</RcButton>
        </template>
      </RcDrawer>
    `,
  }),
  args: { title: 'nginx-config (ConfigMap) - Configuration' },
};

/**
 * With nothing in `additional-actions`, the footer holds just the Close button.
 */
export const CloseOnly: Story = {
  render: (args: any) => ({
    components: { RcDrawer, RcDrawerCard },
    setup:      () => ({ args }),
    template:   `
      <RcDrawer v-bind="args">
        ${ card }
      </RcDrawer>
    `,
  }),
  args: { title: 'Chart Info' },
};

/**
 * The `title` slot replaces what the header shows. The `title` prop still
 * names the drawer, so keep it to the slot's plain text.
 */
export const RichTitle: Story = {
  render: (args: any) => ({
    components: {
      RcDrawer, RcDrawerCard, RcButton, StateDot
    },
    setup:    () => ({ args }),
    template: `
      <RcDrawer v-bind="args">
        <template #title>
          <StateDot color="success" class="mmr-3" />
          {{ args.title }}
        </template>
        ${ card }
        <template #additional-actions>
          <RcButton variant="primary" size="large">Edit Config</RcButton>
        </template>
      </RcDrawer>
    `,
  }),
  args: { title: 'nginx-config (ConfigMap) - Configuration' },
};

/**
 * Content taller than the drawer scrolls inside the body, and the header and
 * footer stay in view.
 */
export const TallContent: Story = {
  render: (args: any) => ({
    components: {
      RcDrawer, RcDrawerCard, RcButton
    },
    setup:    () => ({ args }),
    template: `
      <RcDrawer v-bind="args">
        <RcDrawerCard v-for="n in 6" :key="n" class="mmb-4">
          <h3>Section {{ n }}</h3>
          <p>Each card is one section of the drawer, with the tinted body showing between them.</p>
        </RcDrawerCard>
        <template #additional-actions>
          <RcButton variant="primary" size="large">Edit Config</RcButton>
        </template>
      </RcDrawer>
    `,
  }),
  args: { title: 'nginx-config (ConfigMap) - Configuration' },
};
