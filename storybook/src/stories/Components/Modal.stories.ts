import type { Meta, StoryObj } from '@storybook/vue3';
import Modal from '@shell/components/AppModal';

const meta: Meta<typeof Modal> = {
  component: Modal,
  argTypes:  {
    clickToClose: { control: 'boolean' },
    width:        { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: (args: any) => ({
    components: { Modal },
    setup() {
      return { args };
    },
    template: '<app-modal v-bind="args">Modal content goes here</app-modal>',
  }),
  args: {
    clickToClose: true,
    width:        800,
  },
};
