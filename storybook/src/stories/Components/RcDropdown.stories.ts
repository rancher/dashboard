import type { Meta, StoryObj } from '@storybook/vue3';
import {
  RcDropdown,
  RcDropdownTrigger,
  RcDropdownItem,
  RcDropdownItemCheckbox,
  RcDropdownItemSelect,
  RcDropdownSeparator,
  RcDropdownMenu,
} from '@components/RcDropdown';
import { ButtonVariant, ButtonSize } from '@components/RcButton/types';

const meta: Meta<typeof RcDropdown> = {
  component:  RcDropdown,
  parameters: {
    layout: 'centered',
    docs:   {
      description: {
        component: `RcDropdown offers a list of choices to the user, such as a set of
          actions or filters. It is opened by activating an \`RcDropdownTrigger\` placed
          in its default slot, and renders its menu content (\`RcDropdownItem\`,
          \`RcDropdownItemCheckbox\`, \`RcDropdownItemSelect\`, \`RcDropdownSeparator\`)
          in the \`dropdownCollection\` slot. Keyboard navigation (arrow keys, escape,
          tab) and focus management are handled automatically.`
      }
    }
  },
  argTypes: {
    ariaLabel: {
      control:     { type: 'text' },
      description: 'Accessible label for the dropdown menu container (role="menu"). Falls back to "Dropdown Menu" when not provided.',
    },
    placement: {
      options:     ['bottom-end', 'bottom-start', 'top-end', 'top-start'],
      control:     { type: 'select' },
      description: 'Placement of the dropdown menu relative to the trigger.',
    },
    distance: {
      control:     { type: 'number' },
      description: 'Distance between the dropdown menu and its trigger, in pixels.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RcDropdown>;

const dropdownDecorator = () => ({ template: '<div style="min-width: 300px; padding: 20px; display: flex; justify-content: center;"><story /></div>' });

export const Default: Story = {
  decorators: [dropdownDecorator],
  render:     (args: any) => ({
    components: {
      RcDropdown,
      RcDropdownTrigger,
      RcDropdownItem,
      RcDropdownSeparator,
    },
    setup() {
      return { args };
    },
    template: `
      <RcDropdown v-bind="args">
        <RcDropdownTrigger>
          Actions
        </RcDropdownTrigger>
        <template #dropdownCollection>
          <RcDropdownItem @click="() => console.log('Action 1')">Action 1</RcDropdownItem>
          <RcDropdownItem @click="() => console.log('Action 2')">Action 2</RcDropdownItem>
          <RcDropdownSeparator />
          <RcDropdownItem disabled>Disabled Action</RcDropdownItem>
        </template>
      </RcDropdown>
    `,
  }),
  args:       { placement: 'bottom-end' },
  parameters: { docs: { story: { height: '250px' } } },
};

export const IconOnlyTrigger: Story = {
  decorators: [dropdownDecorator],
  render:     () => ({
    components: {
      RcDropdown,
      RcDropdownTrigger,
      RcDropdownItem,
      RcDropdownSeparator,
    },
    template: `
      <RcDropdown aria-label="Row actions">
        <RcDropdownTrigger tertiary aria-label="Open row actions">
          <i class="icon icon-actions" />
        </RcDropdownTrigger>
        <template #dropdownCollection>
          <RcDropdownItem>Edit</RcDropdownItem>
          <RcDropdownItem>Clone</RcDropdownItem>
          <RcDropdownSeparator />
          <RcDropdownItem>Delete</RcDropdownItem>
        </template>
      </RcDropdown>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas:      { sourceState: 'none' },
      story:       { height: '250px' },
      description: { story: 'A common pattern: an icon-only trigger (e.g. a kebab menu) acting as an action menu for a table row or card. Always provide an `aria-label` on the trigger since it has no visible text.' },
    },
  },
};

export const WithCheckboxAndSelectItems: Story = {
  decorators: [dropdownDecorator],
  render:     () => ({
    components: {
      RcDropdown,
      RcDropdownTrigger,
      RcDropdownItemCheckbox,
      RcDropdownItemSelect,
      RcDropdownSeparator,
    },
    setup() {
      const checked = false;
      const sortOptions = [{ label: 'Name', value: 'name' }, { label: 'Date', value: 'date' }];

      return { checked, sortOptions };
    },
    template: `
      <RcDropdown aria-label="Filter and sort">
        <RcDropdownTrigger>
          Filter
        </RcDropdownTrigger>
        <template #dropdownCollection>
          <RcDropdownItemCheckbox :model-value="checked" @click="(v) => console.log('Toggled:', v)">
            Show only running
          </RcDropdownItemCheckbox>
          <RcDropdownSeparator />
          <RcDropdownItemSelect
            label="Sort by"
            model-value="name"
            :options="sortOptions"
            @select="(v) => console.log('Selected:', v)"
          />
        </template>
      </RcDropdown>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas:      { sourceState: 'none' },
      story:       { height: '320px' },
      description: { story: '`RcDropdownItemCheckbox` and `RcDropdownItemSelect` allow menu items to carry interactive form controls (a checkbox and a `LabeledSelect`) while still participating in the dropdown\'s keyboard navigation and focus management.' },
    },
  },
};

export const Placements: Story = {
  render: () => ({
    components: {
      RcDropdown,
      RcDropdownTrigger,
      RcDropdownItem,
    },
    setup() {
      const placements = ['bottom-start', 'bottom-end', 'top-start', 'top-end'];

      return { placements };
    },
    template: `
      <div style="display: flex; gap: 60px; padding: 80px 40px;">
        <div v-for="placement in placements" :key="placement" style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
          <div style="font-weight: bold;">{{ placement }}</div>
          <RcDropdown :placement="placement">
            <RcDropdownTrigger>Menu</RcDropdownTrigger>
            <template #dropdownCollection>
              <RcDropdownItem>Option 1</RcDropdownItem>
              <RcDropdownItem>Option 2</RcDropdownItem>
            </template>
          </RcDropdown>
        </div>
      </div>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas: { sourceState: 'none' },
      story:  { height: '350px' },
    },
  },
};

export const RcDropdownMenuComposed: Story = {
  decorators: [dropdownDecorator],
  render:     (args: any) => ({
    components: { RcDropdownMenu },
    setup() {
      return { args };
    },
    template: '<RcDropdownMenu v-bind="args" @select="(e, option) => console.log(\'Selected:\', option.label)" />',
  }),
  args: {
    buttonVariant:     'tertiary' as ButtonVariant,
    buttonSize:        'medium' as ButtonSize,
    buttonAriaLabel:   'Open actions menu',
    dropdownAriaLabel: 'Actions',
    options:           [
      {
        label: 'Edit', icon: 'icon-edit', enabled: true
      },
      {
        label: 'Clone', icon: 'icon-copy', enabled: true
      },
      { divider: true, enabled: true },
      {
        label: 'Delete', icon: 'icon-trash', enabled: true
      },
    ],
  },
  parameters: {
    docs: {
      story:       { height: '250px' },
      description: { story: '`RcDropdownMenu` is a higher-level component that composes `RcDropdown`, `RcDropdownTrigger`, `RcDropdownItem`, and `RcDropdownSeparator` from a declarative `options` array. It is commonly used for action/kebab menus driven by data (e.g. resource list bulk actions).' },
    },
  },
};
