import type { Meta, StoryObj } from '@storybook/vue3';
import ArrayList from '@shell/components/form/ArrayList.vue';
import { _VIEW } from '@shell/config/query-params';

const meta: Meta<typeof ArrayList> = {
  component: ArrayList,
  argTypes:  {
    titleSlot:         { control: 'text' },
    columnHeadersSlot: { control: 'text' },
    columnsSlot:       { control: 'text' },
    valueSlot:         { control: 'text' },
    removeButtonSlot:  { control: 'text' },
    emptySlot:         { control: 'text' },
    addSlot:           { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof ArrayList>;

const Template: Story = {
  render: (args: any) => ({
    components: { ArrayList },
    setup() {
      return { args };
    },
    template: `<ArrayList v-bind="args">
                 <template v-if="args.titleSlot" v-slot:title>{{ args.titleSlot }}</template>
                 <template v-if="args.columnHeadersSlot" v-slot:column-headers>{{ args.columnHeadersSlot }}</template>
                 <template v-if="args.columnsSlot" v-slot:columns>{{ args.columnsSlot }}</template>
                 <template v-if="args.valueSlot" v-slot:value>{{ args.valueSlot }}</template>
                 <template v-if="args.removeButtonSlot" v-slot:remove-button>{{ args.removeButtonSlot }}</template>
                 <template v-if="args.emptySlot" v-slot:empty>{{ args.emptySlot }}</template>
                 <template v-if="args.addSlot" v-slot:add>{{ args.addSlot }}</template>
               </ArrayList>`,
  }),
};

export const Default: Story = {
  ...Template,
  args: { value: ['First value', 'Second value', 'Third value'] },
};

export const NoList: Story = {
  ...Template,
  args: {},
};

export const MultilineValue: Story = {
  ...Template,
  args: {
    value:          [`Multiline\nvalue\nexample`],
    valueMultiline: true,
  },
};

export const EmptyValue: Story = {
  ...Template,
  args: {
    initialEmptyRow: true,
    addLabel:        'Add',
    removeLabel:     'Remove',
  },
};

export const TitleAndTip: Story = {
  ...Template,
  args: {
    title:  'This is a title',
    protip: 'This is a tip',
  },
};

export const InputLabelAndPlaceholder: Story = {
  ...Template,
  args: {
    value:            [''],
    valueLabel:       'Custom label value',
    valuePlaceholder: 'Custom placeholder',
    showHeader:       true,
  },
};

export const ReadOnlyMode: Story = {
  ...Template,
  args: {
    value:       ['string 1', 'string 2'],
    mode:        _VIEW,
    addLabel:    'Add',
    removeLabel: 'Remove',
  },
};

export const DisableAddRemoveButtons: Story = {
  ...Template,
  args: {
    value:         ['string 1', 'string 2'],
    addAllowed:    false,
    removeAllowed: false,
  },
};

export const CustomButtonsText: Story = {
  ...Template,
  args: {
    addLabel:    'Custom add',
    removeLabel: 'Custom remove',
  },
};

export const DefaultAddValue: Story = {
  ...Template,
  args: { defaultAddValue: 'Default value' },
};

export const LoadingStatus: Story = {
  ...Template,
  args: {
    loading: true,
    value:   ['Existing value'],
  },
};

export const Validation: Story = {
  ...Template,
  args: {
    rules: [(value) => value !== 'Change for error' ? 'Please add at least one value' : undefined],
    value: ['Change for error', 'Already error'],
  },
};

export const TitleSlot: Story = {
  ...Template,
  args: {
    title:     'Anything',
    titleSlot: `<div style="background: red; color: white">Title</div>`,
  },
};

export const ColumnHeadersSlot: Story = {
  ...Template,
  args: {
    value:             [''],
    showHeader:        true,
    columnHeadersSlot: `<div style="background: red; color: white">Column Headers</div>`,
  },
};

export const ColumnsSlot: Story = {
  ...Template,
  args: {
    value:       [''],
    columnsSlot: `<div style="background: red; color: white">Columns</div>`,
  },
};

export const ValueSlot: Story = {
  ...Template,
  args: {
    value:     [''],
    valueSlot: `<div style="background: red; color: white">Value element, usually text</div>`,
  },
};

export const RemoveButtonSlot: Story = {
  ...Template,
  args: {
    value:            [''],
    removeButtonSlot: `<div style="background: red; color: white">Remove Button, e.g. custom button</div>`,
  },
};

export const EmptySlot: Story = {
  ...Template,
  args: { emptySlot: `<div style="background: red; color: white">Empty element placeholder</div>` },
};

export const AddSlot: Story = {
  ...Template,
  args: {
    value:   [''],
    addSlot: `<div style="background: red; color: white">Add element, e.g. button</div>`,
  },
};
