import centered from '@storybook/addon-centered/vue';
import PercentageBar from './PercentageBar';

export default {
  title:       'Components/PercentageBar',
  component:   PercentageBar,
  decorators:  [centered]
};

export const Story = () => ({
  components: { PercentageBar },
  template:   `<div style="display: flex; flex-direction: row; justify-content: space-between;">
    <PercentageBar :value="0.66"/>
    <PercentageBar :value="0.82"/>
    <PercentageBar :value="0.97"/>
  </div>`,
});

Story.story = { name: 'PercentageBar' };
