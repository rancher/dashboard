import type { Meta, StoryObj } from '@storybook/vue3';
import IconMessage from '@shell/components/IconMessage';

const meta: Meta<typeof IconMessage> = {
  component: IconMessage,
  argTypes:  {
    vertical:   { control: 'boolean' },
    icon:       { control: 'text' },
    iconState:  { control: 'text' },
    message:    { control: 'text' },
    messageKey: { control: 'text' },
    subtle:     { control: 'boolean' },
  }
};

export default meta;
type Story = StoryObj<typeof IconMessage>;

export const Default: Story = {
  render: (args: any) => ({
    components: { IconMessage },
    setup() {
      return { args };
    },
    template: '<IconMessage v-bind="args" />',
    args:     { icon: 'icon-checkmark' },
  }),
};

export const WithMessage: Story = {
  ...Default,
  args: {
    icon:    'icon-checkmark',
    message: 'Everything is fine!',
  },
};

export const Vertical: Story = {
  ...Default,
  args: {
    icon:     'icon-checkmark',
    vertical: true,
    message:  'Everything is fine!',
  },
};

export const Subtle: Story = {
  ...Default,
  args: {
    icon:    'icon-checkmark',
    subtle:  true,
    message: 'Everything is fine!',
  },
};

export const WithState: Story = {
  ...Default,
  args: {
    icon:      'icon-checkmark',
    iconState: 'Everything is fine!',
  },
};
