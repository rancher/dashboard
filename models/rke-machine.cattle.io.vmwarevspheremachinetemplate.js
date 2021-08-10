import { formatSi } from '@/utils/units';

export default {

  nameDisplay() {
    return this.name.replace(`${ this.metadata.annotations['objectset.rio.cattle.io/owner-name'] }-`, '');
  },

  provider() {
    return 'vmwarevsphere';
  },

  providerSize() {
    const size = formatSi(this.spec.template.spec.memorySize * 1048576, 1024, 'iB');

    return `${ size }, ${ this.spec.template.spec.cpuCount } Core`;
  }
};
