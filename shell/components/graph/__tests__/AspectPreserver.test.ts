import { mount } from '@vue/test-utils';
import AspectPreserver from '@shell/components/graph/AspectPreserver.vue';
import * as reveal from '@components/utils/reveal';

describe('component: AspectPreserver', () => {
  let observeReveal: jest.SpyInstance;
  let stopObservingReveal: jest.Mock;

  // jsdom has no layout, so give the wrapper divs a size to measure
  const setSize = (wrapper: ReturnType<typeof mount>, width: number, height: number) => {
    (wrapper.find('.aspect--outer').element as HTMLElement).getBoundingClientRect = () => ({ width } as DOMRect);
    (wrapper.find('.aspect--inner').element as HTMLElement).getBoundingClientRect = () => ({ height } as DOMRect);
  };

  const mountPreserver = () => mount(AspectPreserver, { slots: { default: `<template #default="{ graphWidth, graphHeight }"><span class="size">{{ graphWidth }}x{{ graphHeight }}</span></template>` } });

  beforeEach(() => {
    stopObservingReveal = jest.fn();
    observeReveal = jest.spyOn(reveal, 'observeReveal').mockReturnValue(stopObservingReveal);
  });

  afterEach(() => {
    observeReveal.mockRestore();
  });

  it('should pass the measured size to the slot once mounted', () => {
    const wrapper = mountPreserver();

    expect(wrapper.find('.size').text()).toStrictEqual('0x0');
  });

  it('should watch the outer element for being shown', () => {
    const wrapper = mountPreserver();

    expect(observeReveal).toHaveBeenCalledWith(wrapper.find('.aspect--outer').element, expect.any(Function));
  });

  it('should measure again when shown after mounting hidden', async() => {
    const wrapper = mountPreserver();

    setSize(wrapper, 400, 300);
    (observeReveal.mock.calls[0][1] as () => void)();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.size').text()).toStrictEqual('400x300');
  });

  it('should stop watching when unmounted', () => {
    const wrapper = mountPreserver();

    wrapper.unmount();

    expect(stopObservingReveal).toHaveBeenCalledWith();
  });
});
