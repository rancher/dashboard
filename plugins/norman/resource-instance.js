import { sortableNumericSuffix } from '@/utils/sort';
import { generateZip, downloadFile } from '@/utils/download';
import { eachLimit } from '@/utils/promise-limit';
import { MODE, _EDIT } from '@/utils/query-params';

export default {
  _key() {
    const m = this.metadata;

    if ( m ) {
      return m.uid || `${ m.namespace ? `${ m.namespace }:` : '' }${ m.name }`;
    }

    return this.id || Math.random();
  },

  displayName() {
    return this.metadata.name || this.id;
  },

  sortName() {
    return sortableNumericSuffix(this.displayName).toLowerCase();
  },

  toString() {
    return () => {
      return `[${ this.type }: ${ this.id }]`;
    };
  },

  hasLink() {
    return (linkName) => {
      return !!(this.links || {})[linkName];
    };
  },

  followLink() {
    return (linkName, opt = {}) => {
      if ( !opt.url ) {
        opt.url = (this.links || {})[linkName];
      }

      if ( !opt.url ) {
        throw new Error(`Unknown link ${ linkName } on ${ this.type } ${ this.id }`);
      }

      return this.$dispatch('request', opt);
    };
  },

  patch() {
    return (data, opt = {}) => {
      if ( !opt.url ) {
        opt.url = (this.links || {})['self'];
      }

      opt.method = 'patch';
      opt.headers = opt.headers || {};
      opt.headers['content-type'] = 'application/json-patch+json';
      opt.data = data;

      return this.$dispatch('request', opt);
    };
  },

  save() {
    return (opt = {}) => {
      if ( !opt.url ) {
        opt.url = (this.links || {})['self'];
      }

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

      opt.method = 'delete';

      return this.$dispatch('request', opt);
    };
  },

  goToEdit() {
    return async() => {
      const router = window.$nuxt.$router;

      const schema = await this.$dispatch('schemaFor', this.type);
      const url = router.resolve({
        name:   `explorer-group-resource${ schema.attributes.namespaced ? '-namespace' : '' }-id`,
        params: {
          grooup: schema.groupName,
          type:   this.type,
          id:     this.id
        },
        query:  { [MODE]: _EDIT }
      }).href;

      router.push({ path: url });
    };
  },

  download() {
    return async() => {
      const value = await this.followLink('view', { headers: { accept: 'application/yaml' } });

      downloadFile(`${ this.displayName }.yaml`, value, 'application/yaml');
    };
  },

  downloadBulk() {
    return async(items) => {
      const files = {};
      const names = [];

      for ( const item of items ) {
        let name = `${ item.displayName }.yaml`;
        const i = 2;

        while ( names.includes(name) ) {
          name = `${ item.displayName }_${ i }.yaml`;
        }

        names.push(name);
      }

      await eachLimit(items, 10, (item, idx) => {
        return item.followLink('view', { headers: { accept: 'application/yaml' } } ).then((data) => {
          files[`resources/${ names[idx] }`] = data;
        });
      });

      const zip = generateZip(files);

      downloadFile('resources.zip', zip, 'application/zip');
    };
  },

  viewInApi() {
    return () => {
      window.open(this.links.self, '_blank');
    };
  },

  promptRemove() {
    return () => {
      // @TODO actually prompt...
      this.remove();
    };
  },

  availableActions() {
    const all = [];
    const links = this.links || {};

    all.push({
      action:  'goToEdit',
      label:   'Edit',
      icon:    'icon icon-fw icon-edit',
      enabled:  !!links.update,
    });

    all.push({ divider: true });

    all.push({
      action:     'download',
      label:      'Download',
      icon:       'icon icon-fw icon-download',
      enabled:    !!links.view,
      bulkable:   true,
      bulkAction: 'downloadBulk',
    });

    all.push({
      action:  'viewInApi',
      label:   'View in API',
      icon:    'icon icon-fw icon-external-link',
      enabled:  !!links.self,
    });

    all.push({ divider: true });

    all.push({
      action:    'promptRemove',
      altAction: 'remove',
      label:     'Delete',
      icon:      'icon icon-fw icon-trash',
      bulkable:  true,
      enabled:   !!links.view,
    });

    // Remove disabled items and consecutive dividers
    let last = null;
    const out = all.filter((item) => {
      if ( item.enabled === false ) {
        return false;
      }

      const cur = item.divider;
      const ok = !cur || (cur && !last);

      last = cur;

      return ok;
    });

    // Remove dividers at the beginning
    while ( out[0].divider ) {
      out.shift();
    }

    // Remove dividers at the end
    while ( out[out.length - 1].divider ) {
      out.pop();
    }

    return out;
  }
};
