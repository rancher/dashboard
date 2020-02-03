import centered from '~/components/form/node_modules/@storybook/addon-centered/vue';
import LabeledInput from '~/components/form/LabeledInput';

export default {
  title:      'Components/Form/Labeled Input',
  component:  LabeledInput,
  decorators: [centered],
};

export const labeledInput = () => ({
  components: { LabeledInput },
  template:   `<LabeledInput type='text' label='Sample Label' placeholder='Sample Placeholder'/>`,
});
