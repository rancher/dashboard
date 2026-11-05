import type { Meta, StoryObj } from '@storybook/vue3';
import { computed, ref } from 'vue';
import {
  RcDropdown,
  RcDropdownTrigger,
  RcDropdownGroup,
  RcDropdownItem,
  RcDropdownItemCheckbox,
  RcDropdownItemRadio,
  RcDropdownItemSelect,
  RcDropdownSeparator,
  RcDropdownSubmenu,
  RcDropdownMenu,
} from '@components/RcDropdown';
import { RcButton } from '@components/RcButton';
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
          \`RcDropdownItemCheckbox\`, \`RcDropdownItemRadio\`, \`RcDropdownItemSelect\`,
          \`RcDropdownSubmenu\`, \`RcDropdownSeparator\`) in the \`dropdownCollection\`
          slot. Keyboard navigation (arrow keys, escape, tab) and focus management are
          handled automatically.`
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
      const checked = ref(false);
      const sortBy = ref('name');
      const sortOptions = [{ label: 'Name', value: 'name' }, { label: 'Date', value: 'date' }];

      return {
        checked, sortBy, sortOptions
      };
    },
    template: `
      <RcDropdown aria-label="Filter and sort">
        <RcDropdownTrigger>
          Filter
        </RcDropdownTrigger>
        <template #dropdownCollection>
          <RcDropdownItemCheckbox :model-value="checked" @click="checked = $event">
            Show only running
          </RcDropdownItemCheckbox>
          <RcDropdownSeparator />
          <RcDropdownItemSelect
            label="Sort by"
            :model-value="sortBy"
            :options="sortOptions"
            @select="sortBy = $event"
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

export const WithGroups: Story = {
  decorators: [dropdownDecorator],
  render:     () => ({
    components: {
      RcDropdown,
      RcDropdownTrigger,
      RcDropdownGroup,
      RcDropdownItem,
      RcDropdownSeparator,
    },
    template: `
      <RcDropdown aria-label="Choose an authentication provider">
        <RcDropdownTrigger>
          Choose another authentication provider
        </RcDropdownTrigger>
        <template #dropdownCollection>
          <RcDropdownGroup label="Choose how to sign in">
            <RcDropdownItem>Okta — Corporate SSO</RcDropdownItem>
            <RcDropdownItem>GitHub — Community</RcDropdownItem>
          </RcDropdownGroup>
          <RcDropdownSeparator />
          <RcDropdownGroup label="Other">
            <RcDropdownItem>Local account</RcDropdownItem>
          </RcDropdownGroup>
        </template>
      </RcDropdown>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas:      { sourceState: 'none' },
      story:       { height: '340px' },
      description: { story: '`RcDropdownGroup` labels a subset of the items in a menu. `RcDropdown`\'s `ariaLabel` names the menu as a whole; a group names the choices within it, which keeps menus offering several kinds of choice comprehensible. The group renders `role="group"` with `aria-labelledby` pointing at its visible heading, and nested items still participate in the dropdown\'s keyboard navigation.' },
    },
  },
};

export const CheckboxIndicators: Story = {
  render: () => ({
    components: {
      RcDropdown,
      RcDropdownTrigger,
      RcDropdownItemCheckbox,
    },
    setup() {
      const filters = ref([
        {
          id: 'running', label: 'Running', checked: true
        },
        {
          id: 'pending', label: 'Pending', checked: false
        },
        {
          id: 'failed', label: 'Failed', checked: false
        },
      ]);
      const columns = ref([
        {
          id: 'namespace', label: 'Namespace', icon: 'icon-folder', checked: true
        },
        {
          id: 'node', label: 'Node', icon: 'icon-storage', checked: true
        },
        {
          id: 'age', label: 'Age', icon: 'icon-history', checked: false
        },
      ]);

      return { filters, columns };
    },
    template: `
      <div style="display: flex; gap: 120px; padding: 20px 40px;">
        <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
          <div style="font-weight: bold;">indicator="checkbox"</div>
          <RcDropdown aria-label="Filter by state">
            <RcDropdownTrigger>Filter</RcDropdownTrigger>
            <template #dropdownCollection>
              <RcDropdownItemCheckbox v-for="filter in filters" :key="filter.id" v-model="filter.checked">
                {{ filter.label }}
              </RcDropdownItemCheckbox>
            </template>
          </RcDropdown>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
          <div style="font-weight: bold;">indicator="checkmark"</div>
          <RcDropdown aria-label="Columns">
            <RcDropdownTrigger>Columns</RcDropdownTrigger>
            <template #dropdownCollection>
              <RcDropdownItemCheckbox
                v-for="column in columns"
                :key="column.id"
                v-model="column.checked"
                indicator="checkmark"
              >
                <template #before>
                  <i :class="['icon', column.icon]" aria-hidden="true" />
                </template>
                {{ column.label }}
              </RcDropdownItemCheckbox>
            </template>
          </RcDropdown>
        </div>
      </div>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas:      { sourceState: 'none' },
      story:       { height: '280px' },
      description: { story: '`RcDropdownItemCheckbox` draws a checkbox by default. With `indicator="checkmark"` it marks a checked item with a checkmark at its end instead, for a list of things shown and hidden, and its `before` slot holds anything leading the label. Either way the menu stays open for the next item.' },
    },
  },
};

export const RadioItems: Story = {
  decorators: [dropdownDecorator],
  render:     () => ({
    components: {
      RcDropdown,
      RcDropdownTrigger,
      RcDropdownItemRadio,
    },
    setup() {
      const densities = [
        { id: 'compact', label: 'Compact' },
        { id: 'comfortable', label: 'Comfortable' },
        { id: 'spacious', label: 'Spacious' },
      ];
      const density = ref('comfortable');

      return { densities, density };
    },
    template: `
      <RcDropdown aria-label="Density">
        <RcDropdownTrigger>Density</RcDropdownTrigger>
        <template #dropdownCollection>
          <RcDropdownItemRadio
            v-for="option in densities"
            :key="option.id"
            :checked="option.id === density"
            @click="density = option.id"
          >
            {{ option.label }}
          </RcDropdownItemRadio>
        </template>
      </RcDropdown>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas:      { sourceState: 'none' },
      story:       { height: '250px' },
      description: { story: '`RcDropdownItemRadio` is one choice of several. The chosen one is `checked` and marked with a checkmark, and the menu stays open so it shows the choice made. When the menu holds other items as well, wrap the radios in an element with `role="group"` and an `aria-label`.' },
    },
  },
};

export const ActsOnCheckableItems: Story = {
  decorators: [dropdownDecorator],
  render:     () => ({
    components: {
      RcDropdown,
      RcDropdownTrigger,
      RcDropdownItem,
      RcDropdownItemCheckbox,
      RcDropdownSeparator,
    },
    setup() {
      const defaults = ['name', 'state'];
      const columns = ref([
        { id: 'name', label: 'Name' },
        { id: 'state', label: 'State' },
        { id: 'node', label: 'Node' },
        { id: 'age', label: 'Age' },
      ].map((column) => ({ ...column, checked: defaults.includes(column.id) })));
      const announcement = ref('');

      const selectAll = () => {
        columns.value.forEach((column) => {
          column.checked = true;
        });
        announcement.value = `All ${ columns.value.length } columns shown`;
      };

      const reset = () => {
        columns.value.forEach((column) => {
          column.checked = defaults.includes(column.id);
        });
        announcement.value = 'Columns reset';
      };

      return {
        columns, announcement, selectAll, reset
      };
    },
    template: `
      <div>
        <RcDropdown aria-label="Columns">
          <RcDropdownTrigger>Columns</RcDropdownTrigger>
          <template #dropdownCollection>
            <div role="group" aria-label="Shown columns">
              <RcDropdownItemCheckbox
                v-for="column in columns"
                :key="column.id"
                v-model="column.checked"
                indicator="checkmark"
              >
                {{ column.label }}
              </RcDropdownItemCheckbox>
            </div>
            <RcDropdownSeparator />
            <RcDropdownItem acts-on-checkable-items @click="selectAll">Select All</RcDropdownItem>
            <RcDropdownItem acts-on-checkable-items @click="reset">Reset</RcDropdownItem>
          </template>
        </RcDropdown>
        <div class="sr-only" role="status" aria-live="polite">{{ announcement }}</div>
      </div>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas:      { sourceState: 'none' },
      story:       { height: '340px' },
      description: { story: 'An `RcDropdownItem` closes the menu when it is activated. With `acts-on-checkable-items` it is a command for the checkbox or radio items beside it, such as Select All or Reset, and the menu stays open so their new state shows. The focus stays on the command, so say what changed in an `aria-live` region for screen reader users.' },
    },
  },
};

export const Submenus: Story = {
  render: () => ({
    components: {
      RcDropdown,
      RcDropdownTrigger,
      RcDropdownItem,
      RcDropdownItemRadio,
      RcDropdownSeparator,
      RcDropdownSubmenu,
    },
    setup() {
      const sides = ['right', 'left'];
      const groupOptions = [
        { id: 'none', label: 'None' },
        { id: 'namespace', label: 'Namespace' },
        { id: 'node', label: 'Node' },
      ];
      const groupBy = ref('namespace');
      const groupLabel = computed(() => groupOptions.find((option) => option.id === groupBy.value)?.label);

      return {
        sides, groupOptions, groupBy, groupLabel
      };
    },
    template: `
      <div style="display: flex; gap: 100px; padding: 20px 240px 20px 20px;">
        <div v-for="side in sides" :key="side" style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
          <div style="font-weight: bold;">side="{{ side }}"</div>
          <RcDropdown aria-label="View" placement="bottom-start">
            <RcDropdownTrigger>View</RcDropdownTrigger>
            <template #dropdownCollection>
              <RcDropdownSubmenu :side="side">
                Group By
                <template #after>{{ groupLabel }}</template>
                <template #submenu>
                  <RcDropdownItemRadio
                    v-for="option in groupOptions"
                    :key="option.id"
                    :checked="option.id === groupBy"
                    @click="groupBy = option.id"
                  >
                    {{ option.label }}
                  </RcDropdownItemRadio>
                </template>
              </RcDropdownSubmenu>
              <RcDropdownSubmenu :side="side">
                Export As
                <template #submenu>
                  <RcDropdownItem>CSV</RcDropdownItem>
                  <RcDropdownItem>JSON</RcDropdownItem>
                  <RcDropdownItem>YAML</RcDropdownItem>
                </template>
              </RcDropdownSubmenu>
              <RcDropdownSeparator />
              <RcDropdownItem>Reset View</RcDropdownItem>
            </template>
          </RcDropdown>
        </div>
      </div>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas:      { sourceState: 'none' },
      story:       { height: '320px' },
      description: { story: '`RcDropdownSubmenu` is an item that opens a submenu beside its menu, to the right by default or to the left with `side="left"` for a menu near the right edge of the page. Its `submenu` slot holds the items and its `after` slot a value shown before the chevron. Submenus are one level deep: one inside a submenu is not drawn.' },
    },
  },
};

export const OpenWithoutTrigger: Story = {
  decorators: [dropdownDecorator],
  render:     () => ({
    components: {
      RcButton,
      RcDropdown,
      RcDropdownItem,
      RcDropdownSeparator,
    },
    setup() {
      const open = ref(false);
      const button = ref<InstanceType<typeof RcButton> | null>(null);

      return { open, button };
    },
    template: `
      <div>
        <RcButton
          ref="button"
          variant="secondary"
          aria-haspopup="menu"
          :aria-expanded="open"
          @click="open = true"
        >
          Row actions
        </RcButton>
        <RcDropdown
          v-model:open="open"
          aria-label="Row actions"
          placement="bottom-start"
          :reference-node="() => button?.$el"
        >
          <template #dropdownCollection>
            <RcDropdownItem>Edit</RcDropdownItem>
            <RcDropdownItem>Clone</RcDropdownItem>
            <RcDropdownSeparator />
            <RcDropdownItem>Delete</RcDropdownItem>
          </template>
        </RcDropdown>
      </div>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas:      { sourceState: 'none' },
      story:       { height: '250px' },
      description: { story: 'A menu without an `RcDropdownTrigger` is opened and closed through `v-model:open`, and positioned against the element `reference-node` returns, for a menu opened by something that cannot be a trigger, such as a table row or a keyboard shortcut. When a key opened it the first item takes the focus, and closing it with `Escape` or by choosing an item gives the focus back to whatever had it before.' },
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
