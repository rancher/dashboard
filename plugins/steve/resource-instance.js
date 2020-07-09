import Vue from 'vue';
import jsyaml from 'js-yaml';
import compact from 'lodash/compact';
import uniq from 'lodash/uniq';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import {
  displayKeyFor,
  validateLength,
  validateChars,
  validateDnsLikeTypes,
} from '@/utils/validators';
import CustomValidators from '@/utils/custom-validators';
import { sortableNumericSuffix } from '@/utils/sort';
import { generateZip, downloadFile } from '@/utils/download';
import { escapeHtml, ucFirst, coerceStringTypeToScalarType } from '@/utils/string';
import { get } from '@/utils/object';
import { eachLimit } from '@/utils/promise';
import {
  MODE, _EDIT, _CLONE,
  AS_YAML, _FLAGGED, _VIEW
} from '@/config/query-params';
import { findBy } from '@/utils/array';
import { DEV } from '@/store/prefs';
import { DESCRIPTION } from '@/config/labels-annotations';
import { normalizeType, cleanForNew } from './normalize';

const STRING_LIKE_TYPES = [
  'string',
  'date',
  'blob',
  'enum',
  'multiline',
  'masked',
  'password',
  'dnsLabel',
  'hostname',
];
const DNS_LIKE_TYPES = ['dnsLabel', 'dnsLabelRestricted', 'hostname'];

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
  cordoned:       { color: 'info', icon: 'tag' },
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
  customValidationRules() {
    return [
      /**
       * Essentially a fake schema object with additonal params to extend validation
       *
       * @param {nullable} Value is nullabel
       * @param {path} Path on the resource to the value to validate
       * @param {required} Value required
       * @param {requiredIf} Value required if value at path not empty
       * @param {translationKey} Human readable display key for param in path e.g. metadata.name === Name
       * @param {type} Type of field to validate
       * @param {validators} array of strings where item is name of exported validator function in custom-validtors, args can be passed by prepending args seperated by colon. e.g maxLength:63
       */
      /* {
        nullable:       false,
        path:           'spec.ports',
        required:       true,
        type:           'array',
        validators:     ['servicePort'],
      } */
    ];
  },

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

  typeDisplay() {
    const schema = this.schema;

    if ( schema ) {
      return this.$rootGetters['type-map/singularLabelFor'](schema);
    }

    return '?';
  },

  nameDisplay() {
    return this.spec?.displayName || this.metadata?.name || this.id;
  },

  nameSort() {
    return sortableNumericSuffix(this.nameDisplay).toLowerCase();
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

  name() {
    return this.metadata?.name;
  },

  namespace() {
    return this.metadata?.namespace;
  },

  groupByLabel() {
    const name = this.metadata?.namespace;
    let out;

    if ( name ) {
      out = this.$rootGetters['i18n/t']('resourceTable.groupLabel.namespace', { name: escapeHtml(name) });
    } else {
      out = this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInANamespace');
    }

    return out;
  },

  description() {
    return this.metadata?.annotations?.[DESCRIPTION];
  },

  setLabel() {
    return (key, val) => {
      if ( val ) {
        if ( !this.metadata ) {
          this.metadata = {};
        }

        if ( !this.metadata.labels ) {
          this.metadata.labels = {};
        }

        Vue.set(this.metadata.labels, key, val);
      } else if ( this.metadata?.labels ) {
        Vue.set(this.metadata.labels, key, undefined);
        delete this.metadata.labels[key];
      }
    };
  },

  setAnnotation() {
    return (key, val) => {
      if ( val ) {
        if ( !this.metadata ) {
          this.metadata = {};
        }

        if ( !this.metadata.annotations ) {
          this.metadata.annotations = {};
        }

        Vue.set(this.metadata.annotations, key, val);
      } else if ( this.metadata?.annotations ) {
        Vue.set(this.metadata.annotations, key, undefined);
        delete this.metadata.annotations[key];
      }
    };
  },

  highlightBadge() {
    return false;
  },

  // You can override the state by providing your own state (and possibly reading metadata.state)
  state() {
    return this.metadata?.state?.name || 'unknown';
  },

  // You can override the displayed by providing your own stateDisplay (and possibly reading _stateDisplay)
  stateDisplay() {
    return this._stateDisplay(this.state);
  },

  _stateDisplay() {
    return (state) => {
      if ( REMAP_STATE[state] ) {
        return REMAP_STATE[state];
      }

      return state.split(/-/).map(ucFirst).join('-');
    };
  },

  stateColor() {
    return (state) => {
      if ( state?.error ) {
        return 'text-error';
      }

      const key = (state || '').toLowerCase();
      let color;

      if ( STATES[key] && STATES[key].color ) {
        color = this.maybeFn(STATES[key].color);
      }

      if ( !color ) {
        color = DEFAULT_COLOR;
      }

      return `text-${ color }`;
    };
  },

  stateBackground() {
    return this.stateColor(this.state).replace('text-', 'bg-');
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
      console.log('Starting wait for', msg); // eslint-disable-line no-console

      if ( !timeoutMs ) {
        timeoutMs = DEFAULT_WAIT_TMIMEOUT;
      }

      if ( !intervalMs ) {
        intervalMs = DEFAULT_WAIT_INTERVAL;
      }

      return new Promise((resolve, reject) => {
        // Do a first check immediately
        if ( fn.apply(this) ) {
          console.log('Wait for', msg, 'done immediately'); // eslint-disable-line no-console
          resolve(this);
        }

        const timeout = setTimeout(() => {
          console.log('Wait for', msg, 'timed out'); // eslint-disable-line no-console
          clearInterval(interval);
          clearTimeout(timeout);
          reject(new Error(`Failed while: ${ msg }`));
        }, timeoutMs);

        const interval = setInterval(() => {
          if ( fn.apply(this) ) {
            console.log('Wait for', msg, 'done'); // eslint-disable-line no-console
            clearInterval(interval);
            clearTimeout(timeout);
            resolve(this);
          } else {
            console.log('Wait for', msg, 'not done yet'); // eslint-disable-line no-console
          }
        }, intervalMs);
      });
    };
  },

  waitForState() {
    return (state, timeout, interval) => {
      return this.waitForTestFn(() => {
        return (this.state || '').toLowerCase() === state.toLowerCase();
      }, `state=${ state }`, timeout, interval);
    };
  },

  waitForTransition() {
    return () => {
      return this.waitForTestFn(() => {
        return !this.transitioning;
      }, 'transition completion');
    };
  },

  waitForAction() {
    return (name) => {
      return this.waitForTestFn(() => {
        return this.hasAction(name);
      }, `action=${ name }`);
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
      }, `condition ${ name }=${ withStatus }`, timeoutMs, intervalMs);
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
    const all = [
      {
        action:  'goToEdit',
        label:   'Edit as Form',
        icon:    'icon icon-fw icon-edit',
        enabled:  this.canUpdate && this.canCustomEdit,
      },
      {
        action:  'goToClone',
        label:   'Clone as Form',
        icon:    'icon icon-fw icon-copy',
        enabled:  this.canCreate && this.canCustomEdit,
      },
      { divider: true },
      {
        action:  'goToEditYaml',
        label:   'Edit as YAML',
        icon:    'icon icon-file',
        enabled: this.canUpdate && this.canYaml,
      },
      {
        action:  'goToViewYaml',
        label:   'View as YAML',
        icon:    'icon icon-file',
        enabled: !this.canUpdate && this.canYaml
      },
      {
        action:  'cloneYaml',
        label:   'Clone as YAML',
        icon:    'icon icon-fw icon-copy',
        enabled:  this.canCreate && this.canYaml,
      },
      {
        action:     'download',
        label:      'Download YAML',
        icon:       'icon icon-fw icon-download',
        bulkable:   true,
        bulkAction: 'downloadBulk',
        enabled:    this.canYaml
      },
      { divider: true },
      {
        action:     'promptRemove',
        altAction:  'remove',
        label:      'Delete',
        icon:       'icon icon-fw icon-trash',
        bulkable:   true,
        enabled:    this.canDelete,
        bulkAction: 'promptRemove',
      },
      { divider: true },
      {
        action:  'viewInApi',
        label:   'View in API',
        icon:    'icon icon-fw icon-external-link',
        enabled:  this.canViewInApi,
      }
    ];

    return all;
  },

  maybeFn() {
    return (val) => {
      if ( isFunction(val) ) {
        return val(this);
      }

      return val;
    };
  },

  // ------------------------------------------------------------------

  canDelete() {
    return this.hasLink('remove');
  },

  canUpdate() {
    return this.hasLink('update') && this.$rootGetters['type-map/isEditable'](this.type);
  },

  canCustomEdit() {
    return this.$rootGetters['type-map/hasCustomEdit'](this.type);
  },

  canCreate() {
    return this.$rootGetters['type-map/isCreatable'](this.type);
  },

  canViewInApi() {
    return this.hasLink('self') && this.$rootGetters['prefs/get'](DEV);
  },

  canYaml() {
    return this.hasLink('rioview') || this.hasLink('view');
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
      const forNew = !this.id;
      const errors = await this.validationErrors(this);

      if (!isEmpty(errors)) {
        return Promise.reject(errors);
      }

      if ( !opt.url ) {
        if ( forNew ) {
          const schema = this.$getters['schemaFor'](this.type);
          let url = schema.linkFor('collection');

          if ( schema.attributes && schema.attributes.namespaced ) {
            url += `/${ this.metadata.namespace }`;
          }

          opt.url = url;
        } else {
          opt.url = this.linkFor('update') || this.linkFor('self');
        }
      }

      if ( !opt.method ) {
        opt.method = ( forNew ? 'post' : 'put' );
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
      opt.data = { ...this };

      if (opt?.data._type) {
        opt.data.type = opt.data._type;
      }

      const res = await this.$dispatch('request', opt);

      // console.log('### Resource Save', this.type, this.id);

      // Steve sometimes returns Table responses instead of the resource you just saved.. ignore
      if ( res && res.kind !== 'Table') {
        await this.$dispatch('load', { data: res, existing: (forNew ? this : undefined ) });
      }

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

  detailLocation() {
    const schema = this.$getters['schemaFor'](this.type);

    return {
      name:   `c-cluster-product-resource${ schema?.attributes?.namespaced ? '-namespace' : '' }-id`,
      params: {
        product:   this.$rootGetters['currentProduct'],
        resource:  this.type,
        namespace: this.metadata && this.metadata.namespace,
        id:        this.metadata.name
      }
    };
  },

  goToClone() {
    return (moreQuery = {}) => {
      const location = this.detailLocation;

      location.query = {
        ...location.query,
        [MODE]: _CLONE,
        ...moreQuery
      };

      this.currentRouter().push(location);
    };
  },

  goToEdit() {
    return (moreQuery = {}) => {
      const location = this.detailLocation;

      location.query = {
        ...location.query,
        [MODE]: _EDIT,
        ...moreQuery
      };

      this.currentRouter().push(location);
    };
  },

  goToEditYaml() {
    return () => {
      const location = this.detailLocation;

      location.query = {
        ...location.query,
        [MODE]:      _EDIT,
        [AS_YAML]: _FLAGGED
      };

      this.currentRouter().push(location);
    };
  },

  goToViewYaml() {
    return () => {
      const location = this.detailLocation;

      location.query = {
        ...location.query,
        [MODE]:      _VIEW,
        [AS_YAML]: _FLAGGED
      };

      this.currentRouter().push(location);
    };
  },

  cloneYaml() {
    return (moreQuery = {}) => {
      const location = this.detailLocation;

      location.query = {
        ...location.query,
        [MODE]:      _CLONE,
        [AS_YAML]: _FLAGGED,
        ...moreQuery
      };

      this.currentRouter().push(location);
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
    };
  },

  urlFromAttrs() {
    const schema = this.$getters['schemaFor'](this.type);
    const { metadata:{ namespace = 'default' } } = this;
    let url = schema.links.collection;

    const attributes = schema?.attributes;

    if (!attributes) {
      throw new Error('Attributes must be present on the schema');
    }
    const { group, resource } = attributes;

    url = `${ url.slice(0, url.indexOf('/v1')) }/apis/${ group }/namespaces/${ namespace }/${ resource }`;

    return url;
  },

  // convert yaml to object, clean for new if creating/cloning
  // map _type to type
  cleanYaml() {
    return (yaml, mode = 'edit') => {
      try {
        const obj = jsyaml.safeLoad(yaml);

        if (mode !== 'edit') {
          cleanForNew(obj);
        }

        if (obj._type) {
          obj.type = obj._type;
          delete obj._type;
        }
        const out = jsyaml.safeDump(obj, { skipInvalid: true });

        return out;
      } catch (e) {
        return null;
      }
    };
  },

  yamlForSave() {
    return (yaml) => {
      try {
        const obj = jsyaml.safeLoad(yaml);

        if (obj) {
          if (this._type) {
            obj._type = obj.type;
          }

          return jsyaml.safeDump(obj);
        }
      } catch (e) {
        return null;
      }
    };
  },

  validationErrors() {
    return (data, ignoreFields) => {
      const errors = [];
      const {
        type: originalType,
        schema
      } = data;
      const type = normalizeType(originalType);

      if ( !originalType ) {
        // eslint-disable-next-line
        console.warn(this.$rootGetters['i18n/t']('validation.noType'), data);

        return errors;
      }

      if ( !schema ) {
        // eslint-disable-next-line
        console.warn(this.$rootGetters['i18n/t']('validation.noSchema'), originalType, data);

        return errors;
      }

      const fields = schema.resourceFields || {};
      const keys = Object.keys(fields);
      let field, key, val, displayKey;

      for ( let i = 0 ; i < keys.length ; i++ ) {
        key = keys[i];
        field = fields[key];
        val = get(data, key);
        displayKey = displayKeyFor(type, key, this.$rootGetters);

        const fieldType = field?.type ? normalizeType(field.type) : null;
        const valIsString = isString(val);

        if ( ignoreFields && ignoreFields.includes(key) ) {
          continue;
        }

        if ( val === undefined ) {
          val = null;
        }

        if (valIsString) {
          if (fieldType) {
            Vue.set(data, key, coerceStringTypeToScalarType(val, fieldType));
          }

          // Empty strings on nullable string fields -> null
          if ( field.nullable && val.length === 0 && STRING_LIKE_TYPES.includes(fieldType)) {
            val = null;

            Vue.set(data, key, val);
          }
        }

        validateLength(val, field, displayKey, this.$rootGetters, errors);
        validateChars(val, field, displayKey, this.$rootGetters, errors);

        if (errors.length > 0) {
          errors.push(this.$rootGetters['i18n/t']('validation.required', { key: displayKey }));

          continue;
        }

        // IDs claim to be these but are lies...
        if ( key !== 'id' && !isEmpty(val) && DNS_LIKE_TYPES.includes(fieldType) ) {
          // DNS types should be lowercase
          const tolower = (val || '').toLowerCase();

          if ( tolower !== val ) {
            val = tolower;

            Vue.set(data, key, val);
          }

          errors.push(...validateDnsLikeTypes(val, fieldType, displayKey, this.$rootGetters, errors));
        }
      }

      let { customValidationRules } = this;

      if (!isEmpty(customValidationRules)) {
        if (isFunction(customValidationRules)) {
          customValidationRules = customValidationRules();
        }

        customValidationRules.forEach((rule) => {
          const {
            path,
            requiredIf: requiredIfPath,
            validators = [],
            type: fieldType,
          } = rule;
          let pathValue = get(data, path) || null;
          const parsedRules = compact((validators || []));
          let displayKey = path;

          if (rule.translationKey && this.$rootGetters['i18n/exists'](rule.translationKey)) {
            displayKey = this.$rootGetters['i18n/t'](rule.translationKey);
          }

          if (isString(pathValue)) {
            pathValue = pathValue.trim();
          }

          if (requiredIfPath) {
            const reqIfVal = get(data, requiredIfPath);

            if (!isEmpty(reqIfVal) && isEmpty(pathValue)) {
              errors.push(this.$rootGetters['i18n/t']('validation.required', { key: displayKey }));
            }
          }

          validateLength(pathValue, rule, displayKey, this.$rootGetters, errors);
          validateChars(pathValue, rule, displayKey, this.$rootGetters, errors);

          if ( !isEmpty(pathValue) && DNS_LIKE_TYPES.includes(fieldType) ) {
            // DNS types should be lowercase
            const tolower = (pathValue || '').toLowerCase();

            if ( tolower !== pathValue ) {
              pathValue = tolower;

              Vue.set(data, path, pathValue);
            }

            errors.push(...validateDnsLikeTypes(pathValue, fieldType, displayKey, this.$rootGetters, errors));
          }

          parsedRules.forEach((validator) => {
            const validatorAndArgs = validator.split(':');
            const validatorName = validatorAndArgs.slice();
            const validatorArgs = validatorAndArgs.slice(1) || null;
            const validatorExists = Object.prototype.hasOwnProperty.call(CustomValidators, validatorName);

            if (!isEmpty(validatorName) && validatorExists) {
              CustomValidators[validatorName](pathValue, this.$rootGetters, errors, validatorArgs);
            } else if (!isEmpty(validatorName) && !validatorExists) {
              // eslint-disable-next-line
              console.warn(this.$rootGetters['i18n/t']('validation.custom.missing', { validatorName }));
            }
          });
        });
      }

      return uniq(errors);
    };
  },
};
