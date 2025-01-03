import type { Meta, StoryObj } from '@storybook/vue3';
import UnitInput from '@/shell/components/form/UnitInput.vue';

const meta: Meta<typeof UnitInput> = {
  component: UnitInput,
  argTypes:  {
    label:  { control: 'text' },
    type:   { control: 'text' },
    value:  { control: 'text' },
    suffix: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof UnitInput>;

export const Default: Story = {
  render: (args: any) => ({
    components: { UnitInput },
    setup() {
      return { args };
    },
    template: '<UnitInput v-bind="args" />',
  }),
};

export const Suffix: Story = {
  ...Default,
  args: {
    label:  'Input with seconds',
    type:   'text',
    value:  '123',
    suffix: 'Seconds',
  },
};
