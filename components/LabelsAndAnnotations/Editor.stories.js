import centered from '@storybook/addon-centered/vue';
import Editor from './Editor';

export default {
  title:       'Components/LabelsAndAnnotations/Editor',
  component:   Editor,
  decorators:  [centered]
};

export const Story = () => ({
  components: { Editor },
  data() {
    return {
      keyValues: {
        key0: 'value0',
        key1: 'value1'
      }
    };
  },
  template:   `<div class="row">
    <Editor :labels="keyValues" :annotations="keyValues" mode="edit"/>
  </div>`,
});

Story.story = { name: 'LabelsAndAnnotationsEditor' };
