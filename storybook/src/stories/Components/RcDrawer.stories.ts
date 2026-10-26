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
    headerActionsSlot: {
      name:        'header-actions',
      description: 'Buttons that act on the drawer\'s content, such as Dock to shell or Expand all, between the title and the close button. Use a secondary or tertiary `RcButton` with a label.',
      control:     false,
      table:       { category: 'slots' },
    },
    additionalActionsSlot: {
      name:        'additional-actions',
      description: 'The drawer\'s actions, such as its primary action, after the footer\'s Close button. The footer only shows when there is one.',
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

const text = `
  <p>This chart deploys a logging operator and the CRDs it needs.</p>
  <h3>Cluster-level logging</h3>
  <p>Cluster flows collect logs from the entire cluster and send them to cluster outputs.</p>
`;

/**
 * The drawer Show Configuration opens: the title and a close button in the
 * header, its form on a card over the tinted body, and a footer with Close
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
 * A button that acts on the content sits in `header-actions`. With nothing in
 * `additional-actions` there is no footer. Text, such as a chart's readme, goes
 * straight in the body.
 */
export const HeaderActions: Story = {
  render: (args: any) => ({
    components: { RcDrawer, RcButton },
    setup:      () => ({ args }),
    template:   `
      <RcDrawer v-bind="args">
        <template #header-actions>
          <RcButton variant="secondary" left-icon="dock">Dock to shell</RcButton>
        </template>
        ${ text }
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
    components: { RcDrawer, RcButton },
    setup:      () => ({ args }),
    template:   `
      <RcDrawer v-bind="args">
        <template v-for="n in 6" :key="n">
          <h3>Section {{ n }}</h3>
          <p>Text goes straight in the body, and the body scrolls when it runs past the footer.</p>
        </template>
        <template #additional-actions>
          <RcButton variant="primary" size="large">Edit Config</RcButton>
        </template>
      </RcDrawer>
    `,
  }),
  args: { title: 'nginx-config (ConfigMap) - Configuration' },
};
