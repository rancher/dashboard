// import { RIO } from '@/utils/types';
// import { filterBy } from '@/utils/array';

export default {
  totalScale() {
    let out = 0;

    for ( const version of this.spec.revisions ) {
      out += version.scale;
    }

    return out;
  }
};

/*
versions() {
  const all = this.$getters['all'](RIO.VERSION);

  return filterBy(all, {
    'metadata.namespace': this.metadata.namespace,
    'metadata.name':      this.spec.app,
  });
}
*/
