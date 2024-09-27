import { nextTick } from 'vue';
import { shallowMount } from '@vue/test-utils';
import ContainerLogs from '@shell/components/nav/WindowManager/ContainerLogs.vue';
import { base64Encode } from '@shell/utils/crypto';
import { Buffer } from 'buffer';
import { addEventListener } from '@shell/utils/socket';
// import VirtualList from 'vue3-virtual-scroll-list';

jest.mock('@shell/utils/socket');
// jest.mock(VirtualList, () => {});

const mockMyMethod = jest.fn();

jest.mock('vue3-virtual-scroll-list', () => ({ myMethod: () => mockMyMethod() }));

const getDefaultOptions = () => {
  return {
    propsData: {
      tab:    {},
      active: true,
      height: 100,
      pod:    {
        spec:  { nodeName: 'nodeId' },
        links: { view: 'url' },
        os:    'linux'
      },
    },
    data() {
      return { range: '30 minute' };
    },
    global: {
      mocks: {
        $store: {
          getters: {
            'prefs/get':    jest.fn(),
            'i18n/t':       jest.fn(),
            currentProduct: { inStore: 'cluster' }
          }
        }
      }
    }

  };
};

// eslint-disable-next-line jest/no-disabled-tests
describe('component: ContainerLogs', () => {
  it('should receive messages correctly', async() => {
    jest.clearAllMocks();
    const wrapper = await shallowMount(ContainerLogs, getDefaultOptions());

    const data1 = 'container logs test1\n';
    const messageCallback = addEventListener.mock.calls.find(([e]) => e === 'message')[1];

    messageCallback({ detail: { data: base64Encode(data1) } });

    await nextTick();
    expect(wrapper.vm.backlog).toHaveLength(1);
    expect(wrapper.vm.backlog[0].rawMsg).toBe(data1.trimEnd());
    const data2 = 'container logs test2 中文日志内容测试\n';

    messageCallback({ detail: { data: base64Encode(data2) } });
    await nextTick();
    expect(wrapper.vm.backlog).toHaveLength(2);
    expect(wrapper.vm.backlog[1].rawMsg).toBe(data2.trimEnd());
  });

  it('should not fail for an empty message/string', async() => {
    jest.clearAllMocks();
    const wrapper = await shallowMount(ContainerLogs, getDefaultOptions());

    const data1 = '';
    const messageCallback = addEventListener.mock.calls.find(([e]) => e === 'message')[1];

    messageCallback({ detail: { data: base64Encode(data1) } });
    await nextTick();
    expect(wrapper.vm.backlog).toHaveLength(0);
    expect(wrapper.vm.filtered).toHaveLength(0);
  });

  it('should merge the message which be truncated line', async() => {
    jest.clearAllMocks();
    const wrapper = await shallowMount(ContainerLogs, getDefaultOptions());
    const part1 = 'container logs part1';
    const messageCallback = addEventListener.mock.calls.find(([e]) => e === 'message')[1];

    messageCallback({ detail: { data: base64Encode(part1) } });
    await nextTick();

    expect(wrapper.vm.backlog).toHaveLength(0);
    const part2 = 'container logs part2\n';

    messageCallback({ detail: { data: base64Encode(part2) } });
    await nextTick();
    expect(wrapper.vm.backlog).toHaveLength(1);
    expect(wrapper.vm.backlog[0].rawMsg).toBe(`${ part1 }${ part2 }`.trimEnd());
  });

  it('should merge truncated 2-byte utf-8 character messages', async() => {
    jest.clearAllMocks();
    const wrapper = await shallowMount(ContainerLogs, getDefaultOptions());
    // Contains 2-byte utf-8 character message with one character truncation
    const message = '¡¢£¤¥\n';
    const arr = Buffer.from(message);

    const part1 = arr.slice(0, 3).toString('base64');
    const part2 = arr.slice(3).toString('base64');

    const messageCallback = addEventListener.mock.calls.find(([e]) => e === 'message')[1];

    messageCallback({ detail: { data: part1 } });
    await nextTick();
    expect(wrapper.vm.backlog).toHaveLength(0);
    messageCallback({ detail: { data: part2 } });
    await nextTick();
    expect(wrapper.vm.backlog).toHaveLength(1);
    expect(wrapper.vm.backlog[0].rawMsg).toBe(message.trimEnd());
  });
  it('should merge truncated 3-byte utf-8 character messages', async() => {
    jest.clearAllMocks();
    const wrapper = await shallowMount(ContainerLogs, getDefaultOptions());
    // Contains 3-byte utf-8 character message with one character truncation
    const message = 'ࠀࠁࠂࠃ\n';
    const arr = Buffer.from(message);
    // Truncate at the fourth byte
    const part1 = arr.slice(0, 4).toString('base64');
    const part2 = arr.slice(4).toString('base64');

    const messageCallback = addEventListener.mock.calls.find(([e]) => e === 'message')[1];

    messageCallback({ detail: { data: part1 } });
    await nextTick();
    expect(wrapper.vm.backlog).toHaveLength(0);
    messageCallback({ detail: { data: part2 } });
    await nextTick();
    expect(wrapper.vm.backlog).toHaveLength(1);
    expect(wrapper.vm.backlog[0].rawMsg).toBe(message.trimEnd());

    // Truncate at the fifth byte
    const part3 = arr.slice(0, 5).toString('base64');
    const part4 = arr.slice(5).toString('base64');

    messageCallback({ detail: { data: part3 } });
    await nextTick();
    expect(wrapper.vm.backlog).toHaveLength(1);
    messageCallback({ detail: { data: part4 } });
    await nextTick();
    expect(wrapper.vm.backlog).toHaveLength(2);
    expect(wrapper.vm.backlog[1].rawMsg).toBe(message.trimEnd());
  });

  it('should merge truncated 4-byte utf-8 character messages', async() => {
    jest.clearAllMocks();
    const wrapper = await shallowMount(ContainerLogs, getDefaultOptions());
    // Contains 4-byte utf-8 character message with one character truncation
    const message = '𐀀𐀁𐀂𐀃\n';
    const arr = Buffer.from(message);

    // Truncate at the fifth byte
    const part1 = arr.slice(0, 5).toString('base64');
    const part2 = arr.slice(5).toString('base64');

    const messageCallback = addEventListener.mock.calls.find(([e]) => e === 'message')[1];

    messageCallback({ detail: { data: part1 } });
    await nextTick();
    expect(wrapper.vm.backlog).toHaveLength(0);
    messageCallback({ detail: { data: part2 } });
    await nextTick();
    expect(wrapper.vm.backlog).toHaveLength(1);
    expect(wrapper.vm.backlog[0].rawMsg).toBe(message.trimEnd());

    // Truncate at the sixth byte
    const part3 = arr.slice(0, 6).toString('base64');
    const part4 = arr.slice(6).toString('base64');

    messageCallback({ detail: { data: part3 } });
    await nextTick();
    expect(wrapper.vm.backlog).toHaveLength(1);
    messageCallback({ detail: { data: part4 } });
    await nextTick();
    expect(wrapper.vm.backlog).toHaveLength(2);
    expect(wrapper.vm.backlog[1].rawMsg).toBe(message.trimEnd());

    // Truncate at the seventh byte
    const part5 = arr.slice(0, 7).toString('base64');
    const part6 = arr.slice(7).toString('base64');

    messageCallback({ detail: { data: part5 } });
    await nextTick();
    expect(wrapper.vm.backlog).toHaveLength(2);
    messageCallback({ detail: { data: part6 } });
    await nextTick();
    expect(wrapper.vm.backlog).toHaveLength(3);
    expect(wrapper.vm.backlog[2].rawMsg).toBe(message.trimEnd());
  });
});
