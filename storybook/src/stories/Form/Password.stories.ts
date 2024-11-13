import type { Meta, StoryObj } from '@storybook/vue3';
import Password from '@shell/components/form/Password';

const meta: Meta<typeof Password> = {
  component: Password,
  argTypes:  {
    label:        { control: 'text' },
    value:        { control: 'text' },
    required:     { control: 'boolean' },
    isRandom:     { control: 'boolean' },
    autocomplete: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Password>;

export const Default: Story = {
  render: (args: any) => ({
    components: { Password },
    setup() {
      return { args };
    },
    template: '<Password v-bind="args" />',
  }),
  args: {
    label: 'Password',
    value: 'password1234',
  },
};

export const Required: Story = {
  ...Default,
  args: {
    ...Default.args,
    required: true,
  },
};

export const Random: Story = {
  ...Default,
  args: {
    ...Default.args,
    isRandom: true,
    value:    '',
  },
};

export const Autocomplete: Story = {
  ...Default,
  args: {
    ...Default.args,
    autocomplete: true,
    value:        '',
  },
};
