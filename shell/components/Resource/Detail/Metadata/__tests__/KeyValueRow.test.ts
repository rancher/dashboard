import { mount } from '@vue/test-utils';
import KeyValueRow from '@shell/components/Resource/Detail/Metadata/KeyValueRow.vue';
import Preview from '@shell/components/Resource/Detail/Preview/Preview.vue';
import { copyTextToClipboard } from '@shell/utils/clipboard';

jest.mock('@shell/utils/clipboard', () => ({ copyTextToClipboard: jest.fn() }));
jest.mock('vuex', () => ({ useStore: () => { } }));

describe('component: KeyValueRow', () => {
  const mockRow = {
    key:   'test-key',
    value: 'test-value',
  };

  const global = {
    stubs: {
      RcButton: { template: '<button><slot/></button>' },
      RcTag:    { template: '<div><slot/></div>' },
    },
    directives: { cleanHtml: (identity: any) => identity, t: (identity: any) => identity },
  };

  beforeEach(() => {
    // Create a teleport target
    const teleportTarget = document.createElement('div');

    teleportTarget.id = 'preview';
    document.body.appendChild(teleportTarget);
  });

  afterEach(() => {
    document.getElementById('preview')?.remove();
    jest.clearAllMocks();
  });

  it('should render the key and value', () => {
    const wrapper = mount(KeyValueRow, {
      props: {
        row:  mockRow,
        type: 'active',
      },
      global
    });

    const tagData = wrapper.find('.tag-data');

    expect(tagData.exists()).toBe(true);
    expect(tagData.text()).toBe(`${ mockRow.key }: ${ mockRow.value }`);
  });

  it('should show the preview component on click', async() => {
    const wrapper = mount(KeyValueRow, {
      props: {
        row:  mockRow,
        type: 'active',
      },
      global
    });

    expect(wrapper.findComponent(Preview).exists()).toBe(false);

    await wrapper.find('button').trigger('click');

    expect(wrapper.findComponent(Preview).exists()).toBe(true);
  });

  it('should hide the preview component on close', async() => {
    const wrapper = mount(KeyValueRow, {
      props: {
        row:  mockRow,
        type: 'active',
      },
      global
    });

    expect(wrapper.findComponent(Preview).exists()).toBe(false);

    await wrapper.find('button').trigger('click');

    expect(wrapper.findComponent(Preview).exists()).toBe(true);

    const preview = wrapper.findComponent({ name: 'Preview' });

    preview.vm.$emit('close');
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent(Preview).exists()).toBe(false);
  });

  it('should contain a copy to clipboard component and call copy on click', async() => {
    const wrapper = mount(KeyValueRow, {
      props: {
        row:  mockRow,
        type: 'active',
      },
      global
    });

    const copyToClipboard = wrapper.findComponent({ name: 'CopyToClipboard' });

    expect(copyToClipboard.exists()).toBe(true);
    expect(copyToClipboard.props('value')).toBe(mockRow.value);

    await copyToClipboard.trigger('click');

    expect(copyTextToClipboard).toHaveBeenCalledWith(mockRow.value);
  });
});
