import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';

export default {
  title:      'WIP/TabNew',
  component:  Tab,
};

export const Story = (args, { argTypes }) => ({
  components: { Tabbed, Tab },
  props:      Object.keys(argTypes),
  data() {
    return {
      active: true,
    };
  },
  template:   `
    <Tabbed>
      <Tab @click="formatter" :class="active" v-bind="$props" />
    </Tabbed>`,
});

Story.args = { name: 'tests' };
