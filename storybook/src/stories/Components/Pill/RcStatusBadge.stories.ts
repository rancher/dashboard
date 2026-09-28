import type { Meta, StoryObj } from '@storybook/vue3';
import RcStatusBadge from '@components/Pill/RcStatusBadge/RcStatusBadge.vue';

const meta: Meta<typeof RcStatusBadge> = {
  component: RcStatusBadge,
  argTypes:  {
    status: {
      options:     ['info', 'success', 'warning', 'error', 'unknown', 'none'],
      control:     { type: 'select' },
      description: 'Specifies the status or color of the indicator.'
    },
    default: {
      control: { type: 'text' },
      name:    'default slot'
    },
  }
};

export default meta;
type Story = StoryObj<typeof RcStatusBadge>;

const Default: Story = {
  render: (args: any) => ({
    components: { RcStatusBadge },
    setup() {
      return { args };
    },
    template: '<RcStatusBadge v-bind="args">{{args.default}}</RcStatusBadge>',
  }),
};

export const Example: Story = {
  ...Default,
  args: { status: 'success', default: 'Status' },
};
