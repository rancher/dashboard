import Editor from './Editor';

export default {
  title:       'Components/LabelsAndAnnotations',
  component:   Editor,
};

export const editor = () => ({
  components: { Editor },
  data() {
    return {
      keyValues: {
        key0: 'value0',
        key1: 'value1'
      }
    };
  },
  template:   `
    <div class="row p-20">
      <Editor :labels="keyValues" :annotations="keyValues" mode="edit"/>
    </div>`,
});
