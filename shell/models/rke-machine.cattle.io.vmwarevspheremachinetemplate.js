import { formatSi } from '@shell/utils/units';
import MachineTemplate from './rke-machine.cattle.io.machinetemplate';

export default class VmwarevsphereMachineTemplate extends MachineTemplate {
  get provider() {
    return 'vmwarevsphere';
  }

  get providerSize() {
    const size = formatSi(this.spec.template.spec.memorySize * 1048576, 1024, 'iB');

    return `${ size }, ${ this.spec.template.spec.cpuCount } Core`;
  }
}
