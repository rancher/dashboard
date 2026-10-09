import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';
import { useSplitResize } from '@shell/composables/useSplitResize';

describe('composable: useSplitResize', () => {
  let width: number;
  let rect: jest.SpyInstance;

  beforeEach(() => {
    width = 1000;
    rect = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
      width, left: 0, top: 0, right: width, bottom: 0, height: 0, x: 0, y: 0, toJSON: () => ({})
    }));
  });

  afterEach(() => {
    rect.mockRestore();
  });

  // the composable, used by a component whose root is the container
  const mountSplit = (options = {}) => {
    let split: ReturnType<typeof useSplitResize> | undefined;

    mount(defineComponent({
      setup() {
        const container = ref<HTMLElement>();

        split = useSplitResize(container, options);

        return { container };
      },
      template: '<div ref="container" />',
    }));

    return split as ReturnType<typeof useSplitResize>;
  };

  it('should give the css the limits of the width as custom properties', () => {
    expect(mountSplit({ minPx: 150, maxPercent: 70 }).limits).toStrictEqual({ '--split-min': '150px', '--split-max': '70%' });
  });

  // aria-valuemin and aria-valuemax describe the range the css allows, not 0 to 100
  it('should report the minimum width as a percentage of the container, measured when mounted', () => {
    expect(mountSplit().minPercent.value).toBe(20);
  });

  it('should report the maximum width as given', () => {
    expect(mountSplit({ maxPercent: 55 }).maxPercent).toBe(55);
  });

  it('should not report a minimum above the maximum in a narrow container', () => {
    width = 300;

    expect(mountSplit().minPercent.value).toBe(60);
  });

  it.each([
    ['below the minimum', 10, 20],
    ['between the limits', 30, 30],
    ['above the maximum', 80, 60],
  ])('should report a width %s as the css limits it', (_label, percent, expected) => {
    const split = mountSplit();

    split.percent.value = percent;

    expect(split.valueNow.value).toBe(expected);
  });

  it('should measure the container again when the separator is focused', async() => {
    const split = mountSplit();

    width = 500;
    split.onFocus();
    await nextTick();

    expect(split.minPercent.value).toBe(40);
  });
});
