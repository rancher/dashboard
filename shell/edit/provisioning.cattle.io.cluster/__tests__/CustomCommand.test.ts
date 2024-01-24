import { mount } from '@vue/test-utils';
import CustomCommand from '@shell/edit/provisioning.cattle.io.cluster/CustomCommand.vue';
import { cleanHtmlDirective } from '@shell/plugins/clean-html-directive';
jest.mock('@shell/utils/clipboard', () => {
  return { copyTextToClipboard: jest.fn(() => Promise.resolve({})) };
});

describe('component: CustomCommand', () => {
  const token = 'MY_TOKEN';
  const ip = 'MY_IP';
  const checkSum = 'MY_CHECKSUM';
  const wrapper = mount(CustomCommand, {
    mocks: {
      $store: {
        getters: {
          currentStore:           () => 'current_store',
          'management/schemaFor': jest.fn(),
          'current_store/all':    jest.fn(),
          'i18n/t':               jest.fn(),
          'i18n/withFallback':    jest.fn(),
        }
      },
    },
    propsData: {
      cluster:      {},
      clusterToken: {
        insecureNodeCommand: ` curl --insecure -fL ${ ip }/system-agent-install.sh | sudo  sh -s - --server ${ ip } --label 'cattle.io/os=linux' --token ${ token } --ca-checksum ${ checkSum }`,
        nodeCommand:         ` curl -fL ${ ip }/system-agent-install.sh | sudo  sh -s - --server ${ ip } --label 'cattle.io/os=linux' --token ${ token } --ca-checksum ${ checkSum }`
      }
    },
    data: () => ({
      address:         '',
      controlPlane:    true,
      etcd:            true,
      insecure:        false,
      internalAddress: '',
      labels:          {},
      nodeName:        '',
      taints:          [],
      worker:          true,
    }),

    directives: { cleanHtmlDirective }
  });

  it('should return linux commands with the right flags based on cluster information', () => {
    const value = `curl -fL ${ ip }/system-agent-install.sh | sudo  sh -s - --server ${ ip } --label 'cattle.io/os=linux' --token ${ token } --ca-checksum ${ checkSum } --etcd --controlplane --worker`;
    const element = wrapper.find('#copiedLinux').element;

    expect(element.textContent).toContain(value);
  });

  it('should not display warning message if all node roles are selected', async() => {
    await wrapper.setData({
      controlPlane: true,
      etcd:         true,
      worker:       true,
    });

    const element = wrapper.find('[data-testid="node-role-warning"]').element;

    expect(element).toBeUndefined();
  });

  describe('should display warning message if at least one of the node roles is unselected', () => {
    it.each([
      [true, true, false],
      [true, false, true],
      [true, false, false],
      [false, true, true],
      [false, true, false],
      [false, false, true],
      [false, false, false],
    ])('controlPlane: %p, etcd: %p, worker: %p', async(
      controlPlane,
      etcd,
      worker
    ) => {
      await wrapper.setData({
        controlPlane,
        etcd,
        worker
      });

      const element = wrapper.find('[data-testid="node-role-warning"]').element;

      expect(element).toBeDefined();
    });
  });
});
