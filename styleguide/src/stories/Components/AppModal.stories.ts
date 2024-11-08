import type { Meta, StoryObj } from '@storybook/vue3';
import AppModal from '@shell/components/AppModal';

const meta: Meta<typeof AppModal> = {
  component: AppModal,
  argTypes: {
    clickToClose: { control: 'boolean' },
    width: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof AppModal>;

export const Default: Story = {
  render: (args: any) => ({
    components: { AppModal },
    setup() {
      return { args };
    },
    template: '<app-modal v-bind="args">Modal content goes here</app-modal>',
  }),
  args: {
    clickToClose: true,
    width: 800,
  },
};
