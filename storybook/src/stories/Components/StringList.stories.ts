import type { Meta, StoryObj } from '@storybook/vue3';
import StringList from '@/pkg/rancher-components/src/components/StringList/StringList.vue';

const meta: Meta<typeof StringList> = {
  component: StringList,
  argTypes:  {
    actionsPosition: {
      options: ['left', 'right'],
      control: { type: 'radio' },
    },
    placeholder:   { control: 'text' },
    errorMessages: { control: 'object' },
    caseSensitive: { control: 'boolean' },
    readonly:      { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof StringList>;

export const Default: Story = {
  render: (args: any) => ({
    components: { StringList },
    setup() {
      // // NOTE: Implementation should already exist out of the box
      // const handleChange = (event: Array<string> | Event) => {
      //   if (event instanceof Event) { return };
      //   args.items = event;
      // };
      // return { args, handleChange };

      return { args };
    },
    template: `<StringList @change="handleChange" v-bind="args" />`,
  })
};

export const Edit: Story = {
  ...Default,
  args: {
    items:           ['item', 'item-1', 'item-2', 'item-3', 'item-4'],
    actionsPosition: 'left',
    placeholder:     'type new item',
    errorMessages:   { duplicate: 'Error, item is duplicate.' }
  },
};

export const View: Story = {
  ...Default,
  args: {
    items:           ['item', 'item-1', 'item-2', 'item-3', 'item-4'],
    actionsPosition: 'left',
    placeholder:     'type new item',
    readonly:        true
  },
};
