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
  }
};
