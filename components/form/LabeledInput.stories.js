import centered from '@storybook/addon-centered/vue';
import LabeledInput from '@/components/form/LabeledInput';

export default {
  title:      'Components/Form/Labeled Input',
  component:  LabeledInput,
  decorators: [() => '<form><story/></form>'],
};

export const labeledInput = () => ({
  components: { LabeledInput },
  template:   `<LabeledInput type='text' label='Sample Label' placeholder='Sample Placeholder'/>`,
});
