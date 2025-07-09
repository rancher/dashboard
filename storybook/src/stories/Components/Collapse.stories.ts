import type { Meta, StoryObj } from '@storybook/vue3';
import Collapse from '@shell/components/Collapse';

const meta: Meta<typeof Collapse> = {
  component: Collapse,
  argTypes:  {
    open:  { control: 'boolean' },
    title: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Collapse>;

export const Default: Story = {
  render: (args: any) => ({
    components: { Collapse },
    setup() {
      return { args };
    },
    template: `
      <Collapse v-bind="args">
        <div>Content</div>
      </Collapse>
    `,
  })
};

export const Open: Story = {
  ...Default,
  args: {
    open:  true,
    title: 'Collapse component',
  },
};

export const Close: Story = {
  ...Default,
  args: {
    open:  false,
    title: 'Collapsed component',
  },
};
