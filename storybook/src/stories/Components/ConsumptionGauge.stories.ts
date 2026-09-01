import type { Meta, StoryObj } from '@storybook/vue3';
import ConsumptionGauge from '@shell/components/ConsumptionGauge';

const meta: Meta<typeof ConsumptionGauge> = { component: ConsumptionGauge };

export default meta;
type Story = StoryObj<typeof ConsumptionGauge>;

export const Default: Story = {
  render: (args: any) => ({
    components: { ConsumptionGauge },
    setup() {
      return { args };
    },
    template: `<ConsumptionGauge v-bind="args" />`,
  })
};

export const Disk: Story = {
  ...Default,
  args: {
    used:         300,
    capacity:     789,
    units:        'GB',
    resourceName: 'Disk',
  },
};
