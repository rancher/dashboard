import LabeledInput from '@/components/form/LabeledInput';

export default {
  title:      'Components/Forms',
  component:  LabeledInput,
  decorators: [],
};

export const labeledInput = () => ({
  components: { LabeledInput },
  template:   `<LabeledInput type='text' label='Sample Label' placeholder='Sample Placeholder'/>`,
});
