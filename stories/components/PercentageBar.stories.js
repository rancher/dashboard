import PercentageBar from '@/components/PercentageBar';

export default {
  title:      'Components/PercentageBar',
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
  value:              40,
  showPercentage:     true.valueOf,
  preferredDirection: 'LESS'
};



