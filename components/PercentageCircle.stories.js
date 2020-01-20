import centered from '@storybook/addon-centered/vue';
import PercentageCircle from '../components/PercentageCircle';

export default {
  title:       'Components/PercentageCircle',
  component:   PercentageCircle,
  decorators:  [centered]
};

export const Story = () => ({
  components: { PercentageCircle },
  template:   `<div style="display: flex; flex-direction: row; justify-content: space-between;">
    <PercentageCircle :value="0.66" :upperWarningBound=".80" :upperErrorBound=".90"/>
    <PercentageCircle :value="0.82" :upperWarningBound=".80" :upperErrorBound=".90"/>
    <PercentageCircle :value="0.97" :upperWarningBound=".80" :upperErrorBound=".90"/>
  </div>`,
});

Story.story = { name: 'PercentageCircle' };
