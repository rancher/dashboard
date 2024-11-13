import type { Meta, StoryObj } from '@storybook/vue3';
import ToggleSwitch from '@/pkg/rancher-components/src/components/Form/ToggleSwitch/ToggleSwitch.vue';

const meta: Meta<typeof ToggleSwitch> = {
  component: ToggleSwitch,
  argTypes:  {
    value:    { control: 'boolean' },
    offLabel: { control: 'text' },
    onLabel:  { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof ToggleSwitch>;

export const Default: Story = {
  render: (args: any) => ({
    components: { ToggleSwitch },
    setup() {
      return { args };
    },
    template: '<ToggleSwitch v-bind="args" />',
  }),
  args: {
    value:    false,
    offLabel: 'Dark mode',
    onLabel:  'Light mode',
  },
};
