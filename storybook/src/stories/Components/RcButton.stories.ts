import type { Meta, StoryObj } from '@storybook/vue3';
import { RcButton } from '@components/RcButton';
import { ButtonVariant, ButtonSize } from '@components/RcButton/types';
import { RcIconTypeToClass } from '@components/RcIcon/types';

const meta: Meta<typeof RcButton> = {
  component: RcButton,
  argTypes:  {
    variant: {
      options:     ['primary', 'secondary', 'tertiary', 'link', 'multiAction', 'ghost'] as ButtonVariant[],
      control:     { type: 'select' },
      description: 'Determines the visual style and purpose of the button. Primary for main actions, secondary for supporting actions, tertiary for less prominent actions, link for navigation, multiAction for dropdown buttons, and ghost for transparent buttons.'
    },
    size: {
      options:     ['small', 'medium', 'large', 'inherit'],
      control:     { type: 'select' },
      description: 'Determines the size of the button. Medium is the default size for most use cases. `inherit` takes the size of the surrounding text, and needs the `ghost` or `link` variant. Other variants fall back to medium.'
    },
    leftIcon: {
      options:     ['', ...Object.keys(RcIconTypeToClass)],
      control:     { type: 'select' },
      description: 'Icon to display on the left side of the button text.'
    },
    rightIcon: {
      options:     ['', ...Object.keys(RcIconTypeToClass)],
      control:     { type: 'select' },
      description: 'Icon to display on the right side of the button text.'
    },
    disabled: {
      control:     { type: 'boolean' },
      description: 'When true, the button is visually muted and non-interactive.'
    },
    to: {
      control:     { type: 'text' },
      description: 'When provided, renders the button as a RouterLink for client-side navigation instead of a plain button element.'
    },
  }
};

export default meta;
type Story = StoryObj<typeof RcButton>;

export const Default: Story = {
  render: (args: any) => ({
    components: { RcButton },
    setup() {
      return { args };
    },
    template: '<RcButton v-bind="args">Button Text</RcButton>',
  }),
  args: {
    variant:  'primary',
    size:     'medium',
    disabled: false,
  },
};

export const AllVariants: Story = {
  render: () => ({
    components: { RcButton },
    setup() {
      const variants: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'link', 'multiAction', 'ghost'];

      return { variants };
    },
    template: `<div style="display: flex; flex-direction: column; gap: 20px; max-width: 800px;">
      <div v-for="variant in variants" :key="variant" style="display: flex; align-items: center; gap: 20px;">
        <div style="min-width: 120px; font-weight: bold;">{{ variant }}</div>
        <RcButton :variant="variant" size="medium">{{ variant }}</RcButton>
      </div>
    </div>`,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      source: {
        code: `<RcButton variant="primary">Primary</RcButton>
<RcButton variant="secondary">Secondary</RcButton>
<RcButton variant="tertiary">Tertiary</RcButton>
<RcButton variant="link">Link</RcButton>
<RcButton variant="multiAction">MultiAction</RcButton>
<RcButton variant="ghost">Ghost</RcButton>`,
        language: 'html',
      }
    }
  },
};

export const DisabledVariants: Story = {
  render: () => ({
    components: { RcButton },
    setup() {
      const variants: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'link', 'multiAction', 'ghost'];

      return { variants };
    },
    template: `<div style="display: flex; flex-direction: column; gap: 20px; max-width: 800px;">
      <div v-for="variant in variants" :key="variant" style="display: flex; align-items: center; gap: 20px;">
        <div style="min-width: 120px; font-weight: bold;">{{ variant }}</div>
        <RcButton :variant="variant" size="medium" :disabled="true">{{ variant }}</RcButton>
      </div>
    </div>`,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      source: {
        code: `<RcButton variant="primary" :disabled="true">Primary</RcButton>
<RcButton variant="secondary" :disabled="true">Secondary</RcButton>
<RcButton variant="tertiary" :disabled="true">Tertiary</RcButton>
<RcButton variant="link" :disabled="true">Link</RcButton>
<RcButton variant="multiAction" :disabled="true">MultiAction</RcButton>
<RcButton variant="ghost" :disabled="true">Ghost</RcButton>`,
        language: 'html',
      }
    }
  },
};

export const AsRouterLink: Story = {
  render: () => ({
    components: { RcButton },
    setup() {
      const variants: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'link'];

      return { variants };
    },
    template: `<div style="display: flex; flex-direction: column; gap: 20px; max-width: 800px;">
      <div v-for="variant in variants" :key="variant" style="display: flex; align-items: center; gap: 20px;">
        <div style="min-width: 120px; font-weight: bold;">{{ variant }}</div>
        <RcButton :variant="variant" size="medium" to="/">{{ variant }}</RcButton>
      </div>
    </div>`,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      description: {
        story: `When the \`to\` prop is provided, RcButton renders as a \`<a>\` tag (via Vue Router's \`<RouterLink>\`) instead of a \`<button>\`.
This enables client-side navigation while preserving all button styling.
The rendered HTML changes from \`<button class="rc-button btn ...">\` to \`<a class="rc-button btn ..." href="/path">\`,
which improves accessibility and allows standard link behaviors like ctrl+click to open in a new tab.`
      },
      source: {
        code: `<!-- String path: renders as <a href="/resources" class="rc-button btn variant-primary ..."> -->
<RcButton variant="primary" to="/resources">Resources</RcButton>

<!-- Route object: renders as <a href="/c/local/..." class="rc-button btn variant-secondary ..."> -->
<RcButton variant="secondary" :to="{ name: 'c-cluster-resource', params: { cluster: 'local' } }">Cluster</RcButton>

<!-- Without to: renders as <button class="rc-button btn variant-primary ..."> -->
<RcButton variant="primary" @click="doAction">Action</RcButton>`,
        language: 'html',
      }
    }
  },
};

export const AllSizes: Story = {
  render: () => ({
    components: { RcButton },
    setup() {
      const sizes: ButtonSize[] = ['small', 'medium', 'large'];

      return { sizes };
    },
    template: `<div style="display: flex; flex-direction: column; gap: 20px; max-width: 800px;">
      <div v-for="size in sizes" :key="size" style="display: flex; align-items: center; gap: 20px;">
        <div style="min-width: 120px; font-weight: bold;">{{ size }}</div>
        <RcButton variant="primary" :size="size">{{ size }}</RcButton>
      </div>
    </div>`,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      source: {
        code: `<RcButton variant="primary" size="small">Small</RcButton>
<RcButton variant="primary" size="medium">Medium</RcButton>
<RcButton variant="primary" size="large">Large</RcButton>`,
        language: 'html',
      }
    }
  },
};

export const WithIcons: Story = {
  render: () => ({
    components: { RcButton },
    template:   `<div style="display: flex; flex-wrap: wrap; gap: 20px;">
      <RcButton variant="primary" left-icon="plus">Add Item</RcButton>
      <RcButton variant="secondary" left-icon="search">Search</RcButton>
      <RcButton variant="tertiary" right-icon="chevronDown">Dropdown</RcButton>
      <RcButton variant="primary" left-icon="download" right-icon="chevronRight">Download</RcButton>
      <RcButton variant="ghost" left-icon="edit">Edit</RcButton>
    </div>`,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      source: {
        code: `<RcButton variant="primary" left-icon="plus">Add Item</RcButton>
<RcButton variant="secondary" left-icon="search">Search</RcButton>
<RcButton variant="tertiary" right-icon="chevronDown">Dropdown</RcButton>
<RcButton variant="primary" left-icon="download" right-icon="chevronRight">Download</RcButton>
<RcButton variant="ghost" left-icon="edit">Edit</RcButton>`,
        language: 'html',
      }
    }
  },
};

export const InheritSize: Story = {
  render: () => ({
    components: { RcButton },
    setup() {
      return {
        lines: [
          { label: '10px', style: 'font-size: 10px; line-height: 15px; font-weight: 700;' },
          { label: '12px', style: 'font-size: 12px; line-height: 18px;' },
          { label: '14px', style: 'font-size: 14px; line-height: 21px;' },
          { label: '20px', style: 'font-size: 20px; line-height: 28px;' },
        ],
      };
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <p v-for="line in lines" :key="line.label" :style="line.style + ' margin: 0; color: var(--body-text);'">
          {{ line.label }} text with an inline
          <RcButton variant="link" size="inherit">link button</RcButton>
          and a ghost icon button
          <RcButton variant="ghost" size="inherit" aria-label="Copy" left-icon="copy" />
          on the same line.
        </p>
      </div>`,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      source: {
        code: `<RcButton variant="link" size="inherit" @click="reset">Reset</RcButton>
<RcButton variant="ghost" size="inherit" aria-label="Copy" left-icon="copy" />`,
        language: 'html',
      }
    }
  },
};
