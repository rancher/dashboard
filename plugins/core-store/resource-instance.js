import compact from 'lodash/compact';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import jsyaml from 'js-yaml';
import omitBy from 'lodash/omitBy';
import pickBy from 'lodash/pickBy';
import forIn from 'lodash/forIn';
import uniq from 'lodash/uniq';
import Vue from 'vue';

import { addObject, addObjects, findBy, removeAt } from '@/utils/array';
import CustomValidators from '@/utils/custom-validators';
import { downloadFile, generateZip } from '@/utils/download';
import { eachLimit } from '@/utils/promise';
import { get } from '@/utils/object';
import { DEV } from '@/store/prefs';
import { sortableNumericSuffix } from '@/utils/sort';
import {
  coerceStringTypeToScalarType,
  escapeHtml,
  matchesSomeRegex,
  ucFirst
} from '@/utils/string';
import {
  displayKeyFor,
  validateChars,
  validateDnsLikeTypes,
  validateLength,
  validateBoolean
} from '@/utils/validators';

import { ANNOTATIONS_TO_IGNORE_REGEX, DESCRIPTION, LABELS_TO_IGNORE_REGEX, NORMAN_NAME } from '@/config/labels-annotations';
import {
  AS, _YAML, MODE, _CLONE, _EDIT, _VIEW, _UNFLAG, _CONFIG
} from '@/config/query-params';

import { SELF } from '@/plugins/core-store/resource-proxy';
import { normalizeType } from './normalize';

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

const REMAP_STATE = {
  disabled:                 'inactive',
  notapplied:               'Not Applied',
  notready:                 'Not Ready',
  waitapplied:              'Wait Applied',
  outofsync:                'Out of Sync',
  'in-progress':            'In Progress',
  gitupdating:              'Git Updating',
  errapplied:               'Err Applied',
  waitcheckin:              'Wait Check-In',
  off:                      'Disabled',
  waitingforinfrastructure: 'Waiting for Infra',
};

const DEFAULT_COLOR = 'warning';
const DEFAULT_ICON = 'x';

const DEFAULT_WAIT_INTERVAL = 1000;
const DEFAULT_WAIT_TMIMEOUT = 30000;

export const STATES = {
  'in-progress':      { color: 'info', icon: 'tag' },
  'in-use':           { color: 'success', icon: 'dot-open' },
  'pending-rollback': { color: 'info', icon: 'dot-half' },
  'pending-upgrade':  { color: 'info', icon: 'dot-half' },
  'N/A':              { color: 'warning', icon: 'x' },
  'vm-error':         { color: 'error', icon: 'dot' },
  aborted:            { color: 'warning', icon: 'error' },
  activating:         { color: 'info', icon: 'tag' },
  active:             { color: 'success', icon: 'dot-open' },
  available:          { color: 'success', icon: 'dot-open' },
  backedup:           { color: 'success', icon: 'backup' },
  bound:              { color: 'success', icon: 'dot' },
  building:           { color: 'success', icon: 'dot-open' },
  completed:          { color: 'success', icon: 'dot' },
  cordoned:           { color: 'info', icon: 'tag' },
  count:              { color: 'success', icon: 'dot-open' },
  created:            { color: 'info', icon: 'tag' },
  creating:           { color: 'info', icon: 'tag' },
  deactivating:       { color: 'info', icon: 'adjust' },
  degraded:           { color: 'warning', icon: 'error' },
  denied:             { color: 'error', icon: 'adjust' },
  deployed:           { color: 'success', icon: 'dot-open' },
  disabled:           { color: 'warning', icon: 'error' },
  disconnected:       { color: 'warning', icon: 'error' },
  drained:            { color: 'info', icon: 'tag' },
  draining:           { color: 'warning', icon: 'tag' },
  enteringMaintain:   { color: 'info', icon: 'tag' },
  errapplied:         { color: 'error', icon: 'error' },
  error:              { color: 'error', icon: 'error' },
  erroring:           { color: 'error', icon: 'error' },
  errors:             { color: 'error', icon: 'error' },
  expired:            { color: 'warning', icon: 'error' },
  fail:               { color: 'error', icon: 'error' },
  failed:             { color: 'error', icon: 'error' },
  healthy:            { color: 'success', icon: 'dot-open' },
  inactive:           { color: 'error', icon: 'dot' },
  initializing:       { color: 'warning', icon: 'error' },
  inprogress:         { color: 'info', icon: 'spinner' },
  imported:           { color: 'success', icon: 'dot-open' },
  locked:             { color: 'warning', icon: 'adjust' },
  maintain:           { color: 'info', icon: 'tag' },
  migrating:          { color: 'info', icon: 'info' },
  missing:            { color: 'warning', icon: 'adjust' },
  modified:           { color: 'warning', icon: 'edit' },
  notApplicable:      { color: 'warning', icon: 'tag' },
  notapplied:         { color: 'warning', icon: 'tag' },
  notready:           { color: 'warning', icon: 'tag' },
  off:                { color: 'darker', icon: 'error' },
  orphaned:           { color: 'warning', icon: 'tag' },
  other:              { color: 'info', icon: 'info' },
  outofsync:          { color: 'warning', icon: 'tag' },
  pass:               { color: 'success', icon: 'dot-dotfill' },
  passed:             { color: 'success', icon: 'dot-dotfill' },
  paused:             { color: 'info', icon: 'info' },
  pending:            { color: 'info', icon: 'tag' },
  provisioning:       { color: 'info', icon: 'dot' },
  provisioned:        { color: 'success', icon: 'dot' },
  purged:             { color: 'error', icon: 'purged' },
  purging:            { color: 'info', icon: 'purged' },
  progress:           { color: 'warning', icon: 'x' },
  ready:              { color: 'success', icon: 'dot-open' },
  reconnecting:       { color: 'error', icon: 'error' },
  registering:        { color: 'info', icon: 'tag' },
  reinitializing:     { color: 'warning', icon: 'error' },
  released:           { color: 'warning', icon: 'error' },
  removed:            { color: 'error', icon: 'trash' },
  removing:           { color: 'info', icon: 'trash' },
  requested:          { color: 'info', icon: 'tag' },
  restarting:         { color: 'info', icon: 'adjust' },
  restoring:          { color: 'info', icon: 'medicalcross' },
  running:            { color: 'success', icon: 'dot-open' },
  skip:               { color: 'info', icon: 'dot-open' },
  skipped:            { color: 'info', icon: 'dot-open' },
  starting:           { color: 'info', icon: 'adjust' },
  stopped:            { color: 'error', icon: 'dot' },
  stopping:           { color: 'info', icon: 'adjust' },
  succeeded:          { color: 'success', icon: 'dot-dotfill' },
  success:            { color: 'success', icon: 'dot-open' },
  superseded:         { color: 'info', icon: 'dot-open' },
  suspended:          { color: 'info', icon: 'pause' },
  unavailable:        { color: 'error', icon: 'error' },
  unhealthy:          { color: 'error', icon: 'error' },
  uninstalled:        { color: 'info', icon: 'trash' },
  uninstalling:       { color: 'info', icon: 'trash' },
  unknown:            { color: 'warning', icon: 'x' },
  untriggered:        { color: 'success', icon: 'tag' },
  updating:           { color: 'warning', icon: 'tag' },
  waitapplied:        { color: 'info', icon: 'tag' },
  waitcheckin:        { color: 'warning', icon: 'tag' },
  waiting:            { color: 'info', icon: 'tag' },
  warning:            { color: 'warning', icon: 'error' },
  validated:          { color: 'success', icon: 'dot-open' },
};

export function getStatesByType(type = 'info') {
  const out = {
    info:    [],
    error:   [],
    success: [],
    warning: [],
    unknown: [],
  };

  forIn(STATES, (state, stateKey) => {
    if (state.color) {
      if (out[state.color]) {
        out[state.color].push(stateKey);
      } else {
        out.unknown.push(stateKey);
      }
    }
  });

  return out;
}

const SORT_ORDER = {
  error:   1,
  warning: 2,
  info:    3,
  success: 4,
  other:   5,
};

export function colorForState(state, isError, isTransitioning) {
  if ( isError ) {
    return 'text-error';
  }

  if ( isTransitioning ) {
    return 'text-info';
  }

  const key = (state || 'active').toLowerCase();
  let color;

  if ( STATES[key] && STATES[key].color ) {
    color = maybeFn.call(this, STATES[key].color);
  }

  if ( !color ) {
    color = DEFAULT_COLOR;
  }

  return `text-${ color }`;
}

export function stateDisplay(state) {
  // @TODO use translations
  const key = (state || 'active').toLowerCase();

  if ( REMAP_STATE[key] ) {
    return REMAP_STATE[key];
  }

  return key.split(/-/).map(ucFirst).join('-');
}

export function stateSort(color, display) {
  color = color.replace(/^(text|bg)-/, '');

  return `${ SORT_ORDER[color] || SORT_ORDER['other'] } ${ display }`;
}

function maybeFn(val) {
  if ( isFunction(val) ) {
    return val(this);
  }

  return val;
}

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
      if ( m.uid ) {
        return m.uid;
      }

      if ( m.namespace ) {
        return `${ this.type }/${ m.namespace }/${ m.name }`;
      }
    }

    if ( this.id ) {
      return `${ this.type }/${ this.id }`;
    }

    return `${ this.type }/${ Math.random() }`;
  },

  schema() {
    return this.$getters['schemaFor'](this.type);
  },

  toString() {
    return () => {
      return `[${ this.type }: ${ this.id }]`;
    };
  },

  toJSON() {
    return () => {
      return this[SELF];
    };
  },

  description() {
    return this.metadata?.annotations?.[DESCRIPTION] || this.spec?.description || this._description;
  },

  labels() {
    const all = this.metadata?.labels || {};

    return omitBy(all, (value, key) => {
      return matchesSomeRegex(key, this.labelsToIgnoreRegexes);
    });
  },

  annotations() {
    const all = this.metadata?.annotations || {};

    return omitBy(all, (value, key) => {
      return matchesSomeRegex(key, this.annotationsToIgnoreRegexes);
    });
  },

  typeDisplay() {
    const schema = this.schema;

    if ( schema ) {
      return this.$rootGetters['type-map/labelFor'](schema);
    }

    return '?';
  },

  nameDisplay() {
    return this.displayName || this.spec?.displayName || this.metadata?.annotations?.[NORMAN_NAME] || this.name || this.metadata?.name || this.id;
  },

  nameSort() {
    return sortableNumericSuffix(this.nameDisplay).toLowerCase();
  },

  namespacedName() {
    const namespace = this.metadata?.namespace;
    const name = this.nameDisplay;

    if ( namespace ) {
      return `${ namespace }:${ name }`;
    }

    return name;
  },

  namespacedNameSort() {
    return sortableNumericSuffix(this.namespacedName).toLowerCase();
  },

  name() {
    return this._name || this.metadata?.name;
  },

  namespace() {
    return this.metadata?.namespace;
  },

  groupByLabel() {
    const name = this.metadata?.namespace;
    let out;

    if ( name ) {
      out = this.t('resourceTable.groupLabel.namespace', { name: escapeHtml(name) });
    } else {
      out = this.t('resourceTable.groupLabel.notInANamespace');
    }

    return out;
  },

  labelsToIgnoreRegexes() {
    return LABELS_TO_IGNORE_REGEX;
  },

  setLabels() {
    return (val) => {
      if ( !this.metadata ) {
        this.metadata = {};
      }

      const all = this.metadata.labels || {};
      const wasIgnored = pickBy(all, (value, key) => {
        return matchesSomeRegex(key, this.labelsToIgnoreRegexes);
      });

      Vue.set(this.metadata, 'labels', { ...wasIgnored, ...val });
    };
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

  annotationsToIgnoreRegexes() {
    return ANNOTATIONS_TO_IGNORE_REGEX;
  },

  setAnnotations() {
    return (val) => {
      if ( !this.metadata ) {
        this.metadata = {};
      }

      const all = this.metadata.annotations || {};
      const wasIgnored = pickBy(all, (value, key) => {
        return matchesSomeRegex(key, this.annotationsToIgnoreRegexes);
      });

      Vue.set(this.metadata, 'annotations', { ...wasIgnored, ...val });
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

  // You can override the state by providing your own state (and possibly reading metadata.state)
  state() {
    return this.stateObj?.name || this._state || 'unknown';
  },

  // You can override the displayed by providing your own stateDisplay (and possibly using the function exported above)
  stateDisplay() {
    return stateDisplay(this.state);
  },

  stateColor() {
    return colorForState.call(
      this,
      this.state,
      this.stateObj?.error,
      this.stateObj?.transitioning
    );
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
      icon = maybeFn.call(this, STATES[key].icon);
    }

    if ( !icon ) {
      icon = DEFAULT_ICON;
    }

    return `icon icon-${ icon }`;
  },

  stateSort() {
    return stateSort(this.stateColor, this.stateDisplay);
  },

  stateDescription() {
    const trans = this.stateObj?.transitioning || false;
    const error = this.stateObj?.error || false;
    const message = this.stateObj?.message;

    return trans || error ? ucFirst(message) : '';
  },

  stateObj() {
    return this.metadata?.state;
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

  waitForLink() {
    return (name) => {
      return this.waitForTestFn(() => {
        return this.hasLink(name);
      }, `link=${ name }`);
    };
  },

  hasCondition() {
    return (condition) => {
      return this.isCondition(condition, null);
    };
  },

  isCondition() {
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
        return this.isCondition(name, withStatus);
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

    // Remove consecutive dividers in the middle
    for ( let i = 1 ; i < out.length ; i++ ) {
      if ( out[i].divider && out[i - 1].divider ) {
        removeAt(out, i, 1);
        i--;
      }
    }

    return out;
  },

  // You can add custom actions by overriding your own availableActions (and probably reading _standardActions)
  _availableActions() {
    return this._standardActions;
  },

  _standardActions() {
    const all = [
      { divider: true },
      {
        action:  this.canUpdate ? 'goToEdit' : 'goToViewConfig',
        label:   this.t(this.canUpdate ? 'action.edit' : 'action.view'),
        icon:    'icon icon-edit',
        enabled:  this.canCustomEdit,
      },
      {
        action:  this.canUpdate ? 'goToEditYaml' : 'goToViewYaml',
        label:   this.t(this.canUpdate ? 'action.editYaml' : 'action.viewYaml'),
        icon:    'icon icon-file',
        enabled: this.canYaml,
      },
      {
        action:     'download',
        label:      this.t('action.download'),
        icon:       'icon icon-download',
        bulkable:   true,
        bulkAction: 'downloadBulk',
        enabled:    this.canYaml
      },
      {
        action:  (this.canCustomEdit ? 'goToClone' : 'cloneYaml'),
        label:   this.t('action.clone'),
        icon:    'icon icon-copy',
        enabled:  this.canClone && this.canCreate && (this.canCustomEdit || this.canYaml),
      },
      { divider: true },
      {
        action:     'promptRemove',
        altAction:  'remove',
        label:      this.t('action.remove'),
        icon:       'icon icon-trash',
        bulkable:   true,
        enabled:    this.canDelete,
        bulkAction: 'promptRemove',
        weight:     -10, // Delete always goes last
      },
      {
        action:  'viewInApi',
        label:   this.t('action.viewInApi'),
        icon:    'icon icon-external-link',
        enabled:  this.canViewInApi,
      }
    ];

    return all;
  },

  // ------------------------------------------------------------------

  canDelete() {
    return this._canDelete;
  },

  _canDelete() {
    return this.hasLink('remove') && this.$rootGetters['type-map/optionsFor'](this.type).isRemovable;
  },

  canClone() {
    return true;
  },

  canUpdate() {
    return this.hasLink('update') && this.$rootGetters['type-map/optionsFor'](this.type).isEditable;
  },

  canCustomEdit() {
    return this.$rootGetters['type-map/hasCustomEdit'](this.type, this.id);
  },

  canCreate() {
    if ( this.schema && !this.schema?.collectionMethods.find(x => x.toLowerCase() === 'post') ) {
      return false;
    }

    return this.$rootGetters['type-map/optionsFor'](this.type).isCreatable;
  },

  canViewInApi() {
    return this.hasLink('self') && this.$rootGetters['prefs/get'](DEV);
  },

  canYaml() {
    return this.hasLink('view');
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

      return this.$dispatch('request', { opt, type: this.type });
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
      return (this.actions || this.actionLinks || {})[actionName];
    };
  },

  doAction() {
    return (actionName, body, opt = {}) => {
      return this.$dispatch('resourceAction', {
        resource: this,
        actionName,
        body,
        opt,
      });
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

      return this.$dispatch('request', { opt, type: this.type });
    };
  },

  save() {
    return this._save;
  },

  _save() {
    return async(opt = {}) => {
      delete this.__rehydrate;
      delete this.__clone;
      const forNew = !this.id;

      const errors = await this.validationErrors(this, opt.ignoreFields);

      if (!isEmpty(errors)) {
        return Promise.reject(errors);
      }

      if ( this.metadata?.resourceVersion ) {
        this.metadata.resourceVersion = `${ this.metadata.resourceVersion }`;
      }

      if ( !opt.url ) {
        if ( forNew ) {
          const schema = this.$getters['schemaFor'](this.type);
          let url = schema.linkFor('collection');

          if ( schema.attributes && schema.attributes.namespaced && this.metadata && this.metadata.namespace ) {
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

      if (opt?.data._name) {
        opt.data.name = opt.data._name;
      }

      if (opt?.data._labels) {
        opt.data.labels = opt.data._labels;
      }

      if (opt?.data._annotations) {
        opt.data.annotations = opt.data._annotations;
      }

      try {
        const res = await this.$dispatch('request', { opt, type: this.type });

        // console.log('### Resource Save', this.type, this.id);

        // Steve sometimes returns Table responses instead of the resource you just saved.. ignore
        if ( res && res.kind !== 'Table') {
          await this.$dispatch('load', { data: res, existing: (forNew ? this : undefined ) });
        }
      } catch (e) {
        if ( this.type && this.id && e?._status === 409) {
          // If there's a conflict, try to load the new version
          await this.$dispatch('find', {
            type: this.type,
            id:   this.id,
            opt:  { force: true }
          });
        }

        return Promise.reject(e);
      }

      return this;
    };
  },

  remove() {
    return async(opt = {}) => {
      if ( !opt.url ) {
        opt.url = (this.links || {})['self'];
      }

      opt.method = 'delete';

      const res = await this.$dispatch('request', opt, { opt, type: this.type });

      if ( res?._status === 204 ) {
        // If there's no body, assume the resource was immediately deleted
        // and drop it from the store as if a remove event happened.
        await this.$dispatch('ws.resource.remove', { data: this });
      }
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

  listLocation() {
    return {
      name:   `c-cluster-product-resource`,
      params: {
        product:   this.$rootGetters['productId'],
        cluster:   this.$rootGetters['clusterId'],
        resource:  this.type,
      }
    };
  },

  _detailLocation() {
    const schema = this.$getters['schemaFor'](this.type);

    const id = this.id?.replace(/.*\//, '');

    return {
      name:   `c-cluster-product-resource${ schema?.attributes?.namespaced ? '-namespace' : '' }-id`,
      params: {
        product:   this.$rootGetters['productId'],
        cluster:   this.$rootGetters['clusterId'],
        resource:  this.type,
        namespace: this.metadata?.namespace,
        id,
      }
    };
  },

  detailLocation() {
    return this._detailLocation;
  },

  goToDetail() {
    this.currentRouter().push(this.detailLocation);
  },

  goToClone() {
    return (moreQuery = {}) => {
      const location = this.detailLocation;

      location.query = {
        ...location.query,
        [MODE]: _CLONE,
        [AS]:   _UNFLAG,
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
        [AS]:   _UNFLAG,
        ...moreQuery
      };

      this.currentRouter().push(location);
    };
  },

  goToViewConfig() {
    return (moreQuery = {}) => {
      const location = this.detailLocation;

      location.query = {
        ...location.query,
        [MODE]:  _VIEW,
        [AS]:   _CONFIG,
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
        [MODE]: _EDIT,
        [AS]:   _YAML
      };

      this.currentRouter().push(location);
    };
  },

  goToViewYaml() {
    return () => {
      const location = this.detailLocation;

      location.query = {
        ...location.query,
        [MODE]: _VIEW,
        [AS]:   _YAML
      };

      this.currentRouter().push(location);
    };
  },

  cloneYaml() {
    return (moreQuery = {}) => {
      const location = this.detailLocation;

      location.query = {
        ...location.query,
        [MODE]: _CLONE,
        [AS]:   _YAML,
        ...moreQuery
      };

      this.currentRouter().push(location);
    };
  },

  download() {
    return async() => {
      const value = await this.followLink('view', { headers: { accept: 'application/yaml' } });

      downloadFile(`${ this.nameDisplay }.yaml`, value.data, 'application/yaml');
    };
  },

  downloadBulk() {
    return async(items) => {
      const files = {};
      const names = [];

      for ( const item of items ) {
        let name = `${ item.nameDisplay }.yaml`;
        let i = 2;

        while ( names.includes(name) ) {
          name = `${ item.nameDisplay }_${ i++ }.yaml`;
        }

        names.push(name);
      }

      await eachLimit(items, 10, (item, idx) => {
        return item.followLink('view', { headers: { accept: 'application/yaml' } } ).then((data) => {
          files[`resources/${ names[idx] }`] = data.data || data;
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

  confirmRemove() {
    return false;
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
        const obj = jsyaml.load(yaml);

        if (mode !== 'edit') {
          this.$dispatch(`cleanForNew`, obj);
        }

        if (obj._type) {
          obj.type = obj._type;
          delete obj._type;
        }
        const out = jsyaml.dump(obj, { skipInvalid: true });

        return out;
      } catch (e) {
        return null;
      }
    };
  },

  cleanForNew() {
    return () => {
      this.$dispatch(`cleanForNew`, this);
    };
  },

  yamlForSave() {
    return (yaml) => {
      try {
        const obj = jsyaml.load(yaml);

        if (obj) {
          if (this._type) {
            obj._type = obj.type;
          }

          return jsyaml.dump(obj);
        }
      } catch (e) {
        return null;
      }
    };
  },

  saveYaml() {
    return async(yaml) => {
      /* Multipart support, but need to know the right cluster and work for management store
        and "apply" seems to only work for create, not update.

      const ary = jsyaml.loadAll(yaml); // will throw on invalid yaml, and return one or more documents (usually one)

      if ( ary.length > 1 ) {
        await this.$rootGetters['currentCluster'].doAction('apply', {
          yaml,
          defaultNamespace: this.metadata.namespace,
        });
      }

      const parsed = ary[0];
      */

      const parsed = jsyaml.load(yaml); // will throw on invalid yaml, and return one or more documents (usually one)

      if ( this.schema?.attributes?.namespaced && !parsed.metadata.namespace ) {
        const err = this.$rootGetters['i18n/t']('resourceYaml.errors.namespaceRequired');

        throw err;
      }

      let res;
      const isCreate = !this.id;
      const headers = {
        'content-type': 'application/yaml',
        accept:         'application/json',
      };

      if ( isCreate ) {
        res = await this.schema.followLink('collection', {
          method:  'POST',
          headers,
          data:   yaml
        });
      } else {
        res = await this.followLink('update', {
          method:  'PUT',
          headers,
          data:   yaml
        });
      }

      await this.$dispatch(`load`, {
        data:     res,
        existing: (isCreate ? this : undefined)
      });

      if (this.isSpoofed) {
        await this.$dispatch('cluster/findAll', { type: this.type, opt: { force: true } }, { root: true });
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
        console.warn(this.t('validation.noType'), data);

        return errors;
      }

      if ( !schema ) {
        // eslint-disable-next-line
        console.warn(this.t('validation.noSchema'), originalType, data);

        return errors;
      }

      const fields = schema.resourceFields || {};
      const keys = Object.keys(fields);
      let field, key, val, displayKey;

      for ( let i = 0 ; i < keys.length ; i++ ) {
        const fieldErrors = [];

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
        if (fieldType === 'boolean') {
          validateBoolean(val, field, displayKey, this.$rootGetters, fieldErrors);
        } else {
          validateLength(val, field, displayKey, this.$rootGetters, fieldErrors);
          validateChars(val, field, displayKey, this.$rootGetters, fieldErrors);
        }

        if (fieldErrors.length > 0) {
          fieldErrors.push(this.t('validation.required', { key: displayKey }));
          errors.push(...fieldErrors);
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

          fieldErrors.push(...validateDnsLikeTypes(val, fieldType, displayKey, this.$rootGetters, fieldErrors));
        }
        errors.push(...fieldErrors);
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
          let pathValue = get(data, path);

          const parsedRules = compact((validators || []));
          let displayKey = path;

          if (rule.translationKey && this.$rootGetters['i18n/exists'](rule.translationKey)) {
            displayKey = this.t(rule.translationKey);
          }

          if (isString(pathValue)) {
            pathValue = pathValue.trim();
          }
          if (requiredIfPath) {
            const reqIfVal = get(data, requiredIfPath);

            if (!isEmpty(reqIfVal) && (isEmpty(pathValue) && pathValue !== 0)) {
              errors.push(this.t('validation.required', { key: displayKey }));
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
            const validatorName = validatorAndArgs.slice(0, 1);
            const validatorArgs = validatorAndArgs.slice(1) || null;
            const validatorExists = Object.prototype.hasOwnProperty.call(CustomValidators, validatorName);

            if (!isEmpty(validatorName) && validatorExists) {
              CustomValidators[validatorName](pathValue, this.$rootGetters, errors, validatorArgs, displayKey, data);
            } else if (!isEmpty(validatorName) && !validatorExists) {
              // eslint-disable-next-line
              console.warn(this.t('validation.custom.missing', { validatorName }));
            }
          });
        });
      }

      return uniq(errors);
    };
  },

  ownersByType() {
    const { metadata:{ ownerReferences = [] } } = this;
    const ownersByType = {};

    ownerReferences.forEach((owner) => {
      if (!ownersByType[owner.kind]) {
        ownersByType[owner.kind] = [owner];
      } else {
        ownersByType[owner.kind].push(owner);
      }
    });

    return ownersByType;
  },

  owners() {
    const owners = [];

    for ( const kind in this.ownersByType) {
      const schema = this.$rootGetters['cluster/schema'](kind);

      if (schema) {
        const type = schema.id;
        const allOfResourceType = this.$rootGetters['cluster/all']( type );

        this.ownersByType[kind].forEach((resource, idx) => {
          const resourceInstance = allOfResourceType.find(resource => resource?.metdata?.uid === resource.uid);

          if (resourceInstance) {
            owners.push(resourceInstance);
          }
        });
      }
    }

    return owners;
  },

  details() {
    return this._details;
  },

  _details() {
    const details = [];

    if (this.owners?.length > 0) {
      details.push({
        label:     this.t('resourceDetail.detailTop.ownerReferences', { count: this.owners.length }),
        formatter: 'ListLinkDetail',
        content:   this.owners.map(owner => ({
          key:   owner.id,
          row:   owner,
          col:   {},
          value: owner.metadata.name
        }))
      });
    }

    if (get(this, 'metadata.deletionTimestamp')) {
      details.push({
        label:         this.t('resourceDetail.detailTop.deleted'),
        formatter:     'LiveDate',
        formatterOpts: { addSuffix: true },
        content:       get(this, 'metadata.deletionTimestamp')
      });
    }

    return details;
  },

  t() {
    return this.$rootGetters['i18n/t'];
  },

  // Returns array of MODELS that own this resource (async, network call)
  findOwners() {
    return () => {
      return this._getRelationship('owner', 'from');
    };
  },

  // Returns array of {type, namespace, id} objects that own this resource (sync)
  getOwners() {
    return () => {
      return this._getRelationship('owner', 'from');
    };
  },

  findOwned() {
    return () => {
      return this._findRelationship('owner', 'to');
    };
  },

  _relationshipsFor() {
    return (rel, direction) => {
      const out = { selectors: [], ids: [] };

      if ( !this.metadata?.relationships?.length ) {
        return out;
      }

      for ( const r of this.metadata.relationships ) {
        if ( rel !== 'any' && r.rel !== rel ) {
          continue;
        }

        if ( !r[`${ direction }Type`] ) {
          continue;
        }

        if ( r.selector ) {
          addObjects(out.selectors, {
            type:      r.toType,
            namespace: r.toNamespace,
            selector:  r.selector
          });
        } else {
          const type = r[`${ direction }Type`];
          let namespace = r[`${ direction }Namespace`];
          let name = r[`${ direction }Id`];

          if ( !namespace && name.includes('/') ) {
            const idx = name.indexOf('/');

            namespace = name.substr(0, idx);
            name = name.substr(idx + 1);
          }

          const id = (namespace ? `${ namespace }/` : '') + name;

          addObject(out.ids, {
            type,
            namespace,
            name,
            id,
          });
        }
      }

      return out;
    };
  },

  _getRelationship() {
    return (rel, direction) => {
      const res = this._relationshipsFor(rel, direction);

      if ( res.selectors?.length ) {
        // eslint-disable-next-line no-console
        console.warn('Sync request for a relationship that is a selector');
      }

      return res.ids || [];
    };
  },

  _findRelationship() {
    return async(rel, direction) => {
      const { selectors, ids } = this._relationshipsFor(rel, direction);
      const out = [];

      for ( const sel of selectors ) {
        const matching = await this.$dispatch('findMatching', sel);

        addObjects(out, matching.data);
      }

      for ( const obj of ids ) {
        const { type, id } = obj;
        let matching = this.$getters['byId'](type, id);

        if ( !matching ) {
          try {
            matching = await this.$dispatch('find', { type, id });
          } catch {
          }
        }
        if (matching) {
          addObject(out, matching);
        }
      }

      return out;
    };
  },

  shortId() {
    const splitId = this.id.split('/');

    return splitId.length > 1 ? splitId[1] : splitId[0];
  }
};
