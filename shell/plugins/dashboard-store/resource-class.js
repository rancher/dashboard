import {
  _CLONE,
  _CONFIG,
  _EDIT,
  _UNFLAG,
  _VIEW,
  _YAML,
  AS,
  MODE
} from '@shell/config/query-params';
import {
  maybeFn,
  _getStateObj,
  _getStateDisplay,
  _getStateSort,
  _getNameDisplay,
  _getCreationTimestamp,
  _getGroupByLabel,
  _getTypeDisplay,
  _getNameSort,
  _getStateColor,
  _getNamespacedNameSort,
  _getNamespacedName,
  colorForState,
  _getSchema
} from '@shell/plugins/steve/resourceUtils/resource-class';
import { VIEW_IN_API } from '@shell/store/prefs';
import { addObject, addObjects, findBy, removeAt } from '@shell/utils/array';
import CustomValidators from '@shell/utils/custom-validators';
import { downloadFile, generateZip } from '@shell/utils/download';
import { clone, get } from '@shell/utils/object';
import { eachLimit } from '@shell/utils/promise';
import { coerceStringTypeToScalarType, ucFirst } from '@shell/utils/string';
import {
  displayKeyFor,
  validateBoolean,
  validateChars,
  validateDnsLikeTypes,
  validateLength,
} from '@shell/utils/validators';
import formRulesGenerator from '@shell/utils/validators/formRules/index';
import { waitFor } from '@shell/utils/async';
import jsyaml from 'js-yaml';
import compact from 'lodash/compact';
import forIn from 'lodash/forIn';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import uniq from 'lodash/uniq';
import Vue from 'vue';

import { normalizeType } from './normalize';

import { ExtensionPoint, ActionLocation } from '@shell/core/types';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import {
  DEFAULT_ICON,
  DEFAULT_WAIT_INTERVAL,
  DEFAULT_WAIT_TMIMEOUT,
  DNS_LIKE_TYPES,
  STATES,
  STATES_ENUM,
  STRING_LIKE_TYPES,
} from '@shell/plugins/dashboard-store/resource-constants';

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

export function getStateLabel(state) {
  const lowercaseState = state.toLowerCase();

  return STATES[lowercaseState] ? STATES[lowercaseState].label : STATES[STATES_ENUM.UNKNOWN].label;
}

export function stateDisplay(state) {
  return _getStateDisplay({ state });
}

export function stateSort(stateColor, stateDisplay) {
  return _getStateSort({ stateColor, stateDisplay });
}

export default class Resource {
  constructor(data, ctx, rehydrateNamespace = null, setClone = false) {
    for ( const k in data ) {
      this[k] = data[k];
    }

    Object.defineProperty(this, '$ctx', {
      value:      ctx,
      enumerable: false,
    });

    if ( rehydrateNamespace ) {
      Object.defineProperty(this, '__rehydrate', {
        value:        rehydrateNamespace,
        enumerable:   true,
        configurable: true
      });
    }

    if ( setClone ) {
      Object.defineProperty(this, '__clone', {
        value:        true,
        enumerable:   true,
        configurable: true,
        writable:     true
      });
    }
  }

  get '$getters'() {
    return this.$ctx.getters;
  }

  get '$rootGetters'() {
    return this.$ctx.rootGetters;
  }

  get '$dispatch'() {
    return this.$ctx.dispatch;
  }

  get '$state'() {
    return this.$ctx.state;
  }

  get '$rootState'() {
    return this.$ctx.rootState;
  }

  get customValidationRules() {
    return [
      /**
       * Essentially a fake schema object with additional params to extend validation
       *
       * @param {nullable} Value is nullable
       * @param {path} Path on the resource to the value to validate
       * @param {required} Value required
       * @param {requiredIf} Value required if value at path not empty
       * @param {translationKey} Human readable display key for param in path e.g. metadata.name === Name
       * @param {type} Type of field to validate
       * @param {validators} array of strings where item is name of exported validator function in custom-validators, args can be passed by prepending args separated by colon. e.g maxLength:63
       */
      /* {
        nullable:       false,
        path:           'spec.ports',
        required:       true,
        type:           'array',
        validators:     ['servicePort'],
      } */
    ];
  }

  get _key() {
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
  }

  get schema() {
    return _getSchema(this, { schemaFor: this.$getters['schemaFor'] });
  }

  toString() {
    return `[${ this.type }: ${ this.id }]`;
  }

  get typeDisplay() {
    return _getTypeDisplay(this, { labelFor: this.$rootGetters['type-map/labelFor'] });
  }

  get nameDisplay() {
    return _getNameDisplay(this);
  }

  get nameSort() {
    return _getNameSort(this);
  }

  get namespacedName() {
    return _getNamespacedName(this);
  }

  get namespacedNameSort() {
    return _getNamespacedNameSort(this);
  }

  get groupByLabel() {
    return _getGroupByLabel(this, { translate: this.$rootGetters['i18n/t'] });
  }

  setLabels(/* val */) {
    throw new Error('Implement setLabels in subclass');
  }

  setLabel(/* key, val */) {
    throw new Error('Implement setLabel in subclass');
  }

  setAnnotations(val) {
    throw new Error('Implement setAnnotations in subclass');
  }

  setAnnotation(key, val) {
    throw new Error('Implement setAnnotation in subclass');
  }

  // You can override the displayed by providing your own stateDisplay (and possibly using the function exported above)
  get stateDisplay() {
    return _getStateDisplay(this);
  }

  get stateColor() {
    return _getStateColor(this, {
      colorForStateInModel: colorForState.call(
        this,
        this.state,
        this.stateObj?.error,
        this.stateObj?.transitioning
      )
    });
  }

  get stateBackground() {
    return this.stateColor.replace('text-', 'bg-');
  }

  get stateIcon() {
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
  }

  get stateSort() {
    return _getStateSort(this);
  }

  get stateDescription() {
    const trans = this.stateObj?.transitioning || false;
    const error = this.stateObj?.error || false;
    const message = this.stateObj?.message;

    return trans || error ? ucFirst(message) : '';
  }

  get stateObj() {
    return _getStateObj(this);
  }

  // ------------------------------------------------------------------

  waitForTestFn(fn, msg, timeoutMs, intervalMs) {
    return waitFor(() => fn.apply(this), msg, timeoutMs || DEFAULT_WAIT_TMIMEOUT, intervalMs || DEFAULT_WAIT_INTERVAL, true);
  }

  waitForState(state, timeout, interval) {
    return this.waitForTestFn(() => {
      return (this.state || '').toLowerCase() === state.toLowerCase();
    }, `state=${ state }`, timeout, interval);
  }

  waitForTransition() {
    return this.waitForTestFn(() => {
      return !this.transitioning;
    }, 'transition completion', undefined, undefined);
  }

  waitForAction(name) {
    return this.waitForTestFn(() => {
      return this.hasAction(name);
    }, `action=${ name }`, undefined, undefined);
  }

  waitForLink(name) {
    return this.waitForTestFn(() => {
      return this.hasLink(name);
    }, `link=${ name }`, undefined, undefined);
  }

  hasCondition(condition) {
    return this.isCondition(condition, null);
  }

  isCondition(condition, withStatus = 'True') {
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
  }

  waitForCondition(name, withStatus = 'True', timeoutMs = DEFAULT_WAIT_TMIMEOUT, intervalMs = DEFAULT_WAIT_INTERVAL) {
    return this.waitForTestFn(() => {
      return this.isCondition(name, withStatus);
    }, `condition ${ name }=${ withStatus }`, timeoutMs, intervalMs);
  }

  // ------------------------------------------------------------------

  get availableActions() {
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
  }

  // You can add custom actions by overriding your own availableActions (and probably reading super._availableActions)
  get _availableActions() {
    // get menu actions available by plugins configuration
    const currentRoute = this.currentRouter().app._route;
    const extensionMenuActions = getApplicableExtensionEnhancements(this.$rootState, ExtensionPoint.ACTION, ActionLocation.TABLE, currentRoute, this);

    let all = [
      { divider: true },
      {
        action:  this.canUpdate ? 'goToEdit' : 'goToViewConfig',
        label:   this.t(this.canUpdate ? 'action.edit' : 'action.view'),
        icon:    'icon icon-edit',
        enabled: this.canCustomEdit,
      },
      {
        action:  this.canEditYaml ? 'goToEditYaml' : 'goToViewYaml',
        label:   this.t(this.canEditYaml ? 'action.editYaml' : 'action.viewYaml'),
        icon:    'icon icon-file',
        enabled: this.canYaml,
      },
      {
        action:  (this.canCustomEdit ? 'goToClone' : 'cloneYaml'),
        label:   this.t('action.clone'),
        icon:    'icon icon-copy',
        enabled: this.canClone && this.canCreate && (this.canCustomEdit || this.canYaml),
      },
      { divider: true },
      {
        action:     'download',
        label:      this.t('action.download'),
        icon:       'icon icon-download',
        bulkable:   true,
        bulkAction: 'downloadBulk',
        enabled:    this.canYaml,
        weight:     -9,
      },
      {
        action:  'viewInApi',
        label:   this.t('action.viewInApi'),
        icon:    'icon icon-external-link',
        enabled: this.canViewInApi,
      },
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
    ];

    // Extension actions get added to the end, so add a divider if there are any
    if (extensionMenuActions.length) {
      // Add a divider first
      all.push({ divider: true });
      all = all.concat(extensionMenuActions);
    }

    return all;
  }

  // ------------------------------------------------------------------

  get canDelete() {
    return this._canDelete;
  }

  get _canDelete() {
    return this.hasLink('remove') && this.$rootGetters['type-map/optionsFor'](this.type).isRemovable;
  }

  get canClone() {
    return true;
  }

  get canUpdate() {
    return this.hasLink('update') && this.$rootGetters['type-map/optionsFor'](this.type).isEditable;
  }

  get canCustomEdit() {
    return this.$rootGetters['type-map/hasCustomEdit'](this.type, this.id);
  }

  get canCreate() {
    if ( this.schema && !this.schema?.collectionMethods.find(x => x.toLowerCase() === 'post') ) {
      return false;
    }

    return this.$rootGetters['type-map/optionsFor'](this.type).isCreatable;
  }

  get canViewInApi() {
    return this.hasLink('self') && this.$rootGetters['prefs/get'](VIEW_IN_API);
  }

  get canYaml() {
    return this.hasLink('view');
  }

  get canEditYaml() {
    return this.schema?.resourceMethods?.find(x => x === 'blocked-PUT') ? false : this.canUpdate;
  }

  // ------------------------------------------------------------------

  hasLink(linkName) {
    return !!this.linkFor(linkName);
  }

  linkFor(linkName) {
    return (this.links || {})[linkName];
  }

  followLink(linkName, opt = {}) {
    if ( !opt.url ) {
      opt.url = (this.links || {})[linkName];
    }

    if ( opt.urlSuffix ) {
      opt.url += opt.urlSuffix;
    }

    if ( !opt.url ) {
      throw new Error(`Unknown link ${ linkName } on ${ this.type } ${ this.id }`);
    }

    return this.$dispatch('request', { opt } );
  }

  // ------------------------------------------------------------------

  hasAction(actionName) {
    return !!this.actionLinkFor(actionName);
  }

  actionLinkFor(actionName) {
    return (this.actions || this.actionLinks || {})[actionName];
  }

  doAction(actionName, body, opt = {}) {
    return this.$dispatch('resourceAction', {
      resource: this,
      actionName,
      body,
      opt,
    });
  }

  async doActionGrowl(actionName, body, opt = {}) {
    try {
      await this.$dispatch('resourceAction', {
        resource: this,
        actionName,
        body,
        opt,
      });
    } catch (err) {
      this.$dispatch('growl/fromError', {
        title: this.$rootGetters['i18n/t']('generic.notification.title.error'),
        err:   err.data || err,
      }, { root: true });
    }
  }

  // ------------------------------------------------------------------

  patch(data, opt = {}, merge = false, alertOnError = false) {
    if ( !opt.url ) {
      // Workaround for the links not being correct - view link is the only one that seems correct
      opt.url = this.linkFor('view') || this.linkFor('self');
    }

    opt.method = 'patch';
    opt.headers = opt.headers || {};

    if (!opt.headers['content-type']) {
      const contentType = merge ? 'application/strategic-merge-patch+json' : 'application/json-patch+json';

      opt.headers['content-type'] = contentType;
    }
    opt.data = data;

    const dispatch = this.$dispatch('request', { opt, type: this.type } );

    return !alertOnError ? dispatch : dispatch.catch((e) => {
      const title = this.t('resource.errors.update', { name: this.name });

      console.error(title, e); // eslint-disable-line no-console

      this.$dispatch('growl/error', {
        title,
        message: e?.message,
        timeout: 5000
      }, { root: true });
    });
  }

  save() {
    return this._save(...arguments);
  }

  /**
   * Allow to handle the response of the save request
   * @param {*} res Full request response
   */
  processSaveResponse(res) { }

  async _save(opt = {}) {
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

    // handle "replace" opt as a query param _replace=true for norman PUT requests
    if (opt?.replace && opt.method === 'put') {
      const argParam = opt.url.includes('?') ? '&' : '?';

      opt.url = `${ opt.url }${ argParam }_replace=true`;
      delete opt.replace;
    }

    try {
      const res = await this.$dispatch('request', { opt, type: this.type } );

      // Allow to process response independently from the related models
      this.processSaveResponse(res);

      // Steve sometimes returns Table responses instead of the resource you just saved.. ignore
      if ( res && res.kind !== 'Table') {
        // TODO: RC https://github.com/rancher/dashboard/issues/8420
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
  }

  remove() {
    return this._remove(...arguments);
  }

  async _remove(opt = {}) {
    if ( !opt.url ) {
      opt.url = this.linkFor('self');
    }

    opt.method = 'delete';

    const res = await this.$dispatch('request', { opt, type: this.type } );

    if ( res?._status === 204 ) {
      // TODO: RC https://github.com/rancher/dashboard/issues/8420
      // If there's no body, assume the resource was immediately deleted
      // and drop it from the store as if a remove event happened.
      await this.$dispatch('ws.resource.remove', { data: this });
    }
  }

  // ------------------------------------------------------------------

  currentRoute() {
    if ( process.server ) {
      return this.$rootState.$route;
    } else {
      return window.$nuxt.$route;
    }
  }

  currentRouter() {
    if ( process.server ) {
      return this.$rootState.$router;
    } else {
      return window.$nuxt.$router;
    }
  }

  get listLocation() {
    return {
      name:   `c-cluster-product-resource`,
      params: {
        product:  this.$rootGetters['productId'],
        cluster:  this.$rootGetters['clusterId'],
        resource: this.type,
      }
    };
  }

  get _detailLocation() {
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
  }

  get detailLocation() {
    return this._detailLocation;
  }

  goToDetail() {
    this.currentRouter().push(this.detailLocation);
  }

  goToClone(moreQuery = {}) {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]: _CLONE,
      [AS]:   _UNFLAG,
      ...moreQuery
    };

    this.currentRouter().push(location);
  }

  goToEdit(moreQuery = {}) {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]: _EDIT,
      [AS]:   _UNFLAG,
      ...moreQuery
    };

    this.currentRouter().push(location);
  }

  goToViewConfig(moreQuery = {}) {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]: _VIEW,
      [AS]:   _CONFIG,
      ...moreQuery
    };

    this.currentRouter().push(location);
  }

  goToEditYaml() {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]: _EDIT,
      [AS]:   _YAML
    };

    this.currentRouter().push(location);
  }

  goToViewYaml() {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]: _VIEW,
      [AS]:   _YAML
    };

    this.currentRouter().push(location);
  }

  cloneYaml(moreQuery = {}) {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]: _CLONE,
      [AS]:   _YAML,
      ...moreQuery
    };

    this.currentRouter().push(location);
  }

  async download() {
    const value = await this.followLink('view', { headers: { accept: 'application/yaml' } });
    const data = await this.$dispatch('cleanForDownload', value.data);

    downloadFile(`${ this.nameDisplay }.yaml`, data, 'application/yaml');
  }

  async downloadBulk(items) {
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
      return item.followLink('view', { headers: { accept: 'application/yaml' } } ).then(async(data) => {
        const yaml = data.data || data;
        const cleanedYaml = await this.$dispatch('cleanForDownload', yaml);

        files[`resources/${ names[idx] }`] = cleanedYaml;
      });
    });

    const zip = await generateZip(files);

    downloadFile('resources.zip', zip, 'application/zip');
  }

  viewInApi() {
    window.open(this.links.self, '_blank');
  }

  promptRemove(resources) {
    if ( !resources ) {
      resources = this;
    }

    this.$dispatch('promptRemove', resources);
  }

  get confirmRemove() {
    return false;
  }

  applyDefaults() {
  }

  get urlFromAttrs() {
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
  }

  // convert yaml to object, clean for new if creating/cloning
  // map _type to type
  cleanYaml(yaml, mode = 'edit') {
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
  }

  cleanForNew() {
    this.$dispatch(`cleanForNew`, this);
  }

  cleanForDiff() {
    this.$dispatch(`cleanForDiff`, this.toJSON());
  }

  yamlForSave(yaml) {
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
  }

  async saveYaml(yaml) {
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
        method: 'POST',
        headers,
        data:   yaml
      });
    } else {
      res = await this.followLink('update', {
        method: 'PUT',
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
  }

  get modelValidationRules() {
    const rules = [];

    const customValidationRulesets = this?.customValidationRules
      .filter(rule => !!rule.validators || !!rule.required)
      .map((rule) => {
        const formRules = formRulesGenerator(this.t, { displayKey: rule?.translationKey ? this.t(rule.translationKey) : 'Value' });

        return {
          path:  rule.path,
          rules: [
            ...(rule.validators || []),
            ...rule.required ? ['required'] : [],
            ...['dnsLabel', 'dnsLabelRestricted', 'hostname'].includes(rule.type) ? [rule.type] : []
          ]
            .map((rule) => {
              if (rule.includes(':')) {
                const [ruleKey, ruleArg] = rule.split(':');

                return formRules[ruleKey](ruleArg);
              }

              return formRules[rule];
            }
            )
            .filter(rule => !!rule)
        };
      })
      .filter(ruleset => ruleset.rules.length > 0);

    rules.push(...customValidationRulesets);

    return rules;
  }

  customValidationErrors(data, ignorePaths = []) {
    const errors = [];

    let { customValidationRules } = this;

    if (!isEmpty(customValidationRules)) {
      if (isFunction(customValidationRules)) {
        customValidationRules = customValidationRules();
      }

      customValidationRules.filter(rule => !ignorePaths.includes(rule.path)).forEach((rule) => {
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
            // Check if validator is imported from plugin
            const pluginValidator = this.$rootState.$plugin?.getValidator(validatorName);

            if (pluginValidator) {
              pluginValidator(pathValue, this.$rootGetters, errors, validatorArgs, displayKey, data);
            } else {
              // eslint-disable-next-line
              console.warn(this.t('validation.custom.missing', { validatorName }));
            }
          }
        });
      });
    }

    return errors;
  }

  validationErrors(data = this, ignoreFields) {
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
      // console.warn(this.t('validation.noSchema'), originalType, data);

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

    return uniq([...errors, ...this.customValidationErrors(data)]);
  }

  get ownersByType() {
    const ownerReferences = this.metadata?.ownerReferences || [];
    const ownersByType = {};

    ownerReferences.forEach((owner) => {
      if (!ownersByType[owner.kind]) {
        ownersByType[owner.kind] = [owner];
      } else {
        ownersByType[owner.kind].push(owner);
      }
    });

    return ownersByType;
  }

  get owners() {
    const owners = [];

    for ( const kind in this.ownersByType) {
      const schema = this.$rootGetters['cluster/schema'](kind);

      if (schema) {
        const type = schema.id;
        const allOfResourceType = this.$rootGetters['cluster/all']( type );

        this.ownersByType[kind].forEach((resource, idx) => {
          const resourceInstance = allOfResourceType.find(resourceByType => resourceByType?.metadata?.uid === resource.uid);

          if (resourceInstance) {
            owners.push(resourceInstance);
          }
        });
      }
    }

    return owners;
  }

  get details() {
    return this._details;
  }

  get _details() {
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
  }

  get t() {
    return this.$rootGetters['i18n/t'];
  }

  // Returns array of MODELS that own this resource (async, network call)
  findOwners() {
    return this._getRelationship('owner', 'from');
  }

  // Returns array of {type, namespace, id} objects that own this resource (sync)
  getOwners() {
    return this._getRelationship('owner', 'from');
  }

  findOwned() {
    return this._findRelationship('owner', 'to');
  }

  _relationshipsFor(rel, direction) {
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
  }

  _getRelationship(rel, direction) {
    const res = this._relationshipsFor(rel, direction);

    if ( res.selectors?.length ) {
      // eslint-disable-next-line no-console
      console.warn('Sync request for a relationship that is a selector');
    }

    return res.ids || [];
  }

  async _findRelationship(rel, direction) {
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
  }

  get shortId() {
    const splitId = this.id.split('/');

    return splitId.length > 1 ? splitId[1] : splitId[0];
  }

  // this looks to be used during a store's rehydrate
  toJSON() {
    const out = {};
    const keys = Object.keys(this);

    for ( const k of keys ) {
      if ( this[k]?.toJSON ) {
        out[k] = this[k].toJSON();
      } else {
        out[k] = clone(this[k]);
      }
    }

    return out;
  }

  // toJSON() was already taken and I don't want to change its logic
  // fully converts a resource into a plain json object, including it's getters
  fullResourceToJSON() {
    const resourcePrototype = Object.getPrototypeOf(this);
    const resourcePropDescriptors = Object.getOwnPropertyDescriptors(resourcePrototype);
    const resourcePropKeys = Object.getOwnPropertyNames(resourcePrototype);
    const propIsGetter = key => typeof resourcePropDescriptors[key].get === 'function' &&
      !resourcePropDescriptors[key].value &&
      key[0] !== 0;

    return {
      ...this.toJSON(),
      ...resourcePropKeys
        .reduce((acc, resourcePropKey) => ({
          ...acc,
          ...(propIsGetter(resourcePropKey) ? { [resourcePropKey]: this[resourcePropKey] } : {})
        }), {})
    };
  }

  get creationTimestamp() {
    return _getCreationTimestamp(this);
  }
}
