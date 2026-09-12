import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import FileSelectorTextArea from '@shell/components/form/FileSelectorTextArea.vue';
import FileSelector from '@shell/components/form/FileSelector.vue';
import TextAreaAutoGrow from '@components/Form/TextArea/TextAreaAutoGrow.vue';
import { _VIEW } from '@shell/config/query-params';

const DROP_OVERLAY = '[data-testid="file-selector-text-area__drop-overlay"]';

// The store the most recent mount was given, so a test can assert on what the component dispatched.
let store: any;

const mountComponent = (props = {}) => {
  store = createStore({});

  store.dispatch = jest.fn();

  return mount(FileSelectorTextArea, {
    props:  { label: 'Private Key', ...props },
    global: { plugins: [store] },
  });
};

const fileButton = (wrapper: any) => wrapper.find('[data-testid="file-selector__uploader-button"]');

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

  it('should keep the file selector default test id when no override is given', () => {
    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="file-selector__uploader-button"]').exists()).toBe(true);
  });

  it('should apply an overridden file selector test id', () => {
    const wrapper = mountComponent({ fileSelectorTestid: 'my-file-button' });

    expect(wrapper.find('[data-testid="my-file-button"]').exists()).toBe(true);
  });

  // Stack two of these on a form and both buttons read "Read from File", so a screen reader announces two
  // identically named buttons with nothing to say which field each one fills. `generic.readFromFileArea`
  // is "Read from File - {area}", so the name still leads with the text on the button.
  describe('the file button accessible name', () => {
    it('should name the field it fills, so two on a form can be told apart', () => {
      const privateKey = fileButton(mountComponent()).attributes('aria-label');
      const certificate = fileButton(mountComponent({ label: 'Certificate' })).attributes('aria-label');

      expect(privateKey).toBe('generic.readFromFileArea-{"area":"Private Key"}');
      expect(certificate).toBe('generic.readFromFileArea-{"area":"Certificate"}');
      expect(privateKey).not.toBe(certificate);
    });

    it('should resolve the field name from a label key too', () => {
      const wrapper = mountComponent({ label: undefined, labelKey: 'secret.certificate.privateKey' });

      expect(fileButton(wrapper).attributes('aria-label')).toBe('generic.readFromFileArea-{"area":"secret.certificate.privateKey"}');
    });

    // The visible text is untouched: WCAG 2.5.3 wants the accessible name to contain what is on screen,
    // or speaking the label stops selecting the control.
    it('should leave the visible button text alone', () => {
      expect(fileButton(mountComponent()).text()).toContain('generic.readFromFile');
    });

    it('should fall back to the plain name when the field has no label', () => {
      const wrapper = mountComponent({ label: undefined });

      expect(fileButton(wrapper).attributes('aria-label')).toBe('generic.readFromFile');
    });
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

  // growl/fromError reads `err`; dispatching `error` instead handed it undefined, and the user got a
  // growl titled "Error reading file" with nothing under it and no way to tell what had gone wrong.
  describe('when a dropped file cannot be read', () => {
    // A folder dropped on the field is the reachable case: FileReader fails it with a DOMException.
    const unreadable = () => {
      const file = new File([], 'a-folder', { type: '' });
      const failure = new DOMException('The requested file could not be read', 'NotReadableError');

      jest.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function(this: FileReader) {
        Object.defineProperty(this, 'error', { value: failure, configurable: true });
        this.onerror?.(new ProgressEvent('error') as ProgressEvent<FileReader>);
      });

      return { file, failure };
    };

    afterEach(() => jest.restoreAllMocks());

    it('should growl the reason the read failed', async() => {
      const wrapper = mountComponent();
      const { file, failure } = unreadable();

      await wrapper.find('.drop-zone').trigger('drop', fileDragEvent(['Files'], [file]));
      await flushFileRead(wrapper);

      expect(store.dispatch).toHaveBeenCalledWith('growl/fromError', { title: 'generic.errorReadingFile', err: failure }, { root: true });
    });

    it('should not emit a value when the read fails', async() => {
      const wrapper = mountComponent();
      const { file } = unreadable();

      await wrapper.find('.drop-zone').trigger('drop', fileDragEvent(['Files'], [file]));
      await flushFileRead(wrapper);

      expect(wrapper.emitted('update:value')).toBeUndefined();
    });
  });

  it('should reject a dropped file that exceeds the byte limit', async() => {
    const wrapper = mountComponent({ byteLimit: 1 });
    const file = new File(['dropped contents'], 'tls.crt', { type: 'text/plain' });

    await wrapper.find('.drop-zone').trigger('drop', fileDragEvent(['Files'], [file]));
    await flushFileRead(wrapper);

    expect(wrapper.emitted('update:value')).toBeUndefined();
  });
});
