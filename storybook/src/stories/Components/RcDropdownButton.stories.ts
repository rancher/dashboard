import type { Meta, StoryObj } from '@storybook/vue3';
import { RcDropdownButton } from '@components/RcDropdownButton';
import { DropdownButtonRole } from '@components/RcDropdownButton/types';
import { ButtonSize } from '@components/RcButton/types';
import { RcIconTypeToClass } from '@components/RcIcon/types';

const meta: Meta<typeof RcDropdownButton> = {
  component: RcDropdownButton,
  argTypes:  {
    role: {
      options:     ['primary', 'secondary'] as DropdownButtonRole[],
      control:     { type: 'select' },
      description: 'Determines the visual style and purpose of the dropdown button. Primary for main actions, secondary for supporting actions.'
    },
    size: {
      options:     ['small', 'medium', 'large'] as ButtonSize[],
      control:     { type: 'select' },
      description: 'Determines the size of the dropdown button. Medium is the default size for most use cases.'
    },
    leftIcon: {
      options:     ['', ...Object.keys(RcIconTypeToClass)],
      control:     { type: 'select' },
      description: 'Icon to display on the left side of the button text.'
    },
    disabled: {
      control:     { type: 'boolean' },
      description: 'Disables the entire dropdown button when true.'
    },
  }
};

export default meta;
type Story = StoryObj<typeof RcDropdownButton>;

const sampleOptions = [
  { label: 'Edit', icon: 'icon-edit' },
  { label: 'Duplicate', icon: 'icon-copy' },
  { label: 'Download', icon: 'icon-download' },
  { divider: true },
  { label: 'Delete', icon: 'icon-delete', disabled: false },
];

export const Default: Story = {
  render: (args: any) => ({
    components: { RcDropdownButton },
    setup() {
      const handleClick = () => {
        console.log('Primary action clicked');
      };
      const handleSelect = (e: MouseEvent, option: any) => {
        console.log('Dropdown option selected:', option);
      };

      return {
        args, handleClick, handleSelect
      };
    },
    template: '<RcDropdownButton v-bind="args" @click="handleClick" @select="handleSelect">Primary Action</RcDropdownButton>',
  }),
  args: {
    role:    'primary',
    size:    'medium',
    options: sampleOptions,
  },
};

export const AllRoles: Story = {
  render: (args: any) => ({
    components: { RcDropdownButton },
    setup() {
      const roles: DropdownButtonRole[] = ['primary', 'secondary'];
      const options = sampleOptions;

      return { args, roles, options };
    },
    template: `<div style="display: flex; flex-direction: column; gap: 20px; max-width: 800px;">
      <div v-for="role in roles" :key="role" style="display: flex; align-items: center; gap: 20px;">
        <div style="min-width: 120px; font-weight: bold;">{{ role }}</div>
        <RcDropdownButton :role="role" size="medium" :options="options">{{ role }}</RcDropdownButton>
      </div>
    </div>`,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'none' } }
  },
};

export const AllSizes: Story = {
  render: (args: any) => ({
    components: { RcDropdownButton },
    setup() {
      const sizes: ButtonSize[] = ['small', 'medium', 'large'];
      const options = sampleOptions;

      return { args, sizes, options };
    },
    template: `<div style="display: flex; flex-direction: column; gap: 20px; max-width: 800px;">
      <div v-for="size in sizes" :key="size" style="display: flex; align-items: center; gap: 20px;">
        <div style="min-width: 120px; font-weight: bold;">{{ size }}</div>
        <RcDropdownButton role="primary" :size="size" :options="options">{{ size }}</RcDropdownButton>
      </div>
    </div>`,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'none' } }
  },
};

export const WithIcons: Story = {
  render: (args: any) => ({
    components: { RcDropdownButton },
    setup() {
      const options = sampleOptions;

      return { args, options };
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 20px;">
      <RcDropdownButton role="primary" left-icon="plus" :options="options">Add Item</RcDropdownButton>
      <RcDropdownButton role="secondary" left-icon="download" :options="options">Download</RcDropdownButton>
      <RcDropdownButton role="primary" left-icon="upload" :options="options">Upload</RcDropdownButton>
    </div>`,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'none' } }
  },
};

export const DisabledState: Story = {
  render: (args: any) => ({
    components: { RcDropdownButton },
    setup() {
      const options = sampleOptions;

      return { args, options };
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 20px;">
      <RcDropdownButton role="primary" :options="options" :disabled="true">Disabled Primary</RcDropdownButton>
      <RcDropdownButton role="secondary" :options="options" :disabled="true">Disabled Secondary</RcDropdownButton>
    </div>`,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'none' } }
  },
};

export const EmptyOptions: Story = {
  render: (args: any) => ({
    components: { RcDropdownButton },
    setup() {
      return { args };
    },
    template: '<RcDropdownButton role="primary" :options="[]">No Options</RcDropdownButton>',
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'none' } }
  },
};
