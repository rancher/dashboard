import type { Meta, StoryObj } from '@storybook/vue3';
import TextAreaAutoGrow from '@/pkg/rancher-components/src/components/Form/TextArea/TextAreaAutoGrow.vue';

const meta: Meta<typeof TextAreaAutoGrow> = {
  component: TextAreaAutoGrow,
  argTypes:  { placeholder: { control: 'text' } },
};

export default meta;
type Story = StoryObj<typeof TextAreaAutoGrow>;

export const Default: Story = {
  render: (args: any) => ({
    components: { TextAreaAutoGrow },
    setup() {
      return { args };
    },
    template: '<TextAreaAutoGrow v-bind="args" />',
  }),
  args: { placeholder: 'Enter text...' },
};
