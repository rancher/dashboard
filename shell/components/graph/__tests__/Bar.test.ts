import { shallowMount } from '@vue/test-utils';
import Bar from '@shell/components/graph/Bar.vue';

describe('component: Bar', () => {
  describe('size', () => {
    it('should render the medium size when size is not provided', () => {
      const wrapper = shallowMount(Bar, { props: { percentage: 50 } });

      expect(wrapper.find('.bar').classes()).toStrictEqual(['bar', 'medium']);
    });

    it.each(['small', 'medium'])('should render the %s size', (size) => {
      const wrapper = shallowMount(Bar, { props: { percentage: 50, size } });

      expect(wrapper.find('.bar').classes()).toStrictEqual(['bar', size]);
    });

    // The height comes from the styles, so css overrides of .bar keep working
    it('should not set an inline height', () => {
      const wrapper = shallowMount(Bar, { props: { percentage: 50, size: 'small' } });

      const bar = wrapper.find('.bar').element as HTMLElement;

      expect(bar.style.height).toStrictEqual('');
    });

    it.each([
      ['small', true],
      ['medium', true],
      ['large', false],
      ['', false],
    ])('should validate %p as a size: %p', (size, valid) => {
      const validator = (Bar as any).props.size.validator;

      expect(validator(size)).toStrictEqual(valid);
    });
  });

  it('should keep the secondary color as the bar background', () => {
    const wrapper = shallowMount(Bar, { props: { percentage: 50, secondaryColor: '--muted' } });

    // jsdom drops css variables from inline styles, so check the computed style instead
    expect(wrapper.vm.barStyle.backgroundColor).toStrictEqual('var(--muted)');
  });
});
