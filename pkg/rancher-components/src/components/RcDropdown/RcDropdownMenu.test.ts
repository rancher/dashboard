import { shallowMount } from '@vue/test-utils';
import RcDropdownMenu from '@components/RcDropdown/RcDropdownMenu.vue';
import { RcDropdown } from '@components/RcDropdown';

describe('component: RcDropdownMenu.vue', () => {
  describe('container prop', () => {
    it('should forward the container to RcDropdown', () => {
      const wrapper = shallowMount(RcDropdownMenu, { props: { options: [], container: 'body' } });

      expect(wrapper.findComponent(RcDropdown).props('container')).toStrictEqual('body');
    });

    it('should not set a container on RcDropdown when none is provided', () => {
      const wrapper = shallowMount(RcDropdownMenu, { props: { options: [] } });

      expect(wrapper.findComponent(RcDropdown).props('container')).toBeUndefined();
    });
  });

  describe('open prop', () => {
    it('should forward open to RcDropdown', () => {
      const wrapper = shallowMount(RcDropdownMenu, { props: { options: [], open: true } });

      expect(wrapper.findComponent(RcDropdown).props('open')).toBe(true);
    });

    it('should leave RcDropdown closed when open is not provided', () => {
      const wrapper = shallowMount(RcDropdownMenu, { props: { options: [] } });

      expect(wrapper.findComponent(RcDropdown).props('open')).toBe(false);
    });
  });
});
