/* eslint-disable jest/no-hooks */
import FileImageSelector from '@shell/components/form/FileImageSelector';
import { mount } from '@vue/test-utils';
import FileSelector from '@shell/components/form/FileSelector';

describe('component: FileImageSelector', () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = mount(FileImageSelector, {
      props:   { label: 'upload' },
      methods: {},
      global:  { mocks: {} },
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it('should render', () => {
    const uploadButton = wrapper.find('.btn');

    expect(wrapper.isVisible()).toBe(true);
    expect(uploadButton.exists()).toBeTruthy();
  });
  it('should throw error if file could not be uploaded', async() => {
    const fs = wrapper.findComponent(FileSelector);

    expect(fs.exists()).toBeTruthy();
    await fs.vm.$emit('error');

    expect(wrapper.emitted('error')).toHaveLength(1);
  });

  it('should emit input on image upload', async() => {
    const fs = wrapper.findComponent(FileSelector);

    await fs.vm.$emit('selected');
    expect(wrapper.emitted('update:value')).toHaveLength(1);
  });
});
