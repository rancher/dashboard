import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import Taints from '@shell/components/form/Taints.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';

/**
 * `Select` takes its value through the `labeledFormElement` mixin, so `modelValue`
 * — the name @vue/test-utils reports for the v-model binding — is absent from its
 * typed props; a bare string selector additionally yields a `WrapperLike`, which
 * has no `props()` at all.
 */
const modelValueOf = (wrapper: unknown): unknown => (wrapper as { props(): { modelValue: unknown } }).props().modelValue;

describe('component: Taints', () => {
  it('should accept custom effect values', async() => {
    const customEffects = { FOO_EFFECT: 'foo', BAR_EFFECT: 'bar' };

    const wrapper = mount(Taints, {
      props: {
        value:        [{ effect: 'FOO_EFFECT', value: 'abc' }],
        effectValues: customEffects
      }
    });

    const firstEffectInput = wrapper.findComponent('[data-testid="taints-effect-row-0"]');

    expect(firstEffectInput.exists()).toBe(true);

    expect(modelValueOf(firstEffectInput)).toBe('FOO_EFFECT');
    expect(wrapper.vm.effectOptions).toStrictEqual([{ value: 'FOO_EFFECT', label: 'foo' }, { value: 'BAR_EFFECT', label: 'bar' }]);

    const taintKV = wrapper.findComponent<typeof KeyValue>('[data-testid="taints-keyvalue"]');

    taintKV.vm.add();
    await nextTick();

    const secondEffectInput = wrapper.findComponent('[data-testid="taints-effect-row-1"]');

    expect(secondEffectInput.exists()).toBe(true);

    expect(modelValueOf(secondEffectInput)).toBe('FOO_EFFECT');
    expect(wrapper.vm.defaultAddData).toStrictEqual({ effect: 'FOO_EFFECT' });
  });

  it('should use default effect values of NoSchedule, PreferNoSchedule, and PreferNoExecute', async() => {
    const expectedEffectOptions = [
      { label: 'NoSchedule', value: 'NoSchedule' },
      { label: 'PreferNoSchedule', value: 'PreferNoSchedule' },

      { label: 'NoExecute', value: 'NoExecute' },

    ];

    const wrapper = mount(Taints, { props: { value: [{ effect: '', value: 'abc' }] } });

    const firstEffectInput = wrapper.findComponent('[data-testid="taints-effect-row-0"]');

    expect(firstEffectInput.exists()).toBe(true);

    expect(modelValueOf(firstEffectInput)).toBe('');
    expect(wrapper.vm.effectOptions).toStrictEqual(expectedEffectOptions);
  });

  it('should set the effect value to NoSchedule by default', async() => {
    const wrapper = mount(Taints, { props: { value: [] } });

    const taintKV = wrapper.findComponent<typeof KeyValue>('[data-testid="taints-keyvalue"]');

    taintKV.vm.add();
    await nextTick();

    const effectInput = wrapper.findComponent('[data-testid="taints-effect-row-0"]');

    expect(effectInput.exists()).toBe(true);

    expect(modelValueOf(effectInput)).toStrictEqual('NoSchedule');

    expect(wrapper.vm.defaultAddData).toStrictEqual({ effect: 'NoSchedule' });
  });
});
