import { sortableNumericSuffix } from '@/utils/sort';

export default {
  displayName() {
    return this.metadata.name || this.id;
  },

  sortName() {
    return sortableNumericSuffix(this.metadata.name || this.id).toLowerCase();
  },

  toString() {
    return () => {
      return `[${ this.type }: ${ this.id }]`;
    };
  },

  followLink() {
    return (linkName, opt) => {
      opt = opt || {};

      if ( !opt.url ) {
        opt.url = (this.links || {})[linkName];
      }

      if ( !opt.url ) {
        throw new Error(`Unknown link ${ linkName } on ${ this.type } ${ this.id }`);
      }

      return this.$dispatch('request', opt);
    };
  }
};
