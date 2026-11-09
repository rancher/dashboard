import type { Meta, StoryObj } from '@storybook/vue3';
import { RcDrawer, RcDrawerCard, RcDrawerFooter, RcDrawerHeader } from '@components/RcDrawer';

const meta: Meta<typeof RcDrawer> = {
  title:      'stories/Components/RcDrawer/RcDrawer',
  component:  RcDrawer,
  decorators: [
    () => ({ template: '<div style="position: relative; height: 560px; border: 1px solid var(--border);"><story /></div>' }),
  ],
  argTypes: {
    close: {
      description: 'Emitted by every close button, and by the `close` the `header` and `footer` slots receive. The drawer stays open until the consumer takes it down.',
      table:       { category: 'events' },
    },
    header: {
      description: 'The header. Put an `RcDrawerHeader` in it, which gives the drawer its title, its name and the close button. It receives `close`, which closes the drawer.',
      control:     false,
      table:       { category: 'slots' },
    },
    default: {
      description: 'The drawer body. Text goes straight in; wrap a form or a table in an `RcDrawerCard`.',
      control:     false,
      table:       { category: 'slots' },
    },
    footer: {
      description: 'The footer, which only shows when this renders something. Put an `RcDrawerFooter` in it for the standard secondary and primary buttons, or lay out your own; it receives `close`, which closes the drawer.',
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

const footer = `
  <template #footer>
    <RcDrawerFooter primary-label="Edit Config" />
  </template>
`;

/**
 * The drawer Show Configuration opens: an `RcDrawerHeader` with the title and
 * a close button, its form on a card over the tinted body, and an
 * `RcDrawerFooter` with Close and the drawer's primary action.
 */
export const Default: Story = {
  render: () => ({
    components: {
      RcDrawer, RcDrawerCard, RcDrawerFooter, RcDrawerHeader
    },
    template: `
      <RcDrawer>
        <template #header>
          <RcDrawerHeader title="nginx-config (ConfigMap) - Configuration" />
        </template>
        ${ card }
        ${ footer }
      </RcDrawer>
    `,
  }),
};

/**
 * Content taller than the drawer scrolls inside the body, and the header and
 * footer stay in view.
 */
export const TallContent: Story = {
  render: () => ({
    components: {
      RcDrawer, RcDrawerFooter, RcDrawerHeader
    },
    template: `
      <RcDrawer>
        <template #header>
          <RcDrawerHeader title="nginx-config (ConfigMap) - Configuration" />
        </template>
        <template v-for="n in 6" :key="n">
          <h3>Section {{ n }}</h3>
          <p>Text goes straight in the body, and the body scrolls when it runs past the footer.</p>
        </template>
        ${ footer }
      </RcDrawer>
    `,
  }),
};
