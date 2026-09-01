import type { Meta, StoryObj } from '@storybook/vue3';
import RcCounterBadge from '@components/Pill/RcCounterBadge/RcCounterBadge.vue';

const meta: Meta<typeof RcCounterBadge> = {
  component: RcCounterBadge,
  argTypes:  {
    count: {
      control:     { type: 'number' },
      description: 'The count that should display in the badge'
    },
    type: {
      options:     ['active', 'inactive'],
      control:     { type: 'select' },
      description: 'Specifies the type of the tag.'
    },
    disabled: {
      control:     { type: 'boolean' },
      description: 'Specified if the tag is disabled.'
    }
  }
};

export default meta;
type Story = StoryObj<typeof RcCounterBadge>;

const Default: Story = {
  render: (args: any) => ({
    components: { RcCounterBadge },
    setup() {
      return { args };
    },
    template: '<RcCounterBadge v-bind="args">{{args.default}}</RcCounterBadge>',
  }),
};

export const Example: Story = {
  ...Default,
  args: {
    type: 'inactive', disabled: false, count: 1000
  },
};
