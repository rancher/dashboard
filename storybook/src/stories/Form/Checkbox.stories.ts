import type { Meta, StoryObj } from '@storybook/vue3';
import Checkbox from '@/pkg/rancher-components/src/components/Form/Checkbox/Checkbox.vue';

const meta: Meta<typeof Checkbox> = {
  component: Checkbox,
  argTypes:  {
    label:   { control: 'text' },
    checked: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  render: (args: any) => ({
    components: { Checkbox },
    setup() {
      return { args };
    },
    template: '<Checkbox v-bind="args" />',
  }),
  args: { label: 'Default' },
};

export const Checked: Story = {
  ...Default,
  args: {
    label:   'Checked',
    checked: true,
  },
};

export const Disabled: Story = {
  ...Default,
  args: {
    label:    'Disabled',
    checked:  false,
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  ...Default,
  args: {
    label:    'Disabled and checked',
    checked:  true,
    disabled: true,
  },
};
