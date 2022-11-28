import { mount } from '@vue/test-utils';
import CustomCommand from '@shell/edit/provisioning.cattle.io.cluster/CustomCommand.vue';

describe('component: CustomCommand', () => {
  it('should return linux commands with the right flags based on cluster information', () => {
    const token = 'MY_TOKEN';
    const ip = 'MY_IP';
    const checkSum = 'MY_CHECKSUM';
    const wrapper = mount(CustomCommand, {
      propsData: {
        cluster:      {},
        clusterToken: {
          insecureNodeCommand: ` curl --insecure -fL ${ ip }/system-agent-install.sh | sudo  sh -s - --server ${ ip } --label 'cattle.io/os=linux' --token ${ token } --ca-checksum ${ checkSum }`,
          nodeCommand:         ` curl -fL ${ ip }/system-agent-install.sh | sudo  sh -s - --server ${ ip } --label 'cattle.io/os=linux' --token ${ token } --ca-checksum ${ checkSum }`
        }
      },
      // stubs: { CopyCode: { template: '<div></div> ' } },
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
    });

    const value = `curl -fL ${ ip }/system-agent-install.sh | sudo  sh -s - --server ${ ip } --label 'cattle.io/os=linux' --token ${ token } --ca-checksum ${ checkSum } --etcd --controlplane --worker`;
    const element = wrapper.find('#copiedLinux').element;

    expect(element.textContent).toContain(value);
  });
});
