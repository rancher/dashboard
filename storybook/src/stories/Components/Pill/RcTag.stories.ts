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
    showClose: {
      control:     { type: 'boolean' },
      description: 'Specified if the close button is visible.'
    },
    closeAriaLabel: {
      control:     { type: 'text' },
      description: 'Adds an aria-label to the close button.'
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
    type: 'inactive', disabled: false, showClose: false, closeAriaLabel: 'Close', default: 'key: value',
  },
};
