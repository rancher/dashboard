import centered from '@storybook/addon-centered/vue';
import Tabs from './Tabs';

export default {
  title:       'Components/LabelsAndAnnotations/Tabs',
  component:   Tabs,
  decorators:  [centered]
};

export const Story = () => ({
  components: { Tabs },
  data() {
    return {
      keyValues: {
        key0: 'value0',
        key1: 'value1'
      }
    };
  },
  template:   `<div class="row">
    <Tabs :labels="keyValues" :annotations="keyValues" />
  </div>`,
});

Story.story = { name: 'LabelsAndAnnotationsTabs' };
