import centered from '@storybook/addon-centered/vue';
import ConsumptionGauge from './ConsumptionGauge';

export default {
  title:       'Components/ConsumptionGauge',
  component:   ConsumptionGauge,
  decorators:  [centered]
};

export const Story = () => ({
  components: { ConsumptionGauge },
  methods:     {
    formatter(value) {
      const valueAsArray = value.toString().split('');

      valueAsArray.splice(1, 0, ',');

      return valueAsArray.join('');
    }
  },
  template:   `<div style="display: flex; flex-direction: row; justify-content: space-between;">
    <ConsumptionGauge resourceName="DISK" :capacity="789" :used="300"/>
    <ConsumptionGauge resourceName="RAM" :capacity="456" :used="360" units="GiB"/>
    <ConsumptionGauge resourceName="CPU" :capacity="1230" :used="1200" :numberFormatter="formatter"/>
  </div>`,
});

Story.story = { name: 'PercentageBar' };
