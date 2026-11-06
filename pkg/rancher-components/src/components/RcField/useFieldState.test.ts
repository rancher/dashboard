import { defineComponent, h, ref, type PropType } from 'vue';
import { mount } from '@vue/test-utils';
import { provideFieldState, useFieldState } from './useFieldState';
import type { RcFieldMode } from './types';

const Consumer = defineComponent({
  props: {
    mode:     { type: String as PropType<RcFieldMode>, default: undefined },
    disabled: { type: Boolean, default: undefined },
  },
  setup(props) {
    const { mode, disabled, isView } = useFieldState(props);

    return () => h('span', {
      'data-mode':     mode.value,
      'data-disabled': `${ disabled.value }`,
      'data-view':     `${ isView.value }`,
    });
  },
});

const providerOf = (state: Parameters<typeof provideFieldState>[0], child: () => ReturnType<typeof h>) => defineComponent({
  setup(_, { slots }) {
    provideFieldState(state);

    return () => (slots.default ? slots.default() : child());
  },
});

const stateOf = (wrapper: ReturnType<typeof mount>) => {
  const span = wrapper.find('span');

  return {
    mode:     span.attributes('data-mode'),
    disabled: span.attributes('data-disabled'),
    view:     span.attributes('data-view'),
  };
};

describe('useFieldState', () => {
  it('defaults to an editable, enabled field without a provider', () => {
    const wrapper = mount(Consumer);

    expect(stateOf(wrapper)).toStrictEqual({
      mode: 'edit', disabled: 'false', view: 'false'
    });
  });

  it('inherits the provided mode and disabled state', () => {
    const Provider = providerOf({ mode: 'view', disabled: true }, () => h(Consumer));
    const wrapper = mount(Provider);

    expect(stateOf(wrapper)).toStrictEqual({
      mode: 'view', disabled: 'true', view: 'true'
    });
  });

  it.each([
    ['mode', { mode: 'edit' as RcFieldMode }, {
      mode: 'edit', disabled: 'true', view: 'false'
    }],
    ['disabled', { disabled: false }, {
      mode: 'view', disabled: 'false', view: 'true'
    }],
  ])('lets the field\'s own %s prop override the provider', (_, props, expected) => {
    const Provider = providerOf({ mode: 'view', disabled: true }, () => h(Consumer, props));
    const wrapper = mount(Provider);

    expect(stateOf(wrapper)).toStrictEqual(expected);
  });

  it('follows a provided ref as it changes', async() => {
    const mode = ref<RcFieldMode>('edit');
    const Provider = providerOf({ mode }, () => h(Consumer));
    const wrapper = mount(Provider);

    mode.value = 'view';
    await wrapper.vm.$nextTick();

    expect(stateOf(wrapper).mode).toStrictEqual('view');
  });

  it('accepts a getter', () => {
    const Provider = providerOf({ disabled: () => true }, () => h(Consumer));
    const wrapper = mount(Provider);

    expect(stateOf(wrapper).disabled).toStrictEqual('true');
  });

  it('lets a nested provider inherit what it leaves undefined', () => {
    const Inner = providerOf({ disabled: true }, () => h(Consumer));
    const Outer = providerOf({ mode: 'view' }, () => h(Inner));
    const wrapper = mount(Outer);

    expect(stateOf(wrapper)).toStrictEqual({
      mode: 'view', disabled: 'true', view: 'true'
    });
  });

  it('lets a nested provider override the outer one', () => {
    const Inner = providerOf({ mode: 'edit' }, () => h(Consumer));
    const Outer = providerOf({ mode: 'view', disabled: true }, () => h(Inner));
    const wrapper = mount(Outer);

    expect(stateOf(wrapper)).toStrictEqual({
      mode: 'edit', disabled: 'true', view: 'false'
    });
  });
});
