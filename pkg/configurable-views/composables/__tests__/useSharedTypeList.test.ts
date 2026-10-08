import { defineComponent, h, ref, type Ref } from 'vue';
import { mount } from '@vue/test-utils';
import { useSharedTypeList } from '@pkg/configurable-views/composables/useSharedTypeList';

// A table that only reports how often it has been told to rebuild.
function table(key: Ref<string | null>) {
  const wrapper = mount(defineComponent({
    setup() {
      const generation = useSharedTypeList(() => key.value);

      return () => h('div', String(generation.value));
    },
  }));

  return { wrapper };
}

describe('useSharedTypeList', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('rebuilds the tables of a type left on the page when one of them goes', async() => {
    const a = table(ref('management/provisioning.cattle.io.cluster'));
    const b = table(ref('management/provisioning.cattle.io.cluster'));

    a.wrapper.unmount();
    jest.runAllTimers();
    await b.wrapper.vm.$nextTick();

    expect(b.wrapper.text()).toBe('1');
    b.wrapper.unmount();
  });

  it('leaves tables of other types, and a table on its own, alone', async() => {
    const a = table(ref('management/one'));
    const b = table(ref('management/two'));
    const c = table(ref(null));

    a.wrapper.unmount();
    c.wrapper.unmount();
    jest.runAllTimers();
    await b.wrapper.vm.$nextTick();

    expect(b.wrapper.text()).toBe('0');
    b.wrapper.unmount();
  });

  it('rebuilds the others when a table changes to another type', async() => {
    const key = ref<string | null>('management/one');
    const a = table(key);
    const b = table(ref('management/one'));

    key.value = 'management/two';
    await a.wrapper.vm.$nextTick();
    jest.runAllTimers();
    await b.wrapper.vm.$nextTick();

    expect(b.wrapper.text()).toBe('1');
    a.wrapper.unmount();
    b.wrapper.unmount();
  });
});
