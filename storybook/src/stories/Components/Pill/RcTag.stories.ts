import type { Meta, StoryObj } from '@storybook/vue3';
import RcTag from '@components/Pill/RcTag/RcTag.vue';

const meta: Meta<typeof RcTag> = {
  component: RcTag,
  argTypes:  {
    type: {
      options:     ['active', 'inactive'],
      control:     { type: 'select' },
      description: 'Specifies the type of the tag.'
    },
    disabled: {
      control:     { type: 'boolean' },
      description: 'Specified if the tag is disabled.'
    },
    default: {
      control: { type: 'text' },
      name:    'default slot'
    },
  }
};

export default meta;
type Story = StoryObj<typeof RcTag>;

const Default: Story = {
  render: (args: any) => ({
    components: { RcTag },
    setup() {
      return { args };
    },
    template: '<RcTag v-bind="args">{{args.default}}</RcTag>',
  }),
};

export const Example: Story = {
  ...Default,
  args: {
    type: 'inactive', disabled: false, default: 'key: value'
  },
};
