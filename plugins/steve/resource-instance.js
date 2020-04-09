import { sortableNumericSuffix } from '@/utils/sort';
import { generateZip, downloadFile } from '@/utils/download';
import { ucFirst } from '@/utils/string';
import { eachLimit } from '@/utils/promise';
import {
  MODE, _EDIT, _CLONE,
  EDIT_YAML, _FLAGGED
} from '@/config/query-params';
import { findBy } from '@/utils/array';
import { DEV } from '@/store/prefs';
import { addParams } from '@/utils/url';
import { WORKLOAD } from '@/config/types';

const REMAP_STATE = { disabled: 'inactive' };

const DEFAULT_COLOR = 'warning';
const DEFAULT_ICON = 'x';

const DEFAULT_WAIT_INTERVAL = 1000;
const DEFAULT_WAIT_TMIMEOUT = 30000;

const STATES = {
  unknown:        { color: 'warning', icon: 'x' },
  aborted:        { color: 'warning', icon: 'error' },
  activating:     { color: 'info', icon: 'tag' },
  active:         { color: 'success', icon: 'dot-open' },
  available:      { color: 'success', icon: 'dot-open' },
  backedup:       { color: 'success', icon: 'backup' },
  bound:          { color: 'success', icon: 'dot' },
  building:       { color: 'success', icon: 'dot-open' },
  created:        { color: 'info', icon: 'tag' },
  creating:       { color: 'info', icon: 'tag' },
  deactivating:   { color: 'info', icon: 'adjust' },
  degraded:       { color: 'warning', icon: 'error' },
  denied:         { color: 'error', icon: 'adjust' },
  disabled:       { color: 'warning', icon: 'error' },
  disconnected:   { color: 'warning', icon: 'error' },
  error:          { color: 'error', icon: 'error' },
  erroring:       { color: 'error', icon: 'error' },
  expired:        { color: 'warning', icon: 'error' },
  failed:         { color: 'error', icon: 'error' },
  healthy:        { color: 'success', icon: 'dot-open' },
  inactive:       { color: 'error', icon: 'dot' },
  initializing:   { color: 'warning', icon: 'error' },
  locked:         { color: 'warning', icon: 'adjust' },
  migrating:      { color: 'info', icon: 'info' },
  paused:         { color: 'info', icon: 'info' },
  pending:        { color: 'info', icon: 'tag' },
  provisioning:   { color: 'info', icon: 'dot' },
  purged:         { color: 'error', icon: 'purged' },
  purging:        { color: 'info', icon: 'purged' },
  reconnecting:   { color: 'error', icon: 'error' },
  registering:    { color: 'info', icon: 'tag' },
  reinitializing: { color: 'warning', icon: 'error' },
  released:       { color: 'warning', icon: 'error' },
  removed:        { color: 'error', icon: 'trash' },
  removing:       { color: 'info', icon: 'trash' },
  requested:      { color: 'info', icon: 'tag' },
  restarting:     { color: 'info', icon: 'adjust' },
  restoring:      { color: 'info', icon: 'medicalcross' },
  running:        { color: 'success', icon: 'dot-open' },
  skipped:        { color: 'info', icon: 'dot-open' },
  starting:       { color: 'info', icon: 'adjust' },
  stopped:        { color: 'error', icon: 'dot' },
  stopping:       { color: 'info', icon: 'adjust' },
  succeeded:      { color: 'success', icon: 'dot-dotfill' },
  success:        { color: 'success', icon: 'dot-open' },
  suspended:      { color: 'info', icon: 'pause' },
  unavailable:    { color: 'error', icon: 'error' },
  unhealthy:      { color: 'error', icon: 'error' },
  untriggered:    { color: 'success', icon: 'tag' },
  updating:       { color: 'warning', icon: 'tag' },
  waiting:        { color: 'info', icon: 'tag' },
};

const SORT_ORDER = {
  error:   1,
  warning: 2,
  info:    3,
  success: 4,
  other:   5,
};

export default {
  _key() {
    const m = this.metadata;

    if ( m ) {
      return m.uid || `${ m.namespace ? `${ m.namespace }:` : '' }${ m.name }`;
    }

    return this.id || Math.random();
  },

  schema() {
    return this.$getters['schemaFor'](this.type);
  },

  toString() {
    return () => {
      return `[${ this.type }: ${ this.id }]`;
    };
  },

  nameDisplay() {
    return this.spec?.displayName || this.metadata?.name || this.id;
  },

  nameSort() {
    return sortableNumericSuffix(this.nameDisplay).toLowerCase();
  },

  typeDisplay() {
    return this.$store.getters['type-map/singularLabelFor'](this.schema);
  },

  namespacedName() {
    const namespace = this.metadata.namespace;
    const name = this.metadata.name || this.id;

    if ( namespace ) {
      return `${ namespace }:${ name }`;
    }

    return name;
  },

  namespacedNameSort() {
    return sortableNumericSuffix(this.namespacedName).toLowerCase();
  },

  // You can override the state by providing your own state (and possibly reading metadata.state)
  state() {
    return this.metadata?.state?.name || 'unknown';
  },

  // You can override the displayed by providing your own stateDisplay (and possibly reading _stateDisplay)
  stateDisplay() {
    return this._stateDisplay;
  },

  _stateDisplay() {
    const state = this.state;

    if ( REMAP_STATE[state] ) {
      return REMAP_STATE[state];
    }

    return state.split(/-/).map(ucFirst).join('-');
  },

  stateColor() {
    if ( this.metadata?.state?.error ) {
      return 'text-error';
    }

    const key = (this.state || '').toLowerCase();
    let color;

    if ( STATES[key] && STATES[key].color ) {
      color = this.maybeFn(STATES[key].color);
    }

    if ( !color ) {
      color = DEFAULT_COLOR;
    }

    return `text-${ color }`;
  },

  stateBackground() {
    return this.stateColor.replace('text-', 'bg-');
  },

  stateIcon() {
    let trans = false;
    let error = false;

    if ( this.metadata && this.metadata.state ) {
      trans = this.metadata.state.transitioning;
      error = this.metadata.state.error;
    }

    if ( trans ) {
      return 'icon icon-spinner icon-spin';
    }

    if ( error ) {
      return 'icon icon-error';
    }

    const key = (this.state || '').toLowerCase();
    let icon;

    if ( STATES[key] && STATES[key].icon ) {
      icon = this.maybeFn(STATES[key].icon);
    }

    if ( !icon ) {
      icon = DEFAULT_ICON;
    }

    return `icon icon-${ icon }`;
  },

  stateSort() {
    const color = this.stateColor.replace('text-', '');

    return `${ SORT_ORDER[color] || SORT_ORDER['other'] } ${ this.stateDisplay }`;
  },

  // ------------------------------------------------------------------

  waitForTestFn() {
    return (fn, msg, timeoutMs, intervalMs) => {
      console.log(msg);

      if ( !timeoutMs ) {
        timeoutMs = DEFAULT_WAIT_TMIMEOUT;
      }

      if ( !intervalMs ) {
        intervalMs = DEFAULT_WAIT_INTERVAL;
      }

      return new Promise((resolve, reject) => {
        // Do a first check immediately
        if ( fn.apply(this) ) {
          console.log('Wait for', msg, 'done immediately');
          resolve(this);
        }

        const timeout = setTimeout(() => {
          console.log('Wait for', msg, 'timed out');
          clearInterval(interval);
          clearTimeout(timeout);
          reject(new Error(`Failed while: ${ msg }`));
        }, timeoutMs);

        const interval = setInterval(() => {
          if ( fn.apply(this) ) {
            console.log('Wait for', msg, 'done');
            clearInterval(interval);
            clearTimeout(timeout);
            resolve(this);
          } else {
            console.log('Wait for', msg, 'not done yet');
          }
        }, intervalMs);
      });
    };
  },

  waitForState() {
    return (state, timeout, interval) => {
      return this.waitForTestFn(() => {
        return this.state.toLowerCase() === state.toLowerCase();
      }, `Wait for state=${ state }`, timeout, interval);
    };
  },

  waitForTransition() {
    return () => {
      return this.waitForTestFn(() => {
        return !this.transitioning;
      }, 'Wait for transition completion');
    };
  },

  waitForAction() {
    return (name) => {
      return this.waitForTestFn(() => {
        return this.hasAction(name);
      }, `Wait for action=${ name }`);
    };
  },

  hasCondition() {
    return (condition, withStatus = 'True') => {
      if ( !this.status || !this.status.conditions ) {
        return false;
      }

      const entry = findBy((this.status.conditions || []), 'type', condition);

      if ( !entry ) {
        return false;
      }

      if ( !withStatus ) {
        return true;
      }

      return (entry.status || '').toLowerCase() === `${ withStatus }`.toLowerCase();
    };
  },

  waitForCondition() {
    return (name, withStatus = 'True', timeoutMs = DEFAULT_WAIT_TMIMEOUT, intervalMs = DEFAULT_WAIT_INTERVAL) => {
      return this.waitForTestFn(() => {
        return this.hasCondition(name, withStatus);
      }, `Wait for condition ${ name }=${ withStatus }`, timeoutMs, intervalMs);
    };
  },

  // ------------------------------------------------------------------

  availableActions() {
    const all = this._availableActions;

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
    while ( out.length && out[0].divider ) {
      out.shift();
    }

    // Remove dividers at the end
    while ( out.length && out[out.length - 1].divider ) {
      out.pop();
    }

    return out;
  },

  // You can add custom actions by overriding your own availableActions (and probably reading _standardActions)
  _availableActions() {
    return this._standardActions;
  },

  _standardActions() {
    const all = [];
    const links = this.links || {};
    // const hasView = !!links.rioview || !!links.view;
    const customEdit = this.$rootGetters['type-map/hasCustomEdit'](this.type);

    if ( customEdit ) {
      all.push({
        action:  'goToEdit',
        label:   'Edit as Form',
        icon:    'icon icon-fw icon-edit',
        enabled:  !!links.update,
      });

      all.push({
        action:  'goToClone',
        label:   'Clone as Form',
        icon:    'icon icon-fw icon-copy',
        enabled:  !!links.update,
      });
    }

    all.push({ divider: true });

    all.push({
      action:  'viewEditYaml',
      label:   (links.update ? 'Edit/View as YAML' : 'View as YAML'),
      icon:    'icon icon-file',
    });

    all.push({
      action:  'cloneYaml',
      label:   'Clone as YAML',
      icon:    'icon icon-fw icon-copy',
      enabled:  !!links.update,
    });

    all.push({
      action:     'download',
      label:      'Download YAML',
      icon:       'icon icon-fw icon-download',
      bulkable:   true,
      bulkAction: 'downloadBulk',
    });

    const viewInApiEnabled = this.$rootGetters['prefs/get'](DEV);

    all.push({
      action:  'viewInApi',
      label:   'View in API',
      icon:    'icon icon-fw icon-external-link',
      enabled:  !!links.self && viewInApiEnabled,
    });

    all.push({ divider: true });

    all.push({
      action:     'promptRemove',
      altAction:  'remove',
      label:      'Delete',
      icon:       'icon icon-fw icon-trash',
      bulkable:   true,
      enabled:    !!links.remove,
      bulkAction: 'promptRemove',
    });

    return all;
  },

  maybeFn() {
    return (val) => {
      if ( typeof val === 'function' ) {
        return val(this);
      }

      return val;
    };
  },

  // ------------------------------------------------------------------

  hasLink() {
    return (linkName) => {
      return !!this.linkFor(linkName);
    };
  },

  linkFor() {
    return (linkName) => {
      return (this.links || {})[linkName];
    };
  },

  followLink() {
    return (linkName, opt = {}) => {
      if ( !opt.url ) {
        opt.url = (this.links || {})[linkName];
      }

      if ( opt.urlSuffix ) {
        opt.url += opt.urlSuffix;
      }

      if ( !opt.url ) {
        throw new Error(`Unknown link ${ linkName } on ${ this.type } ${ this.id }`);
      }

      return this.$dispatch('request', opt);
    };
  },

  // ------------------------------------------------------------------

  hasAction() {
    return (actionName) => {
      return !!this.actionLinkFor(actionName);
    };
  },

  actionLinkFor() {
    return (actionName) => {
      return (this.actions || {})[actionName];
    };
  },

  doAction() {
    return (actionName, body, opt = {}) => {
      if ( !opt.url ) {
        opt.url = this.actionLinkFor(actionName);
      }

      opt.method = 'post';
      opt.data = body;

      return this.$dispatch('request', opt);
    };
  },

  // ------------------------------------------------------------------

  patch() {
    return (data, opt = {}) => {
      if ( !opt.url ) {
        opt.url = this.linkFor('self');
      }

      opt.method = 'patch';
      opt.headers = opt.headers || {};
      opt.headers['content-type'] = 'application/json-patch+json';
      opt.data = data;

      return this.$dispatch('request', opt);
    };
  },

  save() {
    return async(opt = {}) => {
      delete this.__rehydrate;

      if ( !opt.url ) {
        if (this.id) {
          opt.url = this.linkFor('update') || this.linkFor('self');
        } else {
          const schema = this.$getters['schemaFor'](this.type);
          let url = schema.linkFor('collection');

          if ( schema.attributes && schema.attributes.namespaced ) {
            url += `/${ this.metadata.namespace }`;
          }

          opt.url = url;
        }
      }

      if ( !opt.method ) {
        opt.method = (this.id ? 'put' : 'post');
      }

      if ( !opt.headers ) {
        opt.headers = {};
      }

      if ( !opt.headers['content-type'] ) {
        opt.headers['content-type'] = 'application/json';
      }

      if ( !opt.headers['accept'] ) {
        opt.headers['accept'] = 'application/json';
      }

      // @TODO remove this once the API maps steve _type <-> k8s type in both directions
      if (this._type) {
        this.type = this._type;
      }

      opt.data = this;

      const res = await this.$dispatch('request', opt);

      await this.$dispatch('load', { data: res, existing: this });

      return this;
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

  // ------------------------------------------------------------------

  currentRoute() {
    return () => {
      if ( process.server ) {
        return this.$rootState.$route;
      } else {
        return window.$nuxt.$route;
      }
    };
  },

  currentRouter() {
    return () => {
      if ( process.server ) {
        return this.$rootState.$router;
      } else {
        return window.$nuxt.$router;
      }
    };
  },

  detailUrl() {
    const router = this.currentRouter();
    const schema = this.$getters['schemaFor'](this.type);
    const query = {};

    let route = `c-cluster-resource${ schema?.attributes?.namespaced ? '-namespace' : '' }-id`;

    if (Object.values(WORKLOAD).includes(this.type)) {
      route = `c-cluster-workloads-namespace-id`;
      query.type = this.type;
    }

    const params = {
      resource:  this.type,
      namespace: this.metadata && this.metadata.namespace,
      id:        this.metadata.name
    };

    const url = router.resolve({
      name:   route,
      params,
      query
    }).href;

    return url;
  },

  goToClone() {
    return (moreQuery = {}) => {
      const url = addParams(this.detailUrl, {
        [MODE]:  _CLONE,
        ...moreQuery
      });

      this.currentRouter().push({ path: url });
    };
  },

  goToEdit() {
    return (moreQuery = {}) => {
      const url = addParams(this.detailUrl, { [MODE]: _EDIT, ...moreQuery });

      this.currentRouter().push({ path: url });
    };
  },

  viewEditYaml() {
    return () => {
      return this.goToEdit({ [EDIT_YAML]: _FLAGGED });
    };
  },

  cloneYaml() {
    return (moreQuery = {}) => {
      const url = addParams(this.detailUrl, {
        [MODE]:      _CLONE,
        [EDIT_YAML]: _FLAGGED,
        ...moreQuery
      });

      this.currentRouter().push({ path: url });
    };
  },

  download() {
    return async() => {
      const link = this.hasLink('rioview') ? 'rioview' : 'view';
      const value = await this.followLink(link, { headers: { accept: 'application/yaml' } });

      downloadFile(`${ this.nameDisplay }.yaml`, value.data, 'application/yaml');
    };
  },

  downloadBulk() {
    return async(items) => {
      const files = {};
      const names = [];

      for ( const item of items ) {
        let name = `${ item.nameDisplay }.yaml`;
        const i = 2;

        while ( names.includes(name) ) {
          name = `${ item.nameDisplay }_${ i }.yaml`;
        }

        names.push(name);
      }

      await eachLimit(items, 10, (item, idx) => {
        const link = item.hasLink('rioview') ? 'rioview' : 'view';

        return item.followLink(link, { headers: { accept: 'application/yaml' } } ).then((data) => {
          files[`resources/${ names[idx] }`] = data;
        });
      });

      const zip = await generateZip(files);

      downloadFile('resources.zip', zip, 'application/zip');
    };
  },

  viewInApi() {
    return () => {
      window.open(this.links.self, '_blank');
    };
  },

  promptRemove() {
    return (resources = this) => {
      this.$dispatch('promptRemove', resources);
    };
  },

  applyDefaults() {
    return () => {
      return this;
    };
  },

  urlFromAttrs() {
    const schema = this.$getters['schemaFor'](this.type);
    const { metadata:{ namespace = 'default' } } = this;
    let url = schema.links.collection;

    const [group, resource] = schema?.attributes;

    url = `${ url.slice(0, url.indexOf('/v1')) }/apis/${ group }/namespaces/${ namespace }/${ resource }`;

    return url;
  }
};
