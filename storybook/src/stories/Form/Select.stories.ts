import type { Meta, StoryObj } from '@storybook/vue3';
import Select from '@/shell/components/form/Select.vue';

const meta: Meta<typeof Select> = {
  component: Select,
  argTypes:  {
    label:       { control: 'text' },
    options:     { control: 'array' },
    placeholder: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: (args: any) => ({
    components: { Select },
    setup() {
      return { args };
    },
    template: '<Select v-bind="args" />',
  }),
  args: {
    label:       'Select',
    options:     ['value01', 'value02', 'value03', 'value04'],
    placeholder: 'Select option',
  },
};
