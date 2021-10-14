import { formatSi } from '@/utils/units';
import SteveModel from '@/plugins/steve/steve-class';

export default class VmwarevsphereMachineTemplate extends SteveModel {
  get nameDisplay() {
    return this.name.replace(`${ this.metadata.annotations['objectset.rio.cattle.io/owner-name'] }-`, '');
  }

  get provider() {
    return 'vmwarevsphere';
  }

  get providerSize() {
    const size = formatSi(this.spec.template.spec.memorySize * 1048576, 1024, 'iB');

    return `${ size }, ${ this.spec.template.spec.cpuCount } Core`;
  }
}
