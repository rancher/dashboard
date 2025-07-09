import type { Meta, StoryObj } from '@storybook/vue3';
import PercentageBar from '@shell/components/PercentageBar';

const meta: Meta<typeof PercentageBar> = {
  component: PercentageBar,
  argTypes:  {
    preferredDirection: {
      control: {
        type:    'select',
        options: ['LESS', 'MORE'],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PercentageBar>;

export const Default: Story = {
  render: (args: any) => ({
    components: { PercentageBar },
    setup() {
      return { args };
    },
    template: `<PercentageBar v-bind="args" />`,
  })
};

export const Percentage: Story = {
  ...Default,
  args: {
    modelValue:     45,
    showPercentage: true,
  },
};
