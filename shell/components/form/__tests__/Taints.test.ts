import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import Taints from '@shell/components/form/Taints.vue';

describe.skip('(Vue3 Skip) component: Taints', () => {
  it('should accept custom effect values', async() => {
    const customEffects = { FOO_EFFECT: 'foo', BAR_EFFECT: 'bar' };

    const wrapper = mount(Taints, {
      props: {
        value:        [{ effect: 'FOO_EFFECT', value: 'abc' }],
        effectValues: customEffects
      }
    });

    const firstEffectInput = wrapper.find('[data-testid="taints-effect-row-0"]');

    expect(firstEffectInput.exists()).toBe(true);

    expect(firstEffectInput.attributes().value).toBe('FOO_EFFECT');
    expect(wrapper.vm.effectOptions).toStrictEqual([{ value: 'FOO_EFFECT', label: 'foo' }, { value: 'BAR_EFFECT', label: 'bar' }]);

    const taintKV = wrapper.findComponent('[data-testid="taints-keyvalue"]');

    taintKV.vm.add();
    await nextTick();

    const secondEffectInput = wrapper.find('[data-testid="taints-effect-row-1"]');

    expect(secondEffectInput.exists()).toBe(true);

    expect(secondEffectInput.attributes().value).toStrictEqual('FOO_EFFECT');
    expect(wrapper.vm.defaultAddData).toStrictEqual({ effect: 'FOO_EFFECT' });
  });

  it('should use default effect values of NoSchedule, PreferNoSchedule, and PreferNoExecute', async() => {
    const expectedEffectOptions = [
      { label: 'NoSchedule', value: 'NoSchedule' },
      { label: 'PreferNoSchedule', value: 'PreferNoSchedule' },

      { label: 'NoExecute', value: 'NoExecute' },

    ];

    const wrapper = mount(Taints, { props: { value: [{ effect: '', value: 'abc' }] } });

    const firstEffectInput = wrapper.find('[data-testid="taints-effect-row-0"]');

    expect(firstEffectInput.exists()).toBe(true);

    expect(firstEffectInput.attributes().value).toBe('');
    expect(wrapper.vm.effectOptions).toStrictEqual(expectedEffectOptions);
  });

  it('should set the effect value to NoSchedule by default', async() => {
    const wrapper = mount(Taints, { props: { value: [] } });

    const taintKV = wrapper.findComponent('[data-testid="taints-keyvalue"]');

    taintKV.vm.add();
    await nextTick();

    const effectInput = wrapper.find('[data-testid="taints-effect-row-0"]');

    expect(effectInput.exists()).toBe(true);

    expect(effectInput.attributes().value).toStrictEqual('NoSchedule');

    expect(wrapper.vm.defaultAddData).toStrictEqual({ effect: 'NoSchedule' });
  });
});
