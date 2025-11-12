import type { Meta, StoryObj } from '@storybook/vue3';
import { RcButton } from '@components/RcButton';
import { ButtonRole, ButtonSize } from '@components/RcButton/types';
import { RcIconTypeToClass } from '@components/RcIcon/types';

const meta: Meta<typeof RcButton> = {
  component: RcButton,
  argTypes:  {
    role: {
      options:     ['primary', 'secondary', 'tertiary', 'link', 'multiAction', 'ghost'] as ButtonRole[],
      control:     { type: 'select' },
      description: 'Determines the visual style and purpose of the button. Primary for main actions, secondary for supporting actions, tertiary for less prominent actions, link for navigation, multiAction for dropdown buttons, and ghost for transparent buttons.'
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
    role: 'primary',
    size: 'medium',
  },
};

export const AllRoles: Story = {
  render: (args: any) => ({
    components: { RcButton },
    setup() {
      const roles: ButtonRole[] = ['primary', 'secondary', 'tertiary', 'link', 'multiAction', 'ghost'];

      return { args, roles };
    },
    template: `<div style="display: flex; flex-direction: column; gap: 20px; max-width: 800px;">
      <div v-for="role in roles" :key="role" style="display: flex; align-items: center; gap: 20px;">
        <div style="min-width: 120px; font-weight: bold;">{{ role }}</div>
        <RcButton :role="role" size="medium">{{ role }}</RcButton>
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
    components: { RcButton },
    setup() {
      const sizes: ButtonSize[] = ['small', 'medium', 'large'];

      return { args, sizes };
    },
    template: `<div style="display: flex; flex-direction: column; gap: 20px; max-width: 800px;">
      <div v-for="size in sizes" :key="size" style="display: flex; align-items: center; gap: 20px;">
        <div style="min-width: 120px; font-weight: bold;">{{ size }}</div>
        <RcButton role="primary" :size="size">{{ size }}</RcButton>
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
    components: { RcButton },
    setup() {
      return { args };
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 20px;">
      <RcButton role="primary" left-icon="plus">Add Item</RcButton>
      <RcButton role="secondary" left-icon="search">Search</RcButton>
      <RcButton role="tertiary" right-icon="chevronDown">Dropdown</RcButton>
      <RcButton role="primary" left-icon="download" right-icon="chevronRight">Download</RcButton>
      <RcButton role="ghost" left-icon="edit">Edit</RcButton>
    </div>`,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'none' } }
  },
};
