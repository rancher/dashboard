import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';

export default {
  title:       'WIP/Tabs',
  component:   Tabbed,
};

export const Story = (args, { argTypes }) => ({
  components: { Tabbed, Tab },
  props:      Object.keys(argTypes),
  template:   `
      <Tabbed v-bind="$props">
        <Tab name="test1" badge="0" label="new">
          <div name="test1">Test one content</div>
        </Tab>
        <Tab name="test2" error="true" label="new2"><div name="test1">Test two content</div></Tab>
      </Tabbed>
    `
});

Story.story = { name: 'Tabs' };
Story.args = {
  label:    'test',
  useHash:  false
};
