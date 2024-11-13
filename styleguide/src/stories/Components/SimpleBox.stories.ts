import type { Meta, StoryObj } from '@storybook/vue3';
import SimpleBox from '@shell/components/SimpleBox';

const meta: Meta<typeof SimpleBox> = {
  component: SimpleBox,
  argTypes:  {
    canClose: { control: 'boolean' },
    title:    { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof SimpleBox>;

export const Default: Story = {
  render: (args: any) => ({
    components: { SimpleBox },
    setup() {
      return { args };
    },
    template: `
      <SimpleBox v-bind="args">
        <div>Content</div>
      </SimpleBox>
    `,
  }),
};

export const Basic: Story = {
  ...Default,
  args: {
    canClose: true,
    title:    'Basic SimpleBox component',
  },
};
