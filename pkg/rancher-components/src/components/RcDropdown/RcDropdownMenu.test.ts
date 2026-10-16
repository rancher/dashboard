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
});
