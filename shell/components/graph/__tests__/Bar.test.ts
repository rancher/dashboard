import { shallowMount } from '@vue/test-utils';
import Bar from '@shell/components/graph/Bar.vue';

describe('component: Bar', () => {
  describe('height', () => {
    // The default height comes from the styles, so css overrides of .bar keep working
    it('should not set an inline height or border radius when height is not provided', () => {
      const wrapper = shallowMount(Bar, { props: { percentage: 50 } });

      const bar = wrapper.find('.bar').element as HTMLElement;

      expect(bar.style.height).toStrictEqual('');
      expect(bar.style.borderRadius).toStrictEqual('');
    });

    it.each([
      [4, '4px', '2px'],
      [20, '20px', '10px'],
    ])('should render a %ipx bar with height %s and border radius %s', (height, expectedHeight, expectedRadius) => {
      const wrapper = shallowMount(Bar, { props: { percentage: 50, height } });

      const bar = wrapper.find('.bar').element as HTMLElement;

      expect(bar.style.height).toStrictEqual(expectedHeight);
      expect(bar.style.borderRadius).toStrictEqual(expectedRadius);
    });
  });

  it('should keep the secondary color as the bar background', () => {
    const wrapper = shallowMount(Bar, { props: { percentage: 50, secondaryColor: '--muted' } });

    // jsdom drops css variables from inline styles, so check the computed style instead
    expect(wrapper.vm.barStyle.backgroundColor).toStrictEqual('var(--muted)');
  });
});
