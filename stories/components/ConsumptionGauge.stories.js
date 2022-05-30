import ConsumptionGauge from '@shell/components/ConsumptionGauge';

export default {
  title:       'Components/ConsumptionGauge',
  component:   ConsumptionGauge,
};

export const Story = (args, { argTypes }) => ({
  components: { ConsumptionGauge },
  props:      Object.keys(argTypes),
  methods:     {
    formatter(value) {
      const valueAsArray = value.toString().split('');

      valueAsArray.splice(1, 0, ',');

      return valueAsArray.join('');
    }
  },
  template:   `
    <div style="width: 300px;">
      <ConsumptionGauge v-bind="$props"/>
    </div>`,
});

Story.story = { name: 'ConsumptionGauge' };
Story.args = {
  used:         300,
  capacity:     789,
  units:        'GB',
  resourceName: 'DISK'
};
