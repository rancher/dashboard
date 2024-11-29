import type { Meta, StoryObj } from '@storybook/vue3';
import BadgeState from '@/pkg/rancher-components/src/components/BadgeState/BadgeState.vue';

const meta: Meta<typeof BadgeState> = {
  component: BadgeState,
  argTypes:  {
    color: {
      description: 'Overwritten description',
      control:     {
        type:    'select',
        options: ['bg-info', 'bg-warning', 'bg-error'],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof BadgeState>;

export const Default: Story = {
  render: (args: any) => ({
    components: { BadgeState },
    setup() {
      return { args };
    },
    template: '<BadgeState v-bind="args" />',
    args:     { label: 'Badge' }
  }),
};

export const Info: Story = {
  ...Default,
  args: { color: 'bg-info' },
};

export const Warning: Story = {
  ...Default,
  args: { color: 'bg-warning' },
};

export const Error: Story = {
  ...Default,
  args: { color: 'bg-error' },
};
