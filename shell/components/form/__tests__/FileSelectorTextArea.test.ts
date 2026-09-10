import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import FileSelectorTextArea from '@shell/components/form/FileSelectorTextArea.vue';
import FileSelector from '@shell/components/form/FileSelector.vue';
import TextAreaAutoGrow from '@components/Form/TextArea/TextAreaAutoGrow.vue';
import { _VIEW } from '@shell/config/query-params';

const DROP_OVERLAY = '[data-testid="file-selector-text-area__drop-overlay"]';

const mountComponent = (props = {}) => {
  const store = createStore({});

  store.dispatch = jest.fn();

  return mount(FileSelectorTextArea, {
    props:  { label: 'Private Key', ...props },
    global: { plugins: [store] },
  });
};

const fileDragEvent = (types = ['Files'], files: File[] = []) => ({ dataTransfer: { types, files } });

// Reading a dropped file resolves on a FileReader event, so give it a few ticks
const flushFileRead = async(wrapper: any) => {
  for (let i = 0; i < 20 && !wrapper.emitted('update:value'); i++) {
    await new Promise((resolve) => setTimeout(resolve));
  }
};

describe('component: FileSelectorTextArea', () => {
  it('should render a text area constrained to the min and max heights', () => {
    const wrapper = mountComponent();
    const textArea = wrapper.findComponent(TextAreaAutoGrow);

    expect(textArea.props('minHeight')).toBe(56);
    expect(textArea.props('maxHeight')).toBe(200);
    expect(textArea.props('resizeOnValueChangeAndResizeWindow')).toBe(true);
  });

  it('should render the file selector as a tertiary button alongside the drop hint', () => {
    const wrapper = mountComponent();

    expect(wrapper.findComponent(FileSelector).props('variant')).toBe('tertiary');
    expect(wrapper.find('.drop-hint').text()).toContain('fileSelectorTextArea.dropHint');
  });

  it('should not offer the file selector in view mode', () => {
    const wrapper = mountComponent({ mode: _VIEW });

    expect(wrapper.findComponent(FileSelector).exists()).toBe(false);
  });

  it('should emit the contents selected through the file selector', () => {
    const wrapper = mountComponent();

    wrapper.findComponent(FileSelector).vm.$emit('selected', 'file contents');

    expect(wrapper.emitted('update:value')).toStrictEqual([['file contents']]);
  });

  it('should show the drop overlay only while a file is dragged over the text area', async() => {
    const wrapper = mountComponent();
    const dropZone = wrapper.find('.drop-zone');

    expect(wrapper.find(DROP_OVERLAY).exists()).toBe(false);

    await dropZone.trigger('dragenter', fileDragEvent());
    expect(wrapper.find(DROP_OVERLAY).text()).toContain('fileSelectorTextArea.dropToReplace');

    await dropZone.trigger('dragleave');
    expect(wrapper.find(DROP_OVERLAY).exists()).toBe(false);
  });

  it('should ignore drags that carry no file', async() => {
    const wrapper = mountComponent();

    await wrapper.find('.drop-zone').trigger('dragenter', fileDragEvent(['text/plain']));

    expect(wrapper.find(DROP_OVERLAY).exists()).toBe(false);
  });

  it('should keep the overlay while dragging across the nested text area', async() => {
    const wrapper = mountComponent();
    const dropZone = wrapper.find('.drop-zone');

    await dropZone.trigger('dragenter', fileDragEvent());
    await dropZone.trigger('dragenter', fileDragEvent());
    await dropZone.trigger('dragleave');

    expect(wrapper.find(DROP_OVERLAY).exists()).toBe(true);
  });

  it('should not offer a drop target in view mode', async() => {
    const wrapper = mountComponent({ mode: _VIEW });

    await wrapper.find('.drop-zone').trigger('dragenter', fileDragEvent());

    expect(wrapper.find(DROP_OVERLAY).exists()).toBe(false);
  });

  it('should emit the contents of a dropped file', async() => {
    const wrapper = mountComponent();
    const file = new File(['dropped contents'], 'tls.crt', { type: 'text/plain' });

    await wrapper.find('.drop-zone').trigger('drop', fileDragEvent(['Files'], [file]));
    await flushFileRead(wrapper);

    expect(wrapper.emitted('update:value')).toStrictEqual([['dropped contents']]);
    expect(wrapper.find(DROP_OVERLAY).exists()).toBe(false);
  });

  it('should reject a dropped file that exceeds the byte limit', async() => {
    const wrapper = mountComponent({ byteLimit: 1 });
    const file = new File(['dropped contents'], 'tls.crt', { type: 'text/plain' });

    await wrapper.find('.drop-zone').trigger('drop', fileDragEvent(['Files'], [file]));
    await flushFileRead(wrapper);

    expect(wrapper.emitted('update:value')).toBeUndefined();
  });
});
