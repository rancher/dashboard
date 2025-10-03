import { mount } from '@vue/test-utils';
import Preview from '@shell/components/Resource/Detail/Preview/Preview.vue';
import { useBasicSetupFocusTrap } from '@shell/composables/focusTrap';

jest.mock('@shell/utils/clipboard', () => ({ copyTextToClipboard: jest.fn() }));
jest.mock('@shell/composables/focusTrap', () => ({ useBasicSetupFocusTrap: jest.fn() }));

const teleportTarget = document.createElement('div');

teleportTarget.id = 'preview';
document.body.appendChild(teleportTarget);

describe('component: Resource Detail Preview', () => {
  const global = {
    stubs: {
      Teleport:        true,
      Content:         true,
      CopyToClipboard: true,
    },
  };
  const anchorElement = document.createElement('div');

  // Mock getBoundingClientRect
  anchorElement.getBoundingClientRect = () => ({
    x:      100,
    y:      100,
    width:  50,
    height: 20,
    top:    100,
    left:   100,
    right:  150,
    bottom: 120,
    toJSON: () => ({}),
  });

  it('should render title and pass value to children', () => {
    const wrapper = mount(Preview, {
      props: {
        title: 'My Test Title',
        value: 'My test value',
        anchorElement,
      },
      global
    });

    // Test title
    const titleDiv = wrapper.find('.title');

    expect(titleDiv.exists()).toBe(true);
    expect(titleDiv.text()).toBe('My Test Title');

    // Test props passed to Content
    const content = wrapper.findComponent({ name: 'Content' });

    expect(content.exists()).toBe(true);
    expect(content.props('value')).toBe('My test value');

    // Test props passed to CopyToClipboard
    const copy = wrapper.findComponent({ name: 'CopyToClipboard' });

    expect(copy.exists()).toBe(true);
    expect(copy.props('value')).toBe('My test value');
  });

  it('should emit close on focusout', async() => {
    const wrapper = mount(Preview, {
      props: {
        title: 'Test',
        value: 'Value',
        anchorElement,
      },
      global
    });

    const previewDiv = wrapper.find('.preview');

    await previewDiv.trigger('focusout');

    expect(wrapper.emitted('close')).toBeTruthy();
    expect(wrapper.emitted('close')?.[0]).toStrictEqual([false]);
  });

  it('should emit close with true on Escape keydown', async() => {
    const wrapper = mount(Preview, {
      props: {
        title: 'Test',
        value: 'Value',
        anchorElement,
      },
      global
    });

    const previewDiv = wrapper.find('.preview');

    // Spy on blur to see if it's called
    const blurSpy = jest.spyOn(previewDiv.element, 'blur');

    await previewDiv.trigger('keydown.Escape');

    expect(blurSpy).toHaveBeenCalledWith();

    // Manually trigger focusout as jsdom doesn't do it automatically on blur()
    await previewDiv.trigger('focusout');

    expect(wrapper.emitted('close')).toBeTruthy();
    expect(wrapper.emitted('close')?.[0]).toStrictEqual([true]);
  });

  it('should call focus trap composable', () => {
    mount(Preview, {
      props: {
        title: 'Test',
        value: 'Value',
        anchorElement,
      },
      global
    });

    expect(useBasicSetupFocusTrap).toHaveBeenCalledWith('#focus-trap-preview-container-element');
  });
});
