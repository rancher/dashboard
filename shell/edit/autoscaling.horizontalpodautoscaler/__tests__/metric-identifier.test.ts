import { shallowMount } from '@vue/test-utils';
import MetricIdentifier from '@shell/edit/autoscaling.horizontalpodautoscaler/metric-identifier.vue';
import MatchExpressions from '@shell/components/form/MatchExpressions.vue';

describe('component: MetricIdentifier', () => {
  const expressions = [{
    key: 'app', operator: 'In', values: ['web']
  }];

  it.each<[string, { name: string, selector?: { matchExpressions?: object[], matchLabels?: object } }]>([
    ['an empty selector', { name: 'packets', selector: { matchExpressions: [], matchLabels: {} } }],
    ['no selector', { name: 'packets' }],
  ])('should write the selector rules into a metric with %p', async(_, value) => {
    const wrapper = shallowMount(MetricIdentifier, { props: { value } });

    wrapper.findComponent(MatchExpressions).vm.$emit('update:value', expressions);
    await wrapper.vm.$nextTick();

    expect(value.selector?.matchLabels).toStrictEqual({ app: 'web' });
  });

  it('should show the rules of a selector that only has matchLabels', () => {
    const wrapper = shallowMount(MetricIdentifier, { props: { value: { name: 'packets', selector: { matchLabels: { app: 'web' } } } } });

    expect(wrapper.findComponent(MatchExpressions).props('value')).toStrictEqual(expressions);
  });
});
