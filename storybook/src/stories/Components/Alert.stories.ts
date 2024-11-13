import type { Meta, StoryObj } from '@storybook/vue3';
import Alert from '@shell/components/Alert';

const meta: Meta<typeof Alert> = {
  component: Alert,
  argTypes:  {
    status: {
      options: ['success', 'warning', 'info', 'error'],
      control: { type: 'select' }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Alert>;

const Default: Story = {
  render: (args: any) => ({
    components: { Alert },
    setup() {
      return { args };
    },
    template: '<Alert v-bind="args" />',
  }),
};

export const Success: Story = {
  ...Default,
  args: {
    message: 'PID Pressure',
    status:  'success',
  },
};

export const Warning: Story = {
  ...Default,
  args: {
    message: 'Disk Pressure',
    status:  'warning',
  },
};

export const Info: Story = {
  ...Default,
  args: {
    message: 'Memory Pressure',
    status:  'info',
  },
};

export const Error: Story = {
  ...Default,
  args: {
    message: 'kubelet',
    status:  'error',
  },
};
