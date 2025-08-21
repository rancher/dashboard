import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { RcDropdown } from '@components/RcDropdown';

const vDropdownMock = defineComponent({
  template: `
    <div class="popper">
      <slot name="popper" />
    </div>
  `,
});

describe('component: RcDropdown.vue', () => {
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
});
