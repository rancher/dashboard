import { action } from '@storybook/addon-actions'
import { Canvas, Meta, Story, ArgsTable, Source } from '@storybook/addon-docs';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { useArgs } from '@storybook/client-api';

<Meta 
  title="Components/Tab"
  component={Tabbed}
/>

export const Template = (args, { argTypes, events }) => ({
  components: { Tabbed, Tab },
  props:      Object.keys(argTypes),
  template:   `
    <Tabbed v-bind="$props">
      <Tab name="Deployment" label="Deployment">
        <div name="Deployment">Deployment tab content. </div>
      </Tab>
      <Tab name="Pod" label="Pod">
        <div name="Pod">Pod tab content.</div>
      </Tab>
    </Tabbed>
  `
});

export const AddRemove = (args, { argTypes, events }) => {
  const [_, updateArgs] = useArgs();
  return {
    components: { Tabbed, Tab },
  props:      Object.keys(argTypes),
  data: () => {
    return {
      value: args?.tabs || [],
    };
  },
  methods: {
    update() {
      let new_item = [];
      let item_object = {};
      const i = this.value.length + 1;
      item_object.name = `Tab${i}`;
      item_object.content = `Tab content ${i}`;
      new_item.push(item_object);
      this.value = [...this.value, ...new_item];
      updateArgs({
        tabs: this.value
      });
    },
    remove(value) {
      this.value.splice(value, 1);
      updateArgs({
        tabs: this.value
      });
    }
  },
  template:   `
      <Tabbed v-bind="$props" @addTab="update($event)" @removeTab="remove($event)">
        <Tab
          v-for="g in value"
          :key="g.name"
          :name="g.name"
          :label="g.name"
        >
        <div>{{ g.content }}</div>
        </Tab>
      </Tabbed>
    `
  };
};

export const TabNestedHorizontal = (args, { argTypes, events }) => ({
  components: { Tabbed, Tab },
  props:      Object.keys(argTypes),
  template:   `
      <Tabbed v-bind="$props">
        <Tab name="Deployment" label="Deployment">
          <Tabbed :useHash=${args.useHash} :sideTabs=${true}>
            <Tab name="labels" label="Labels & Annotations">
              <div name="labels">NestedTab content. </div>
            </Tab>
            <Tab name="scaling" label="Scaling Policy">
               <div name="scaling">NestedTab content.</div>
            </Tab>
          </Tabbed>
        </Tab>
        <Tab name="Pod" label="Pod">
          <Tabbed :useHash=${args.useHash} :sideTabs=${true}>
            <Tab name="node" label="Node Scheduling">
              <div name="node">NestedTab content. </div>
            </Tab>
            <Tab name="networking" label="Networking">
               <div name="networking">NestedTab content.</div>
            </Tab>
          </Tabbed>
        </Tab>
      </Tabbed>
    `
});

export const TabNestedVertical = (args, { argTypes, events }) => ({
  components: { Tabbed, Tab },
  props:      Object.keys(argTypes),
  template:   `
      <Tabbed v-bind="$props">
        <Tab name="Network" label="Network">
          <Tabbed v-bind="$props">
            <Tab name="labels" label="Labels Network">
              <div name="labels">NestedTab content. </div>
            </Tab>
            <Tab name="Policy" label="Network Policy">
               <div name="scaling">NestedTab content.</div>
            </Tab>
          </Tabbed>
        </Tab>
        <Tab name="Pod" label="Pod">
          <Tabbed v-bind="$props">
            <Tab name="node" label="Node Scheduling">
              <div name="node">NestedTab content. </div>
            </Tab>
            <Tab name="networking" label="Networking">
               <div name="networking">NestedTab content.</div>
            </Tab>
          </Tabbed>
        </Tab>
      </Tabbed>
    `
});

export const ExtrasSlote = (args, { argTypes, events }) => {
  const [_, updateArgs] = useArgs();
  return {
    components: { Tabbed, Tab },
  props:      Object.keys(argTypes),
  template:   `
    <Tabbed v-bind="$props">
      <Tab name="Deployment" label="Deployment">
        <div name="Deployment">Deployment tab content. </div>
      </Tab>
      <Tab name="Pod" label="Pod">
        <div name="Pod">Pod tab content.</div>
      </Tab>
      <template #tab-row-extras>
        <li class="tablist-controls">
          <button type="button" class="btn-sm mt-5" >
            Create
          </button>
        </li>
      </template>
    </Tabbed>
    `,
  };
};


# Tab

Tabs are used to separate information into logical sections and to quickly navigate between them.

### Description
- Use tabs when there is a large amount of content that can be separated.
- Use tabs to make the content accessible without reloading the page or compromising on space.
- Write short tab labels. Try not to use more than two words for a tab label.

- Secondary tabs never appear without a parent set of primary tabs.
- The number of secondary tabs inside vertical tabs should be as small as possible – not more than six are recommended.
<br/>
<br/>

### Types

<br/>

#### Default/Horizontal Tabs
- Horizontal tabs are best used with ten or fewer tabs. This maintains an uncluttered UI and reduces cognitive load for users.
- Write short tab labels. Especially with a large number of tabs and little horizontal screen space.
- Stick to only one row of tabs. Use tab navigation when the content categories fit in a single row.

<Canvas>
  <Story
    name="Default"
    args={{
      useHash: false,
    }}>
    {Template.bind({})}
  </Story>
</Canvas>

#### Side/Vertical Tabs
- Vertical tabs provide better scalability for a large number of tabs (ten and more).

<Canvas>
   <Story
    name="Vertical"
    args={{
      useHash: false,
      sideTabs: true,
    }}>
    {Template.bind({})}
  </Story>
</Canvas>


#### Nested

- Primary tabs can either be arranged horizontally or vertically. 
- Secondary tabs only appear as nested tab.
- Tabs can be nested in two levels.

##### Horizontal tabs with vertical secondary tabs.
<Canvas>
   <Story
    name="Nested horizontal/vertical"
    args={{
      useHash: false,
      flat: true,
    }}>
    {TabNestedHorizontal.bind({})}
  </Story>
</Canvas>

##### vertical tabs with vertical secondary tabs
<Canvas>
  <Story
    name="Nested vertical/vertical"
    args={{
      useHash: false,
      sideTabs: true
    }}>
    {TabNestedVertical.bind({})}
  </Story>
</Canvas>



##### Add/Remove Vertical Tab
<Canvas>
  <Story
    name="Add/Remove Vertical Tab"
    args={{
      tabs: [
        {
          "name": "Tab1",
          "content": "Tab content 1",
        },
        {
          "name": "Tab2",
          "content": "Tab content 2",
        }
      ],
      useHash: false,
      sideTabs: true,
      showTabsAddRemove: true,
    }}>
    {AddRemove.bind({})}
  </Story>
</Canvas>

##### Extras Slote

You can have customize elements in the tab row by using `tab-row-extras` slot.

<Canvas>
  <Story
    name="Extras in tab-row"
    args={{
      useHash: false,
    }}>
    {ExtrasSlote.bind({})}
  </Story>
</Canvas>

### Props table

<ArgsTable of={Tabbed} />

