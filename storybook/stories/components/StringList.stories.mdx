
import { Canvas, Meta, Story, ArgsTable, Source } from '@storybook/addon-docs';
import StringList from '@/pkg/rancher-components/src/components/StringList/StringList';
import { useArgs } from '@storybook/client-api';

<Meta
  title="Components/StringList"
  component={StringList}
  argTypes={{
    actionsPosition: {
      options: ['left', 'right'],
      control: { type: 'radio' },
    },
    placeholder: 'type new item',
    errorMessages: { duplicate: 'Error, item is duplicate.' },
    caseSensitive: false,
    readonly: false,
  }}
/>

export const Template = (args, { argTypes }) => {
  const [_, updateArgs] = useArgs();
  return {
    components: { StringList },
    props:      Object.keys(argTypes),
    data: () => {
      return {
        value: args?.items || [],
      };
    },
    methods: {
      update(value) {
        this.value = value;
        updateArgs({
          items: value
        });
      }
    },
    template:   `
        <div style="width: auto; min-width: 400px;">
          <StringList v-bind="$props" :items="value" @change="update($event)"/>
        </div>
      `,
  };
}


# StringList

It can be used to handle a list of strings.

<br/>

### Description

- Click on the plus button or double click on a blank space of the items box to create a new item, then press Enter.
- An item can be edited by double click on it.
- In case of the item name is already in the list, an error message is displayed on the bottom of the box.
- Select an item and then click on minus button to remove it from the list.
- If a bulk addition delimiter is set, the input value will be split into individual entries.

<br/>

#### Edit mode

<Canvas>
  <Story
    name="edit mode"
    args={{
      items: ['item', 'item-1', 'item-2', 'item-3', 'item-4'],
      actionsPosition: 'left',
      placeholder: 'type new item',
      errorMessages: { duplicate: 'Error, item is duplicate.' }
    }}>
    {Template.bind({})}
  </Story>
</Canvas>

#### View mode

<Canvas>
  <Story
    name="view mode"
    args={{
      items: ['item', 'item-1', 'item-2', 'item-3', 'item-4'],
      actionsPosition: 'left',
      placeholder: 'type new item',
      readonly: true
    }}>
    {Template.bind({})}
  </Story>
</Canvas>

### Import

<Source
  language='js'
  light
  format={false}
  code={`
     import StringList from '@/pkg/rancher-components/src/components/StringList/StringList';
  `}
/>

### Props table

<ArgsTable of={StringList} />

