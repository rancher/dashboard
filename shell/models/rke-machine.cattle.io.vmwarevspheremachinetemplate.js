import { formatSi } from '@shell/utils/units';
import MachineTemplate from './rke-machine.cattle.io.machinetemplate';

const POOL_LOCATION_MATCHER = /\/host\/([^/]+)\/Resources(?:\/|$)/;

export default class VmwarevsphereMachineTemplate extends MachineTemplate {
  get provider() {
    return 'vmwarevsphere';
  }

  get providerLocation() {
    const pool = this.spec?.template?.spec?.pool;
    const match = pool?.match(POOL_LOCATION_MATCHER);

    return match?.[1] || null;
  }

  get providerSize() {
    const size = formatSi(this.spec.template.spec.memorySize * 1048576, 1024, 'iB');

    return `${ size }, ${ this.spec.template.spec.cpuCount } Core`;
  }
}
