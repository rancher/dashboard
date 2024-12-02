import type { Meta, StoryObj } from '@storybook/vue3';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { vueRouter } from 'storybook-vue3-router';

const meta: Meta<typeof Tabbed> = {
  component: Tabbed,
  argTypes:  {},
};

export default meta;
type Story = StoryObj<typeof Tab>;

export const Default: Story = {
  render: (args: any) => ({
    components: { Tabbed, Tab },
    setup() {
      return { args };
    },
    template: `
      <Tabbed v-bind="args">
        <Tab
          v-for="(g, i) in args.value"
          :key="g.name"
          :name="g.name"
          :label="g.name"
        >
        <div>{{ g.content }}</div>
        </Tab>
      </Tabbed>
    `
  }),
  args: {
    useHash: false,
    value:   [{ name: 'tab 1', content: 'content 1' }, { name: 'tab 2', content: 'content 2' }],
  },
};

Default.decorators = [
  vueRouter()
];

export const Editable: Story = {
  ...Default,
  render: (args: any) => ({
    components: { Tabbed, Tab },
    setup() {
      return { args };
    },
    template: `
      <Tabbed v-bind="args" @addTab="" @removeTab="">
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
  }),
  args: {
    useHash:           false,
    sideTabs:          true,
    showTabsAddRemove: true,
  },
};

export const Horizontal: Story = {
  ...Default,
  render: (args: any) => ({
    components: { Tabbed, Tab },
    setup() {
      return { args };
    },
    template: `
      <Tabbed v-bind="args">
        <Tab name="Deployment" label="Deployment">
          Deployment content
        </Tab>
        <Tab name="Pod" label="Pod">
          Pod content
        </Tab>
      </Tabbed>
    `
  }),
};

export const Vertical: Story = {
  ...Default,
  render: (args: any) => ({
    components: { Tabbed, Tab },
    setup() {
      return { args };
    },
    template: `
      <Tabbed v-bind="args">
        <Tab name="labels" label="Labels Network">
          <div name="labels">NestedTab content. </div>
        </Tab>
        <Tab name="Policy" label="Network Policy">
            <div name="scaling">NestedTab content.</div>
        </Tab>
      </Tabbed>
    `
  }),
  args: { sideTabs: true },
};

export const NestedHorizontal: Story = {
  ...Default,
  render: (args: any) => ({
    components: { Tabbed, Tab },
    setup() {
      return { args };
    },
    template: `
      <Tabbed v-bind="args">
        <Tab name="Network" label="Network">
          <Tabbed v-bind="args">
            <Tab name="labels" label="Labels Network">
              <div name="labels">NestedTab content. </div>
            </Tab>
            <Tab name="Policy" label="Network Policy">
               <div name="scaling">NestedTab content.</div>
            </Tab>
          </Tabbed>
        </Tab>
        <Tab name="Pod" label="Pod">
          <Tabbed v-bind="args">
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
  }),
  args: { sideTabs: true },
};

export const NestedVertical: Story = {
  ...Default,
  render: (args: any) => ({
    components: { Tabbed, Tab },
    setup() {
      return { args };
    },
    template: `
      <Tabbed v-bind="args">
        <Tab name="Deployment" label="Deployment">
          <Tabbed :useHash=${ args.useHash } :sideTabs=${ true }>
            <Tab name="labels" label="Labels & Annotations">
              <div name="labels">NestedTab content. </div>
            </Tab>
            <Tab name="scaling" label="Scaling Policy">
              <div name="scaling">NestedTab content.</div>
            </Tab>
          </Tabbed>
        </Tab>
        <Tab name="Pod" label="Pod">
          <Tabbed :useHash=${ args.useHash } :sideTabs=${ true }>
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
  }),
};

export const Slots: Story = {
  ...Default,
  render: (args: any) => ({
    components: { Tabbed, Tab },
    setup() {
      return { args };
    },
    template: `
      <Tabbed v-bind="args">
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
  }),
};
