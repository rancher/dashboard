import type { Meta, StoryObj } from '@storybook/vue3';
import StatusIndicator from '@components/Pill/RcStatusIndicator/RcStatusIndicator.vue';

const meta: Meta<typeof StatusIndicator> = {
  component: StatusIndicator,
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
type Story = StoryObj<typeof StatusIndicator>;

const Default: Story = {
  render: (args: any) => ({
    components: { StatusIndicator },
    setup() {
      return { args };
    },
    template: '<StatusIndicator v-bind="args" />',
  }),
};

export const Success: Story = {
  ...Default,
  args: {
    shape:  'disc',
    status: 'success',
  },
};
