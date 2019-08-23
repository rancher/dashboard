import { sortableNumericSuffix } from '@/utils/sort';
import { generateZip, downloadFile } from '@/utils/download';
import { eachLimit } from '@/utils/promise-limit';

export default {
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
  },

  goToEdit() {
    debugger;
  },

  goToView() {
    debugger;
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
    // @TODO
    this.remove();
  },

  availableActions() {
    const all = [];
    const links = this.links || {};

    all.push({
      label:   'Edit',
      icon:    'icon icon-edit',
      action:  'goToEdit',
      enabled:  !!links.update,
    });

    all.push({
      label:   'View',
      icon:    'icon icon-file',
      action:  'goToView',
      enabled:  !!links.view,
    });

    all.push({
      label:      'Download',
      icon:       'icon icon-download',
      action:     'download',
      enabled:    !!links.view,
      bulkable:   true,
      bulkAction: 'downloadBulk',
    });

    all.push({ divider: true });

    all.push({
      label:   'View in API',
      icon:    'icon icon-external-link',
      action:  'viewInApi',
      enabled:  !!links.self,
    });

    all.push({ divider: true });

    all.push({
      label:     'Delete',
      icon:      'icon icon-trash',
      action:    'promptRemove',
      altAction: 'remove',
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
