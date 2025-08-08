import type { Meta, StoryObj } from '@storybook/vue3';
import RcStatusIndicator from '@components/Pill/RcStatusIndicator/RcStatusIndicator.vue';

const meta: Meta<typeof RcStatusIndicator> = {
  component: RcStatusIndicator,
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
type Story = StoryObj<typeof RcStatusIndicator>;

const Default: Story = {
  render: (args: any) => ({
    components: { RcStatusIndicator },
    setup() {
      return { args };
    },
    template: '<RcStatusIndicator v-bind="args" />',
  }),
};

export const Example: Story = {
  ...Default,
  args: {
    shape:  'disc',
    status: 'success',
  },
};
