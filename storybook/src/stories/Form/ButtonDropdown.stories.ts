import type { Meta, StoryObj } from '@storybook/vue3';
import ButtonDropdown from '@shell/components/ButtonDropdown';

const meta: Meta<typeof ButtonDropdown> = {
  component: ButtonDropdown,
  argTypes:  {
    buttonLabel:     { control: 'text' },
    dropdownOptions: { control: 'array' },
    size:            { control: 'select', options: ['sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<typeof ButtonDropdown>;

export const Default: Story = {
  render: (args: any) => ({
    components: { ButtonDropdown },
    setup() {
      return { args };
    },
    template: '<ButtonDropdown v-bind="args" />',
  }),
  args: { buttonLabel: 'No options' },
};

export const Small: Story = {
  ...Default,
  args: {
    buttonLabel:     'Option',
    dropdownOptions: ['Option', 'Option1'],
    size:            'sm',
  },
};

export const Large: Story = {
  ...Default,
  args: {
    buttonLabel:     'Option',
    dropdownOptions: ['Option', 'Option1'],
    size:            'lg',
  },
};
