import { mount } from '@vue/test-utils';
import LazyImage from '@shell/components/LazyImage.vue';

describe('component: LazyImage.vue', () => {
  const initialSrc = 'initial.jpg';
  const src = 'test.jpg';
  const errorSrc = 'error.jpg';

  beforeEach(() => {
    // Clear all mocks before each test to ensure test isolation
    jest.clearAllMocks();
  });

  it('renders the initial source image', () => {
    const wrapper = mount(LazyImage, {
      propsData: {
        initialSrc,
        src,
        errorSrc
      },
    });

    const img = wrapper.find('img');

    expect(img.attributes('src')).toBe(initialSrc);
  });

  it('does not load the main src image if not in viewport', async() => {
    const wrapper = mount(LazyImage, {
      propsData: {
        initialSrc,
        src,
        errorSrc
      },
    });

    const callback = window.IntersectionObserver.mock.calls[0][0];

    // eslint-disable-next-line node/no-callback-literal
    callback([{ isIntersecting: false }]);
    await wrapper.vm.$nextTick();

    const img = wrapper.find('img');

    expect(img.attributes('src')).toBe(initialSrc);
  });

  it('loads the main src image when it enters the viewport', async() => {
    const wrapper = mount(LazyImage, {
      propsData: {
        initialSrc,
        src,
        errorSrc
      },
    });

    // Manually trigger the intersection observer
    const callback = window.IntersectionObserver.mock.calls[0][0];

    // eslint-disable-next-line node/no-callback-literal
    callback([{ isIntersecting: true }]);

    await wrapper.vm.$nextTick();

    const img = wrapper.find('img');

    expect(img.attributes('src')).toBe(src);
  });

  it('loads the error image if the main src image fails to load', async() => {
    const wrapper = mount(LazyImage, {
      propsData: {
        initialSrc,
        src,
        errorSrc
      },
    });

    // Manually trigger the intersection observer
    const callback = window.IntersectionObserver.mock.calls[0][0];

    // eslint-disable-next-line node/no-callback-literal
    callback([{ isIntersecting: true }]);

    await wrapper.vm.$nextTick();

    const img = wrapper.find('img');

    img.trigger('error');

    await wrapper.vm.$nextTick();

    expect(img.attributes('src')).toBe(errorSrc);
  });

  it('loads a new src image if the src prop changes', async() => {
    const wrapper = mount(LazyImage, {
      propsData: {
        initialSrc,
        src,
        errorSrc
      },
    });

    // Manually trigger the intersection observer
    const callback = window.IntersectionObserver.mock.calls[0][0];

    // eslint-disable-next-line node/no-callback-literal
    callback([{ isIntersecting: true }]);

    await wrapper.vm.$nextTick();

    const newSrc = 'new.jpg';

    await wrapper.setProps({ src: newSrc });

    const img = wrapper.find('img');

    expect(img.attributes('src')).toBe(newSrc);
  });
});
