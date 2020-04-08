import Tabs from './Tabs';

export default {
  title:       'Components/LabelsAndAnnotations',
  component:   Tabs,
};

export const tabs = () => ({
  components: { Tabs },
  data() {
    return {
      keyValues: {
        key0: 'value0',
        key1: 'value1'
      }
    };
  },
  template:   `
    <div class="row">
      <Tabs :labels="keyValues" :annotations="keyValues" />
    </div>`,
});
