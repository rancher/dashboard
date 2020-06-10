import { withKnobs, text, boolean } from '@storybook/addon-knobs';
import Checkbox from '@/components/form/Checkbox';

export default {
  title:      'Components/Forms',
  component:  Checkbox,
  decorators: [withKnobs]
};

export const checkbox = () => ({
  components: { Checkbox },
  props:      {
    label:         { default: text('Checkbox label', 'This is a label') },
    disabled:      { default: boolean('disabled', false) },
    indeterminate: { default: boolean('indeterminate', false) },
    mode:          { default: text('mode', 'edit') },
    value:         { default: boolean('Value', false) },
  },
  template: `
    <div class="row">
      <Checkbox
      type="checkbox"
      :label="label"
      :disabled="disabled"
      :indeterminate="indeterminate"
      :mode="mode"
      :value="value"
      />
    </div>`,
});
