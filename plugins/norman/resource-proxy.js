import { sortableNumericSuffix } from '@/utils/sort';

const ResourceProxy = {
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
    return (linkName, opt = {}) => {
      if ( !opt.url ) {
        opt.url = (this.links || {})[linkName];
      }

      // @TODO backend sends wss links in change events
      opt.url = opt.url.replace(/^ws/, 'http');

      if ( !opt.url ) {
        throw new Error(`Unknown link ${ linkName } on ${ this.type } ${ this.id }`);
      }

      return this.$dispatch('request', opt);
    };
  },

  save() {
    return (opt = {}) => {
      if ( !opt.url ) {
        opt.url = (this.links || {})['self'];
      }

      // @TODO backend sends wss links in change events
      opt.url = opt.url.replace(/^ws/, 'http');

      opt.method = 'post';
      opt.data = this;

      return this.$dispatch('request', opt);
    };
  },

  remove() {
    return (opt = {}) => {
      if ( !opt.url ) {
        opt.url = (this.links || {})['self'];
      }

      // @TODO backend sends wss links in change events
      opt.url = opt.url.replace(/^ws/, 'http');

      opt.method = 'delete';

      return this.$dispatch('request', opt);
    };
  }
};

export function proxyFor(obj, dispatch) {
  Object.defineProperty(obj, '$dispatch', { value: dispatch });

  if ( process.server ) {
    Object.defineProperty(obj, '__rehydrate', { value: true, enumerable: true });
  }

  return new Proxy(obj, {
    get(target, name) {
      const fn = ResourceProxy[name];

      if ( fn ) {
        return fn.call(target);
      }

      return target[name];
    },
  });
}
