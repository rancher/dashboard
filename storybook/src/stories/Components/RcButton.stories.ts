import type { Meta, StoryObj } from '@storybook/vue3';
import { RcButton } from '@components/RcButton';
import { ButtonVariant, ButtonSize, ButtonColor, DeprecatedButtonVariant } from '@components/RcButton/types';
import { RcIconTypeToClass } from '@components/RcIcon/types';

const meta: Meta<typeof RcButton> = {
  component: RcButton,
  argTypes:  {
    variant: {
      options: ['solid', 'outline', 'link', 'ghost', 'primary', 'secondary', 'tertiary', 'multiAction'] as (ButtonVariant | DeprecatedButtonVariant)[],
      control: {
        type:   'select',
        labels: {
          primary:     'primary (deprecated, use solid)',
          secondary:   'secondary (deprecated, use outline)',
          tertiary:    'tertiary (deprecated)',
          multiAction: 'multiAction (deprecated)',
        }
      },
      description: 'Determines the shape of the button. Solid for main actions, outline for supporting actions, link for navigation and ghost for transparent buttons. The values primary, secondary, tertiary and multiAction are deprecated, see the Deprecated Variants story.'
    },
    color: {
      options:     ['primary', 'destructive'] as ButtonColor[],
      control:     { type: 'select' },
      description: 'Colours the button independently of its shape. Destructive marks an irreversible action.'
    },
    size: {
      options:     ['small', 'medium', 'large'] as ButtonSize[],
      control:     { type: 'select' },
      description: 'Determines the size of the button. Medium is the default size for most use cases.'
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
    variant:  'solid',
    color:    'primary',
    size:     'medium',
    disabled: false,
  },
};

export const AllVariants: Story = {
  render: () => ({
    components: { RcButton },
    setup() {
      const variants: ButtonVariant[] = ['solid', 'outline', 'link', 'ghost'];

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
        code: `<RcButton variant="solid">Solid</RcButton>
<RcButton variant="outline">Outline</RcButton>
<RcButton variant="link">Link</RcButton>
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
      const variants: ButtonVariant[] = ['solid', 'outline', 'link', 'ghost'];

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
        code: `<RcButton variant="solid" :disabled="true">Solid</RcButton>
<RcButton variant="outline" :disabled="true">Outline</RcButton>
<RcButton variant="link" :disabled="true">Link</RcButton>
<RcButton variant="ghost" :disabled="true">Ghost</RcButton>`,
        language: 'html',
      }
    }
  },
};

export const DeprecatedVariants: Story = {
  render: () => ({
    components: { RcButton },
    setup() {
      const deprecated: { variant: DeprecatedButtonVariant, replacement?: string, note: string }[] = [
        {
          variant: 'primary', replacement: '<RcButton variant="solid" color="primary">', note: 'A solid button in the primary colour.'
        },
        {
          variant: 'secondary', replacement: '<RcButton variant="outline" color="primary">', note: 'Only ever an outlined primary button.'
        },
        { variant: 'tertiary', note: 'No replacement yet. Still renders exactly as it always has.' },
        { variant: 'multiAction', note: 'No replacement yet. Still renders exactly as it always has.' },
      ];

      return { deprecated };
    },
    template: `<div style="max-width: 820px;">
      <div style="border-left: 3px solid #D42B3A; background: #FDF3F3; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; line-height: 1.5;">
        <strong>These values still work, but each one logs a console warning.</strong>
        Describe a button with <code>variant</code> for its shape and <code>color</code> for its palette.
      </div>
      <div v-for="item in deprecated" :key="item.variant" style="display: flex; align-items: flex-start; gap: 20px; padding: 14px 0; border-bottom: 1px solid #DCDEE7;">
        <div style="min-width: 150px;">
          <code style="font-size: 13px;">{{ item.variant }}</code>
          <div style="display: inline-block; margin-left: 6px; padding: 1px 6px; border-radius: 3px; background: #D42B3A; color: #FFF; font-size: 10px; font-weight: 700; letter-spacing: .04em; vertical-align: middle;">DEPRECATED</div>
        </div>
        <RcButton :variant="item.variant" size="medium">{{ item.variant }}</RcButton>
        <div style="flex: 1; font-size: 12px; line-height: 1.6;">
          <div>{{ item.note }}</div>
          <code v-if="item.replacement" style="font-size: 11px; opacity: .8;">{{ item.replacement }}</code>
        </div>
      </div>
    </div>`,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      description: { story: 'Variant values kept for compatibility. They render exactly as before and warn in the console, naming a replacement where one exists.' },
      source:      {
        code: `<!-- deprecated            replacement -->
<RcButton variant="primary">     <RcButton variant="solid" color="primary">
<RcButton variant="secondary">   <RcButton variant="outline" color="primary">
<RcButton variant="tertiary">    no replacement yet
<RcButton variant="multiAction"> no replacement yet`,
        language: 'html',
      }
    }
  },
};

export const AsRouterLink: Story = {
  render: () => ({
    components: { RcButton },
    setup() {
      const variants: ButtonVariant[] = ['solid', 'outline', 'link'];

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
