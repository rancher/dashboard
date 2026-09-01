import type { Meta, StoryObj } from '@storybook/vue3';
import LabeledTooltip from '@/pkg/rancher-components/src/components/LabeledTooltip/LabeledTooltip.vue';

const meta: Meta<typeof LabeledTooltip> = { component: LabeledTooltip };

export default meta;
type Story = StoryObj<typeof LabeledTooltip>;

export const Default: Story = {
  render: (args: any) => ({
    components: { LabeledTooltip },
    setup() {
      return { args };
    },
    template: '<LabeledTooltip v-bind="args" />',
  }),
  args: {
    status: 'Hello world',
    value:  'More context or explanation about an element.'
  },
};
