import type { Meta, StoryObj } from '@storybook/vue3';
import { RcDrawer, RcDrawerCard, RcDrawerMessage } from '@components/RcDrawer';

const meta: Meta<typeof RcDrawer> = {
  component:  RcDrawer,
  parameters: {
    docs: {
      description: {
        component: `The standard chrome for a drawer: a header carrying the title and a close control, a body, and a footer carrying a close button and any actions.

RcDrawer is **only the chrome**. The sliding container, the glass, the width and height presets, the focus trap and the escape/route handling all belong to the slide-in panel, so open a drawer through the shell API and render RcDrawer as the panel's root:

\`\`\`ts
useShell().slideIn.open(MyDrawer, { width: 'wide', height: 'full' });
\`\`\`

The drawer exposes itself as \`role="dialog"\` with \`aria-modal="true"\`, named by its \`title\`. \`title\` is required even when the \`header\` slot replaces the rendered header, because it is what names the drawer for assistive technology.

The body is deliberately tinted, so content sits on one or more \`RcDrawerCard\`s rather than directly on it. The body owns the gap between them, so stacking cards needs no spacing classes.`,
      },
    },
  },
  argTypes: {
    title: {
      control:     { type: 'text' },
      description: 'Rendered in the header, and used to give the close controls an accessible name.',
    },
    hideFooter: {
      control:     { type: 'boolean' },
      description: 'Hide the footer entirely. Use for drawers that are purely informational.',
    },
    loading: {
      control:     { type: 'boolean' },
      description: 'Render a spinner in place of the body, so every drawer that fetches waits the same way.',
    },
    actions: {
      control:     { type: 'object' },
      description: 'Footer buttons, rendered after the built-in Close. Each is `{ label, action, variant?, icon?, ariaLabel?, testid? }`.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RcDrawer>;

// RcDrawer fills its positioned ancestor, which is the slide-in panel in the
// real app. The stories supply a stand-in for it.
const panel = (drawer: string) => `<div style="position: relative; width: 480px; height: 420px; border: 1px solid var(--border);">
  ${ drawer }
</div>`;

export const Default: Story = {
  args:   { title: 'my-workload (Deployment) - Configuration' },
  render: (args) => ({
    components: { RcDrawer, RcDrawerCard },
    setup:      () => ({ args }),
    template:   panel(`<RcDrawer v-bind="args">
      <template #body>
        <RcDrawerCard>
          <p style="margin: 0;">Drawer content goes here, on a card.</p>
        </RcDrawerCard>
      </template>
    </RcDrawer>`),
  }),
};

export const StackedCards: Story = {
  args:   { title: 'my-extension' },
  render: (args) => ({
    components: { RcDrawer, RcDrawerCard },
    setup:      () => ({ args }),
    template:   panel(`<RcDrawer v-bind="args">
      <template #body>
        <RcDrawerCard>
          <p style="margin: 0;">One card per logical group.</p>
        </RcDrawerCard>
        <RcDrawerCard>
          <p style="margin: 0;">The body spaces them; the card carries no margin.</p>
        </RcDrawerCard>
      </template>
    </RcDrawer>`),
  }),
};

export const WithActions: Story = {
  args: {
    title:   'my-workload (Deployment) - Configuration',
    actions: [
      {
        label: 'Delete', variant: 'secondary', action: () => {}
      },
      { label: 'Edit Config', action: () => {} },
    ],
  },
  render: (args) => ({
    components: { RcDrawer, RcDrawerCard },
    setup:      () => ({ args }),
    template:   panel(`<RcDrawer v-bind="args">
      <template #body>
        <RcDrawerCard>
          <p style="margin: 0;">Footer buttons come from the actions array, so drawers do not hand-write them.</p>
        </RcDrawerCard>
      </template>
    </RcDrawer>`),
  }),
};

export const Loading: Story = {
  args:   { title: 'my-workload (Deployment) - Configuration', loading: true },
  render: (args) => ({
    components: { RcDrawer },
    setup:      () => ({ args }),
    template:   panel(`<RcDrawer v-bind="args" />`),
  }),
};

export const NothingToShow: Story = {
  args:   { title: 'Kubernetes Explain' },
  render: (args) => ({
    components: {
      RcDrawer, RcDrawerCard, RcDrawerMessage
    },
    setup:    () => ({ args }),
    template: panel(`<RcDrawer v-bind="args">
      <template #body>
        <RcDrawerCard>
          <RcDrawerMessage icon="icon-book">
            Select a resource to see its explanation
          </RcDrawerMessage>
        </RcDrawerCard>
      </template>
    </RcDrawer>`),
  }),
};

export const WithoutFooter: Story = {
  args:   { title: 'Node', hideFooter: true },
  render: (args) => ({
    components: { RcDrawer },
    setup:      () => ({ args }),
    template:   panel(`<RcDrawer v-bind="args">
      <template #body>
        <p style="margin: 0;">An informational drawer with nothing to act on.</p>
      </template>
    </RcDrawer>`),
  }),
};

export const RichTitle: Story = {
  args:   { title: 'fleet-default/my-app' },
  render: (args) => ({
    components: { RcDrawer },
    setup:      () => ({ args }),
    template:   panel(`<RcDrawer v-bind="args">
      <template #title>
        <i class="icon icon-repository" style="margin-right: 8px;" />
        <a href="#">fleet-default/my-app</a>
      </template>
      <template #body>
        <p style="margin: 0;">The title slot takes rich content. The title prop still names the close controls.</p>
      </template>
    </RcDrawer>`),
  }),
};

export const LongTitle: Story = {
  args:   { title: 'a-very-long-resource-name-that-keeps-going (ConfigMap) - Configuration' },
  render: (args) => ({
    components: { RcDrawer },
    setup:      () => ({ args }),
    template:   panel(`<RcDrawer v-bind="args">
      <template #body>
        <p style="margin: 0;">The header grows rather than letting the title spill over the body.</p>
      </template>
    </RcDrawer>`),
  }),
};
