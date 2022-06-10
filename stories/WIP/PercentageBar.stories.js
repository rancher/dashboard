import PercentageBar from '@shell/components/PercentageBar';

export default {
  title:      'WIP/PercentageBar',
  component:  PercentageBar,
  argTypes:   {
    preferredDirection: {
      control: {
        type:    'select',
        options: ['LESS', 'MORE']
      }
    }
  }
};

export const Story = (args, { argTypes }) => ({
  components: { PercentageBar },
  props:      Object.keys(argTypes),
  template:   `
    <div style="width: 300px">
      <PercentageBar v-bind="$props"/>
    </div>`,
});

Story.story = { name: 'PercentageBar' };
Story.args = {
  value:              45,
  showPercentage:     true.valueOf,
  preferredDirection: 'LESS'
};
