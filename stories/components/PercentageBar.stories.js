import PercentageBar from '@/components/PercentageBar';
import { DescribeSpotPriceHistoryCommand } from '@aws-sdk/client-ec2';

export default {
  title:      'Components/PercentageBar',
  component:  PercentageBar,
  argTypes: {
    preferredDirection: {
      control: {
        type: 'select',
        options: ['LESS', 'MORE']
      }
    }
  }
};

export const Story = (args, { argTypes}) => ({
  components: { PercentageBar },
  props: Object.keys(argTypes),
  // props:      {
  //   value1:   { default: number('First Value', 67) },
  //   value2:   { default: number('Second Value', 83) },
  //   value3:   { default: number('Third Value', 97) },
  // },
  template:   `
    <div style="width: 300px">
      <PercentageBar v-bind="$props"/>
    </div>`,
});

Story.story = { name: 'PercentageBar' };
Story.args = {
  value: 45,
  showPercentage: true.valueOf,
  preferredDirection: 'LESS'
};

