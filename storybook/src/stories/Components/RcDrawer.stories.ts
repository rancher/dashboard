import type { Meta, StoryObj } from '@storybook/vue3';
import { RcDrawer, RcDrawerCard, RcDrawerFooter, RcDrawerHeader } from '@components/RcDrawer';
import { RcButton } from '@components/RcButton';
import { RcButtonSplit } from '@components/RcButtonSplit';
import StateDot from '@shell/components/StateDot/index.vue';

const meta: Meta<typeof RcDrawer> = {
  component:  RcDrawer,
  decorators: [
    () => ({ template: '<div style="position: relative; height: 560px; border: 1px solid var(--border);"><story /></div>' }),
  ],
  argTypes: {
    title: {
      control:     { type: 'text' },
      description: 'The drawer title. Rendered in the header and used as the drawer\'s accessible name, also when an `RcDrawerHeader` shows a richer title.',
    },
    close: {
      description: 'Emitted by every close button, and by the `close` the `header` and `footer` slots receive. The drawer stays open until the consumer takes it down.',
      table:       { category: 'events' },
    },
    header: {
      description: 'The header. Defaults to an `RcDrawerHeader` with the drawer\'s title; put one in it yourself for a richer title or header actions. It receives `close`, which closes the drawer.',
      control:     false,
      table:       { category: 'slots' },
    },
    default: {
      description: 'The drawer body. Text goes straight in; wrap a form or a table in an `RcDrawerCard`.',
      control:     false,
      table:       { category: 'slots' },
    },
    footer: {
      description: 'The footer, which only shows when this renders something. Put an `RcDrawerFooter` in it for the standard Close button and the drawer\'s actions, or lay out your own buttons; it receives `close`, which closes the drawer.',
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
 * `RcDrawerHeader` is the header every drawer gets. Put one in `header`
 * yourself when the title needs markup, such as a state dot, which goes in its
 * default slot, or when the drawer has buttons that act on its content, which
 * go in `actions` beside the X. The `title` prop still names the drawer, so
 * keep it to the plain text of the title.
 */
export const Header: Story = {
  render: (args: any) => ({
    components: {
      RcDrawer, RcDrawerHeader, StateDot
    },
    setup:    () => ({ args }),
    template: `
      <RcDrawer v-bind="args">
        <template #header>
          <RcDrawerHeader>
            <StateDot color="success" class="mmr-3" />
            {{ args.title }}
            <template #actions>
              <button
                type="button"
                class="btn role-link"
                aria-label="Dock to shell"
                title="Dock to shell"
                style="display: inline-flex; justify-content: center; width: 24px; height: 24px; color: var(--body-text);"
              >
                <i class="icon icon-dock" />
              </button>
            </template>
          </RcDrawerHeader>
        </template>
        ${ text }
      </RcDrawer>
    `,
  }),
  args: { title: 'rancher-logging - Chart Info' },
};

/**
 * The drawer Show Configuration opens: the title and a close button in the
 * header, its form on a card over the tinted body, and an `RcDrawerFooter`
 * with Close followed by the drawer's own actions.
 */
export const Default: Story = {
  render: (args: any) => ({
    components: {
      RcDrawer, RcDrawerCard, RcDrawerFooter, RcButton
    },
    setup:    () => ({ args }),
    template: `
      <RcDrawer v-bind="args">
        ${ card }
        <template #footer>
          <RcDrawerFooter>
            <RcButton variant="primary" size="large">Edit Config</RcButton>
          </RcDrawerFooter>
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
      RcDrawer, RcDrawerFooter, RcButton
    },
    setup:    () => ({ args }),
    template: `
      <RcDrawer v-bind="args">
        <template v-for="n in 6" :key="n">
          <h3>Section {{ n }}</h3>
          <p>Text goes straight in the body, and the body scrolls when it runs past the footer.</p>
        </template>
        <template #footer>
          <RcDrawerFooter>
            <RcButton variant="primary" size="large">Edit Config</RcButton>
          </RcDrawerFooter>
        </template>
      </RcDrawer>
    `,
  }),
  args: { title: 'nginx-config (ConfigMap) - Configuration' },
};

/**
 * When a drawer has more actions than its footer has room for, such as in a
 * narrow drawer, the main one goes on an `RcButtonSplit` and the rest go in its
 * menu.
 */
export const SplitButton: Story = {
  render: (args: any) => ({
    components: {
      RcDrawer, RcDrawerFooter, RcButtonSplit
    },
    setup: () => ({
      args,
      items: [{ id: 'edit', label: 'Edit' }, { id: 'delete', label: 'Delete' }],
    }),
    template: `
      <div style="position: absolute; top: 0; right: 0; bottom: 0; width: 420px; border-left: 1px solid var(--border);">
        <RcDrawer v-bind="args">
          <p>Reports a deviating state when the 95th percentile response time stays above 3 seconds.</p>
          <template #footer>
            <RcDrawerFooter>
              <RcButtonSplit
                variant="primary"
                size="large"
                :items="items"
                aria-label-trigger="More monitor actions"
              >
                Disable monitor
              </RcButtonSplit>
            </RcDrawerFooter>
          </template>
        </RcDrawer>
      </div>
    `,
  }),
  args: { title: 'HTTP - response time - is above 3 seconds' },
};

/**
 * A drawer that needs a different pair of buttons, such as Cancel and Save,
 * puts its own straight in `footer` and closes the drawer with the `close` it
 * receives.
 */
export const CustomFooter: Story = {
  render: (args: any) => ({
    components: {
      RcDrawer, RcDrawerCard, RcButton
    },
    setup:    () => ({ args }),
    template: `
      <RcDrawer v-bind="args">
        ${ card }
        <template #footer="{ close }">
          <RcButton variant="secondary" size="large" @click="close">Cancel</RcButton>
          <RcButton variant="primary" size="large">Save</RcButton>
        </template>
      </RcDrawer>
    `,
  }),
  args: { title: 'GitHub - Access' },
};
