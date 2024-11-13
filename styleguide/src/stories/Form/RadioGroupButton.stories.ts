import type { Meta, StoryObj } from '@storybook/vue3';
import RadioGroup from '@/pkg/rancher-components/src/components/Form/Radio/RadioGroup';

const meta: Meta<typeof RadioGroup> = {
  component: RadioGroup,
  argTypes:  {
    name:    { control: 'text' },
    label:   { control: 'text' },
    options: { control: 'array' },
    row:     { control: 'boolean' },
  },
};

export const Default: StoryObj<typeof RadioGroup> = {
  render: (args: any) => ({
    components: { RadioGroup },
    setup() {
      return { args };
    },
    template: '<RadioGroup v-bind="args" />',
  }),
  args: {
    name:    'RadioGroup',
    label:   'Choose one of the following theme',
    options: ['Custom', 'Dark', 'Light'],
    row:     false,
  },
};

export default meta;
