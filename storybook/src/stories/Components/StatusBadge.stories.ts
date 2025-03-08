import type { Meta, StoryObj } from '@storybook/vue3';
import StatusBadge from '@shell/components/StatusBadge';

const meta: Meta<typeof StatusBadge> = {
  component: StatusBadge,
  argTypes:  {
    status: { control: 'text' },
    label:  { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Default: Story = {
  render: (args: any) => ({
    components: { StatusBadge },
    setup() {
      return { args };
    },
    template: '<StatusBadge v-bind="args" />',
  }),
};

export const Success: Story = {
  ...Default,
  args: {
    status: 'success',
    label:  'My item'
  },
};

export const Info: Story = {
  ...Default,
  args: {
    status: 'info',
    label:  'My item'
  },
};

export const Warning: Story = {
  ...Default,
  args: {
    status: 'warning',
    label:  'My item'
  },
};

export const Error: Story = {
  ...Default,
  args: {
    status: 'error',
    label:  'My item'
  },
};
