import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { RcDropdown } from '@components/RcDropdown';

const vDropdownMock = defineComponent({
  props:    { shown: Boolean },
  template: `
    <div class="popper">
      <slot name="popper" />
    </div>
  `,
});

describe('component: RcDropdown.vue', () => {
  it('should open when mounted open', () => {
    const wrapper = mount(RcDropdown, { props: { open: true }, global: { components: { 'v-dropdown': vDropdownMock } } });

    expect(wrapper.findComponent(vDropdownMock).props('shown')).toBe(true);
    expect(wrapper.emitted('update:open')).toStrictEqual([[true]]);
  });

  it('should not change the height if the dropdown fits within the screen', async() => {
    Object.defineProperty(window, 'innerHeight', { value: 800 });

    const wrapper = mount(RcDropdown, { global: { components: { 'v-dropdown': vDropdownMock } } });

    const dropdownTarget = wrapper.find('[dropdown-menu-collection]').element as HTMLElement;

    Object.defineProperty(dropdownTarget, 'getBoundingClientRect', {
      value: () => ({
        top:    200,
        bottom: 600,
        height: 400,
      }),
      writable: true,
    });

    await wrapper.findComponent(vDropdownMock).vm.$emit('apply-show');
    await wrapper.vm.$nextTick();

    expect(dropdownTarget.style.height).toBe('');
  });

  it('should apply correct height if dropdown exceeds the top edge', async() => {
    Object.defineProperty(window, 'innerHeight', { value: 800 });

    const wrapper = mount(RcDropdown, { global: { components: { 'v-dropdown': vDropdownMock } } });

    const dropdownTarget = wrapper.find('[dropdown-menu-collection]').element as HTMLElement;

    Object.defineProperty(dropdownTarget, 'getBoundingClientRect', {
      value: () => ({
        top:    2, // Exceeds (top - padding)
        bottom: 300,
        height: 298,
      }),
    });

    await wrapper.findComponent(vDropdownMock).vm.$emit('apply-show');
    await wrapper.vm.$nextTick();

    expect(dropdownTarget.style.height).toBe('268px');
  });

  it('should apply correct height if dropdown exceeds the bottom edge', async() => {
    Object.defineProperty(window, 'innerHeight', { value: 925 });

    const wrapper = mount(RcDropdown, { global: { components: { 'v-dropdown': vDropdownMock } } });

    const dropdownTarget = wrapper.find('[dropdown-menu-collection]').element as HTMLElement;

    Object.defineProperty(dropdownTarget, 'getBoundingClientRect', {
      value: () => ({
        top:    200,
        bottom: 920, // Exceeds (bottom + padding)
        height: 720,
      }),
    });

    await wrapper.findComponent(vDropdownMock).vm.$emit('apply-show');
    await wrapper.vm.$nextTick();

    expect(dropdownTarget.style.height).toBe('693px');
  });

  it('should apply correct height if dropdown exceeds both top and bottom edges', async() => {
    Object.defineProperty(window, 'innerHeight', { value: 400 });

    const wrapper = mount(RcDropdown, { global: { components: { 'v-dropdown': vDropdownMock } } });

    const dropdownTarget = wrapper.find('[dropdown-menu-collection]').element as HTMLElement;

    Object.defineProperty(dropdownTarget, 'getBoundingClientRect', {
      value: () => ({
        top:    -800, // Exceeds top
        bottom: 800, // Exceeds bottom
        height: 1600,
      }),
    });

    await wrapper.findComponent(vDropdownMock).vm.$emit('apply-show');
    await wrapper.vm.$nextTick();

    expect(dropdownTarget.style.height).toBe('368px');
  });

  describe('container prop', () => {
    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should render the popper container in place when no container is provided', () => {
      const wrapper = mount(RcDropdown, { global: { components: { 'v-dropdown': vDropdownMock } } });

      expect(wrapper.find('.popperContainer').exists()).toBe(true);
      expect(document.body.querySelector(':scope > .popperContainer')).toBeNull();

      wrapper.unmount();
    });

    it('should teleport the popper container to the body when container is "body"', () => {
      const wrapper = mount(RcDropdown, {
        props:  { container: 'body' },
        global: { components: { 'v-dropdown': vDropdownMock } },
      });

      expect(wrapper.find('.popperContainer').exists()).toBe(false);
      expect(document.body.querySelector(':scope > .popperContainer')).not.toBeNull();

      wrapper.unmount();
    });

    it('should teleport the popper container into a given element', () => {
      const target = document.createElement('div');

      document.body.appendChild(target);

      const wrapper = mount(RcDropdown, {
        props:  { container: target },
        global: { components: { 'v-dropdown': vDropdownMock } },
      });

      expect(target.querySelector(':scope > .popperContainer')).not.toBeNull();

      wrapper.unmount();
    });

    it('should still mount the popper inside the teleported popper container', async() => {
      const vDropdownWithContainer = defineComponent({
        props:    { container: { type: Object, default: null } },
        template: '<div class="popper" />',
      });

      const wrapper = mount(RcDropdown, {
        props:  { container: 'body' },
        global: { components: { 'v-dropdown': vDropdownWithContainer } },
      });

      // The container ref is only populated once the first render has run
      await wrapper.vm.$nextTick();

      const teleported = document.body.querySelector(':scope > .popperContainer');

      expect(wrapper.findComponent(vDropdownWithContainer).props('container')).toBe(teleported);

      wrapper.unmount();
    });
  });
});
