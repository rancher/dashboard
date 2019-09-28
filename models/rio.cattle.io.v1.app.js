import { RIO } from '~/config/types';
// import { filterBy } from '@/utils/array';

export default {
  totalScale() {
    let out = 0;

    for ( const version of this.spec.revisions ) {
      out += version.scale;
    }

    return out;
  },

  versions() {
    return this.spec.revisions.map((rev) => {
      return this.$getters['byId'](RIO.VERSION, `${ this.metadata.namespace }/${ rev.serviceName }`);
    }).filter(x => !!x);
  },

  weights() {
    const out = {};
    const revisions = this.spec.revisions.map(rev => rev.Version);
    const weights = this.status.revisionWeight;

    for ( const rev of revisions ) {
      const status = weights[rev];

      if ( status && status.weight ) {
        out[rev] = status.weight;
      } else {
        out[rev] = 0;
      }
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
