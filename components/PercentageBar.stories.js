import { withKnobs, number } from '@storybook/addon-knobs';
import PercentageBar from './PercentageBar';

export default {
  title:      'Components/PercentageBar',
  component:  PercentageBar,
  decorators: [withKnobs]
};

export const Story = () => ({
  components: { PercentageBar },
  props:      {
    value1:   { default: number('First Value', 67) },
    value2:   { default: number('Second Value', 83) },
    value3:   { default: number('Third Value', 97) },
  },
  template:   `
    <div>
      <PercentageBar :value="value1"/>
      <PercentageBar :value="value2"/>
      <PercentageBar :value="value3"/>
    </div>`,
});

Story.story = { name: 'PercentageBar' };
