import type { Meta, StoryObj } from '@storybook/vue3';
import FileSelector from '@shell/components/form/FileSelector';

const meta: Meta<typeof FileSelector> = {
  component: FileSelector,
  argTypes:  {
    label:    { control: 'text' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof FileSelector>;

export const Default: Story = {
  render: (args: any) => ({
    components: { FileSelector },
    setup() {
      return { args };
    },
    template: '<FileSelector v-bind="args" />',
  }),
  description: 'Default FileSelector',
  args:        { label: 'Choose file' },
};

export const Disabled: Story = {
  ...Default,
  args: {
    label:    'Choose file',
    disabled: true,
  },
};
