import DetailTop from '@/components/DetailTop';
import LabeledInput from '@/components/form/LabeledInput';

export default {
  title:       'Components/DetailTop',
  components:   DetailTop,
  decorators:  []
};

export const Story = () => ({
  components: { DetailTop, LabeledInput },
  data() {
    return {
      columns: [
        {
          title:   'Example Title',
          content: 'Example Content'
        },
        {
          title:   'Second Title',
          content: 'Second Content'
        },
        {
          title:   'Column using slot',
          name:  'something'
        }
      ]
    };
  },
  template:   `
  <DetailTop :columns='columns'>
  <template v-slot:something >
     <LabeledInput type="text" label="I'm in a slot!" />
     </template>
  </DetailTop>
  `
});

Story.story = { name: 'DetailTop' };
