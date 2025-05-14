import { mount, VueWrapper } from '@vue/test-utils';
import { _EDIT } from '@shell/config/query-params';
import KnownHostsEditDialog from '@shell/dialog/KnownHostsEditDialog.vue';
import CodeMirror from '@shell/components/CodeMirror.vue';
import FileSelector from '@shell/components/form/FileSelector.vue';

let wrapper: VueWrapper<InstanceType<typeof KnownHostsEditDialog>>;

const mockedStore = () => {
  return { getters: { 'prefs/get': () => jest.fn() } };
};

const requiredSetup = () => {
  return { global: { mocks: { $store: mockedStore() } } };
};

describe('component: KnownHostsEditDialog', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="modals"></div>';
    wrapper = mount(KnownHostsEditDialog, {
      attachTo: document.body,
      props:    {
        mode:  _EDIT,
        value: 'line1\nline2\n'
      },
      ...requiredSetup(),
    });
  });

  afterEach(() => {
    wrapper.unmount();
    document.body.innerHTML = '';
  });

  it('should update text from CodeMirror', async() => {
    expect(wrapper.vm.text).toBe('line1\nline2\n');

    const codeMirror = wrapper.getComponent(CodeMirror);

    expect(codeMirror.element).toBeDefined();

    await codeMirror.setData({ loaded: true });

    // Emit CodeMirror value
    codeMirror.vm.$emit('onInput', 'bar');
    await codeMirror.vm.$nextTick();

    expect(wrapper.vm.text).toBe('bar');
  });

  it('should update text from FileSelector', async() => {
    expect(wrapper.vm.text).toBe('line1\nline2\n');

    const fileSelector = wrapper.getComponent(FileSelector);

    expect(fileSelector.element).toBeDefined();

    // Emit Fileselector value
    fileSelector.vm.$emit('selected', 'foo');
    await fileSelector.vm.$nextTick();

    expect(wrapper.vm.text).toBe('foo');
  });

  it('should save changes and close dialog', async() => {
    const closed = jest.spyOn(wrapper.vm, 'closed');

    await wrapper.setData({ text: 'foo' });

    expect(wrapper.vm.value).toBe('line1\nline2\n');
    expect(wrapper.vm.text).toBe('foo');

    await wrapper.vm.closeDialog(true);

    expect(closed).toHaveBeenCalledWith({
      success: true,
      value:   'foo'
    });
  });

  it('should discard changes and close dialog', async() => {
    const closed = jest.spyOn(wrapper.vm, 'closed');

    await wrapper.setData({ text: 'foo' });

    expect(wrapper.vm.value).toBe('line1\nline2\n');
    expect(wrapper.vm.text).toBe('foo');

    await wrapper.vm.closeDialog(false);

    expect(closed).toHaveBeenCalledWith({
      success: false,
      value:   'line1\nline2\n'
    });
  });
});
