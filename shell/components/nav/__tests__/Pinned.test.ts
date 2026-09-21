import { shallowMount } from '@vue/test-utils';
import Pinned from '@shell/components/nav/Pinned.vue';

const mountPinned = (pinned: boolean, tabOrder: number | null = 0) => {
  const cluster = {
    label: 'local',
    pinned,
    pin:   jest.fn(),
    unpin: jest.fn(),
  };

  const wrapper = shallowMount(Pinned as any, { props: { cluster, tabOrder } });

  return { wrapper, cluster };
};

describe('component: Pinned', () => {
  describe('aria attributes', () => {
    it.each([
      ['pinned', true, 'true'],
      ['unpinned', false, 'false'],
    ])('should expose the %s state as aria-pressed="%s"', (_label, pinned, expected) => {
      const { wrapper } = mountPinned(pinned as boolean);

      expect(wrapper.attributes('aria-pressed')).toStrictEqual(expected);
    });

    // A native button does not support aria-checked, which axe reports as a critical
    // aria-allowed-attr violation. The toggle state has to ride on aria-pressed.
    it.each([
      ['pinned', true],
      ['unpinned', false],
    ])('should not set aria-checked when %s', (_label, pinned) => {
      const { wrapper } = mountPinned(pinned as boolean);

      expect(wrapper.attributes('aria-checked')).toBeUndefined();
    });

    // A real <button>, not an <i role="button">: it may then sit beside a row's own control without
    // nesting one interactive element inside another, and Enter/Space come from the platform.
    it('should be a native button with a descriptive aria-label', () => {
      const { wrapper } = mountPinned(false);

      expect(wrapper.element.tagName).toStrictEqual('BUTTON');
      expect(wrapper.attributes('type')).toStrictEqual('button');
      expect(wrapper.attributes('role')).toBeUndefined();
      expect(wrapper.attributes('aria-label')).toContain('nav.ariaLabel.pinCluster');
    });

    it.each([
      ['reachable', 0, '0'],
      ['unreachable', -1, '-1'],
    ])('should be keyboard %s when tabOrder is %s', (_label, tabOrder, expected) => {
      const { wrapper } = mountPinned(false, tabOrder as number);

      expect(wrapper.attributes('tabindex')).toStrictEqual(expected);
    });
  });

  describe('toggling', () => {
    it('should pin an unpinned cluster on click', async() => {
      const { wrapper, cluster } = mountPinned(false);

      await wrapper.trigger('click');

      expect(cluster.pin).toHaveBeenCalledWith();
      expect(cluster.unpin).not.toHaveBeenCalledWith();
    });

    it('should unpin a pinned cluster on click', async() => {
      const { wrapper, cluster } = mountPinned(true);

      await wrapper.trigger('click');

      expect(cluster.unpin).toHaveBeenCalledWith();
      expect(cluster.pin).not.toHaveBeenCalledWith();
    });

    // Enter and Space are the platform's on a <button>; they arrive as a click, so there is no key
    // handler of our own left to test.
    it('should tell the surface which way it toggled, so focus can be moved before the row goes', async() => {
      const { wrapper, cluster } = mountPinned(true);

      await wrapper.trigger('click');

      expect(cluster.unpin).toHaveBeenCalledWith();
      expect(wrapper.emitted('unpinned')?.length).toStrictEqual(1);
      expect(wrapper.emitted('pinned')).toBeUndefined();
    });

    it('should report a pin as pinned', async() => {
      const { wrapper } = mountPinned(false);

      await wrapper.trigger('click');

      expect(wrapper.emitted('pinned')?.length).toStrictEqual(1);
      expect(wrapper.emitted('unpinned')).toBeUndefined();
    });
  });
});
