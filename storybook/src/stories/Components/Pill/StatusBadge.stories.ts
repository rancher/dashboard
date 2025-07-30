import type { Meta, StoryObj } from '@storybook/vue3';
import StatusBadge from '@components/Pill/StatusBadge/StatusBadge.vue';

const meta: Meta<typeof StatusBadge> = {
  component: StatusBadge,
  argTypes:  {
    shape: {
      options:     ['disc', 'horizontal-bar', 'vertical-bar'],
      control:     { type: 'select' },
      description: 'Specifies the shape of the indicator.'
    },
    status: {
      options:     ['info', 'success', 'warning', 'error', 'unknown', 'none'],
      control:     { type: 'select' },
      description: 'Specifies the status or color of the indicator.'
    }
  }
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

const Default: Story = {
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
    shape:  'disc',
    status: 'success',
  },
};
