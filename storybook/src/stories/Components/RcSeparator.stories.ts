import type { Meta, StoryObj } from '@storybook/vue3';
import { RcSeparator } from '@components/RcSeparator';
import type { RcSeparatorOrientation } from '@components/RcSeparator/types';

const meta: Meta<typeof RcSeparator> = {
  component:  RcSeparator,
  parameters: {
    docs: {
      description: {
        component: `A thin wrapper around \`<hr>\` that gets its accessibility semantics from props.

By default the separator is decorative: it renders \`role="none"\` so that screen readers skip over it, which is the correct treatment for separators that exist purely to break up content visually.

Set \`decorative\` to \`false\` when the separator conveys meaning (e.g. groups items within a menu or a listbox). When \`decorative\` is \`false\`, RcSeparator renders \`role="separator"\` along with an \`aria-orientation\`.

The component ships no visual styling for horizontal separators; consumers style them, typically with \`border-top: 1px solid var(--border)\`.`,
      },
    },
  },
  argTypes: {
    decorative: {
      control:     { type: 'boolean' },
      description: 'Purely cosmetic separator that is hidden from the accessibility tree. Defaults to `true`.',
    },
    orientation: {
      options:     ['horizontal', 'vertical'] as RcSeparatorOrientation[],
      control:     { type: 'select' },
      description: 'Orientation of the separator. Drives `aria-orientation` when the separator is not decorative.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RcSeparator>;

const decorativeTemplate = `<div style="display: flex; flex-direction: column; gap: 20px; width: 300px;">
  <p style="margin: 0;">Content above the separator</p>
  <RcSeparator v-bind="args" style="border-top: 1px solid var(--border);" />
  <p style="margin: 0;">Content below the separator</p>
</div>`;

export const Decorative: Story = {
  render: (args: any) => ({
    components: { RcSeparator },
    setup() {
      return { args };
    },
    template: decorativeTemplate,
  }),
  args:       { decorative: true, orientation: 'horizontal' },
  parameters: {
    docs: {
      description: { story: 'The default. Renders `role="none"` so the separator is not announced by screen readers.' },
      canvas:      { sourceState: 'shown' },
      source:      { code: decorativeTemplate },
    },
  },
};

const semanticTemplate = `<ul role="menu" style="list-style: none; margin: 0; padding: 0; width: 300px;">
  <li role="menuitem" style="padding: 8px 0;">First group item</li>
  <RcSeparator :decorative="false" style="border-top: 1px solid var(--border);" />
  <li role="menuitem" style="padding: 8px 0;">Second group item</li>
</ul>`;

export const Semantic: Story = {
  render: () => ({
    components: { RcSeparator },
    template:   semanticTemplate,
  }),
  parameters: {
    docs: {
      description: { story: 'A meaningful separator inside a menu. Renders `role="separator"` and `aria-orientation="horizontal"` so that the grouping is announced.' },
      canvas:      { sourceState: 'shown' },
      source:      { code: semanticTemplate },
    },
  },
};

const verticalTemplate = `<div style="display: flex; align-items: center; gap: 20px; height: 40px;">
  <span>Left</span>
  <RcSeparator :decorative="false" orientation="vertical" />
  <span>Right</span>
</div>`;

export const Vertical: Story = {
  render: () => ({
    components: { RcSeparator },
    template:   verticalTemplate,
  }),
  parameters: {
    docs: {
      description: { story: 'A vertical separator. The component supplies the geometry for this case, so no additional styling is required.' },
      canvas:      { sourceState: 'shown' },
      source:      { code: verticalTemplate },
    },
  },
};
