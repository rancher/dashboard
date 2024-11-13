import type { Meta, StoryObj } from '@storybook/vue3';
import RadioButton from '@/pkg/rancher-components/src/components/Form/Radio/RadioButton';

const meta: Meta<typeof RadioButton> = {
  component: RadioButton,
  argTypes:  {
    label:    { control: 'text' },
    val:      { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

type Story = StoryObj<typeof RadioButton>;

export const Default: Story = {
  render: (args: any) => ({
    components: { RadioButton },
    setup() {
      return { args };
    },
    template: '<RadioButton v-bind="args" />',
  }),
  args: {
    label: 'Kubernetes',
    val:   true,
  },
};

export const Selected: Story = {
  ...Default,
  args: {
    ...Default.args,
    value: true,
  },
};

export const Disabled: Story = {
  ...Default,
  args: {
    ...Default.args,
    disabled: true,
  },
};

export default meta;
