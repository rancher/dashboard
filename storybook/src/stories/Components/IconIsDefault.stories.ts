import type { Meta, StoryObj } from '@storybook/vue3';
import IconIsDefault from '@shell/components/formatter/IconIsDefault';

const meta: Meta<typeof IconIsDefault> = { component: IconIsDefault };

export default meta;
type Story = StoryObj<typeof IconIsDefault>;

export const Default: Story = {
  render: (args: any) => ({
    components: { IconIsDefault },
    setup() {
      return { args };
    },
    template: `<IconIsDefault] />`,
  }),
};

export const IsDefault: Story = {
  ...Default,
  args: {
    row: { builtIn: true },
    col: {
      name:      'builtIn',
      value:     'builtIn',
      formatter: 'IconIsDefault'
    }
  },
};

export const IsNotDefault: Story = {
  ...Default,
  args: {
    row: { builtIn: false },
    col: {
      name:      'builtIn',
      value:     'builtIn',
      formatter: 'IconIsDefault'
    }
  },
};
