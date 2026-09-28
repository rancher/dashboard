import type { Meta, StoryObj } from '@storybook/vue3';
import { RcButtonSplit } from '@components/RcButtonSplit';
import { RcDropdownItem, RcDropdownSeparator } from '@components/RcDropdown';
import RcIcon from '@components/RcIcon/RcIcon.vue';
import { ButtonVariant, ButtonSize } from '@components/RcButton/types';
import { RcIconTypeToClass } from '@components/RcIcon/types';

const meta: Meta<typeof RcButtonSplit> = {
  component:  RcButtonSplit,
  parameters: {
    layout: 'centered',
    docs:   {
      description: {
        component: `RcButtonSplit surfaces a primary action and attaches a 
          dropdown of related alternatives, reducing visual clutter while 
          keeping expert options one click away. Use when one action is clearly 
          the default and additional options are variations of that same task.`
      }
    }
  },
  argTypes: {
    disabled: {
      control:     { type: 'boolean' },
      description: 'Disables both the action button and the dropdown trigger.',
    },
    variant: {
      options:     ['primary', 'secondary', 'tertiary'] as ButtonVariant[],
      control:     { type: 'select' },
      description: 'Visual style applied to both the action button and the dropdown trigger.',
    },
    size: {
      options:     ['small', 'medium', 'large'] as ButtonSize[],
      control:     { type: 'select' },
      description: 'Size applied to both the action button and the dropdown trigger.',
    },
    ariaLabel: {
      control:     { type: 'text' },
      description: 'Accessible label for the primary action button.',
    },
    ariaLabelTrigger: {
      control:     { type: 'text' },
      description: 'Accessible label for the dropdown trigger button. Recommended for all uses because the trigger has no visible text.',
    },
    ariaLabelDropdown: {
      control:     { type: 'text' },
      description: 'Accessible label for the dropdown menu container (role="menu").',
    },
    placement: {
      options:     ['bottom-end', 'bottom-start', 'top-end', 'top-start'],
      control:     { type: 'select' },
      description: 'Placement of the dropdown menu relative to the trigger.',
    },
    distance: {
      control:     { type: 'number' },
      description: 'Controls the distance between the dropdown menu and its trigger, in pixels.',
    },
    items: {
      control:     { type: 'object' },
      description: 'Convenience prop for populating dropdown items. Each object requires an `id` (emitted as the select event payload) and a `label` (display text).',
    },
    leftIcon: {
      options:     ['', ...Object.keys(RcIconTypeToClass)],
      control:     { type: 'select' },
      description: 'Icon to display on the left side of the action button text.',
    },
    rightIcon: {
      options:     ['', ...Object.keys(RcIconTypeToClass)],
      control:     { type: 'select' },
      description: 'Icon to display on the right side of the action button text.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RcButtonSplit>;

const dropdownDecorator = () => ({ template: '<div style="min-width: 300px; padding: 20px; display: flex; justify-content: center;"><story /></div>' });

export const Default: Story = {
  decorators: [dropdownDecorator],
  render:     (args: any) => ({
    components: {
      RcButtonSplit,
      RcDropdownItem,
      RcDropdownSeparator,
    },
    setup() {
      const onClick = () => console.log('Primary action clicked'); // eslint-disable-line no-console

      return { args, onClick };
    },
    template: `
      <RcButtonSplit v-bind="args" @click="onClick">
        Save
        <template #dropdownCollection>
          <RcDropdownItem @click="() => console.log('Save as Draft')">Save as Draft</RcDropdownItem>
          <RcDropdownItem @click="() => console.log('Save as Template')">Save as Template</RcDropdownItem>
          <RcDropdownSeparator />
          <RcDropdownItem @click="() => console.log('Discard')">Discard Changes</RcDropdownItem>
        </template>
      </RcButtonSplit>
    `,
  }),
  args: {
    variant: 'primary',
    size:    'medium',
  },
  parameters: { docs: { story: { height: '250px' } } },
};

export const AllVariants: Story = {
  render: (args: any) => ({
    components: {
      RcButtonSplit,
      RcDropdownItem,
    },
    setup() {
      const variants: ButtonVariant[] = ['primary', 'secondary', 'tertiary'];

      return { args, variants };
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 20px; max-width: 800px;">
        <div v-for="variant in variants" :key="variant" style="display: flex; align-items: center; gap: 20px;">
          <div style="min-width: 120px; font-weight: bold;">{{ variant }}</div>
          <RcButtonSplit :variant="variant" size="medium">
            {{ variant }}
            <template #dropdownCollection>
              <RcDropdownItem>Option 1</RcDropdownItem>
              <RcDropdownItem>Option 2</RcDropdownItem>
            </template>
          </RcButtonSplit>
        </div>
      </div>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'none' } },
  },
};

export const AllSizes: Story = {
  render: (args: any) => ({
    components: {
      RcButtonSplit,
      RcDropdownItem,
    },
    setup() {
      const sizes: ButtonSize[] = ['small', 'medium', 'large'];

      return { args, sizes };
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 20px; max-width: 800px;">
        <div v-for="size in sizes" :key="size" style="display: flex; align-items: center; gap: 20px;">
          <div style="min-width: 120px; font-weight: bold;">{{ size }}</div>
          <RcButtonSplit variant="primary" :size="size">
            {{ size }}
            <template #dropdownCollection>
              <RcDropdownItem>Option 1</RcDropdownItem>
              <RcDropdownItem>Option 2</RcDropdownItem>
            </template>
          </RcButtonSplit>
        </div>
      </div>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'none' } },
  },
};

export const WithItems: Story = {
  decorators: [dropdownDecorator],
  render:     (args: any) => ({
    components: { RcButtonSplit },
    setup() {
      const onSelect = (id: string) => console.log('Selected item key:', id); // eslint-disable-line no-console

      return { args, onSelect };
    },
    template: `
      <RcButtonSplit v-bind="args" @select="onSelect">
        Save
      </RcButtonSplit>
    `,
  }),
  args: {
    variant: 'primary',
    size:    'medium',
    items:   [
      { id: 'draft', label: 'Save as Draft' },
      { id: 'template', label: 'Save as Template' },
      { id: 'discard', label: 'Discard Changes' },
    ],
  },
  parameters: { docs: { story: { height: '250px' } } },
};

export const WithIcons: Story = {
  decorators: [dropdownDecorator],
  render:     (args: any) => ({
    components: {
      RcButtonSplit,
      RcDropdownItem,
    },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: center;">
        <RcButtonSplit variant="primary" size="medium" left-icon="plus">
          Create
          <template #dropdownCollection>
            <RcDropdownItem>Create from Template</RcDropdownItem>
            <RcDropdownItem>Import</RcDropdownItem>
          </template>
        </RcButtonSplit>

        <RcButtonSplit variant="secondary" size="medium" left-icon="download">
          Download
          <template #dropdownCollection>
            <RcDropdownItem>Download v1</RcDropdownItem>
            <RcDropdownItem>Download v2</RcDropdownItem>
          </template>
        </RcButtonSplit>

        <RcButtonSplit variant="tertiary" size="medium" right-icon="chevron-right">
          Next Step
          <template #dropdownCollection>
            <RcDropdownItem>Skip to End</RcDropdownItem>
          </template>
        </RcButtonSplit>

        <RcButtonSplit variant="primary" size="medium" left-icon="upload" right-icon="chevron-right">
          Deploy
          <template #dropdownCollection>
            <RcDropdownItem>Deploy to Staging</RcDropdownItem>
            <RcDropdownItem>Deploy to Production</RcDropdownItem>
          </template>
        </RcButtonSplit>
      </div>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas: { sourceState: 'none' },
      story:  { height: '250px' },
    },
  },
};

export const Disabled: Story = {
  render: (args: any) => ({
    components: {
      RcButtonSplit,
      RcDropdownItem,
    },
    setup() {
      const variants: ButtonVariant[] = ['primary', 'secondary', 'tertiary'];

      return { args, variants };
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 20px; max-width: 800px;">
        <div v-for="variant in variants" :key="variant" style="display: flex; align-items: center; gap: 20px;">
          <div style="min-width: 120px; font-weight: bold;">{{ variant }}</div>
          <RcButtonSplit :variant="variant" size="medium" disabled>
            {{ variant }}
            <template #dropdownCollection>
              <RcDropdownItem>Option 1</RcDropdownItem>
              <RcDropdownItem>Option 2</RcDropdownItem>
            </template>
          </RcButtonSplit>
        </div>
      </div>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'none' } },
  },
};

export const Accessibility: Story = {
  decorators: [dropdownDecorator],
  render:     (args: any) => ({
    components: {
      RcButtonSplit,
      RcDropdownItem,
    },
    setup() {
      return { args };
    },
    template: `
      <RcButtonSplit v-bind="args">
        Save
        <template #dropdownCollection>
          <RcDropdownItem>Save as Draft</RcDropdownItem>
          <RcDropdownItem>Save as Template</RcDropdownItem>
        </template>
      </RcButtonSplit>
    `,
  }),
  args: {
    variant:           'primary',
    size:              'medium',
    ariaLabel:         'Save document',
    ariaLabelTrigger:  'More save options',
    ariaLabelDropdown: 'Save actions',
  },
  parameters: {
    docs: {
      description: {
        story: `Demonstrates all three aria label props. \`ariaLabel\` labels the primary
          action button, \`ariaLabelTrigger\` labels the icon-only chevron trigger
          (always recommended since it has no visible text), and \`ariaLabelDropdown\`
          labels the \`role="menu"\` container.`,
      },
      story: { height: '250px' },
    },
  },
};

export const WithSlots: Story = {
  decorators: [dropdownDecorator],
  render:     (args: any) => ({
    components: {
      RcButtonSplit,
      RcDropdownItem,
      RcIcon,
    },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: center;">
        <RcButtonSplit variant="primary" size="medium">
          <template #before>
            <RcIcon type="plus" size="inherit" />
          </template>
          Create
          <template #dropdownCollection>
            <RcDropdownItem>Create from Template</RcDropdownItem>
            <RcDropdownItem>Import</RcDropdownItem>
          </template>
        </RcButtonSplit>

        <RcButtonSplit variant="secondary" size="medium">
          <template #before>
            <RcIcon type="download" size="inherit" />
          </template>
          Download
          <template #after>
            <span style="font-size: 10px; opacity: 0.7;">v2</span>
          </template>
          <template #dropdownCollection>
            <RcDropdownItem>Download v1</RcDropdownItem>
            <RcDropdownItem>Download v2</RcDropdownItem>
          </template>
        </RcButtonSplit>
      </div>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas: { sourceState: 'none' },
      story:  { height: '250px' },
    },
  },
};
