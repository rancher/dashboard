import { mount } from '@vue/test-utils';
import CustomCommand from '@/edit/provisioning.cattle.io.cluster/CustomCommand.vue';

describe('component: CustomCommand', () => {
  it('should add more items', () => {
    const token = 'MY_TOKEN';
    const ip = 'MY_IP';
    const checkSum = 'MY_CHECKSUM';
    const wrapper = mount(CustomCommand, {
      mocks: {
        propsData: {
          cluster:      {},
          clusterToken: {
            insecureWindowsNodeCommand: ` curl.exe --insecure -fL ${ ip }/wins-agent-install.ps1 -o install.ps1; Set-ExecutionPolicy Bypass -Scope Process -Force; ./install.ps1 -Server ${ ip } -Label 'cattle.io / os=windows' -Token ${ token } -Worker -CaChecksum ${ checkSum }`,
            windowsNodeCommand:         `curl.exe -fL ${ ip }/wins-agent-install.ps1 -o install.ps1; Set-ExecutionPolicy Bypass -Scope Process -Force; ./install.ps1 -Server ${ ip } -Label 'cattle.io/os=windows' -Token ${ token } -Worker -CaChecksum ${ checkSum }`
          }
        },
        data: {
          address:         '',
          controlPlane:    true,
          etcd:            true,
          insecure:        false,
          internalAddress: '',
          labels:          {},
          nodeName:        '',
          taints:          [],
          worker:          true,
        },
        $store: { getters: { 'i18n/t': jest.fn() } }
      },
    });
    const value = `curl -fL ${ ip }/system-agent-install.sh | sudo  sh -s - --server ${ ip } --label 'cattle.io/os=linux' --token ${ token } --ca-checksum ${ checkSum } --etcd --controlplane --worker`;
    const element = wrapper.find('code').element;

    expect(element.textContent).toBe(value);
  });
});
