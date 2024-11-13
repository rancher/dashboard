import type { Meta, StoryObj } from '@storybook/vue3';
import LabeledSelect from '@shell/components/form/LabeledSelect';

const meta: Meta<typeof LabeledSelect> = {
  component: LabeledSelect,
  argTypes:  {
    label:       { control: 'text' },
    options:     { control: 'array' },
    placeholder: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof LabeledSelect>;

export const Default: Story = {
  render: (args: any) => ({
    components: { LabeledSelect },
    setup() {
      return { args };
    },
    template: '<LabeledSelect v-bind="args" />',
  }),
  args: {
    label:       'System',
    options:     ['System01', 'System02', 'System03', 'System04'],
    placeholder: 'Select option',
  },
};
