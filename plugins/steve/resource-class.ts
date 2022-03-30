import jsyaml from 'js-yaml';
import compact from 'lodash/compact';
import forIn from 'lodash/forIn';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import uniq from 'lodash/uniq';
import Vue from 'vue';

import { NORMAN_NAME } from '@/config/labels-annotations';
import {
  _CLONE, _CONFIG, _EDIT, _UNFLAG, _VIEW, _YAML, AS, MODE
} from '@/config/query-params';
import { DEV } from '@/store/prefs';
import { addObject, addObjects, findBy, removeAt } from '@/utils/array';
import CustomValidators from '@/utils/custom-validators';
import { downloadFile, generateZip } from '@/utils/download';
import { clone, get } from '@/utils/object';
import { eachLimit } from '@/utils/promise';
import { sortableNumericSuffix } from '@/utils/sort';
import { coerceStringTypeToScalarType, escapeHtml, ucFirst } from '@/utils/string';
import {
  displayKeyFor, validateBoolean, validateChars, validateDnsLikeTypes, validateLength
} from '@/utils/validators';

// eslint-disable-next-line
import { cleanForNew, normalizeType } from './normalize';
import {
  Action, CloneObject, Conditions, Context, CustomValidationRule, DetailLocation, HttpRequest,
  MapOfStrings, Metadata, RehydrateObject, ResourceDetails, ResourceProperties, ResponseObject,
  STATE_COLOR, StateDetails, StateInfoForTypes, StateList, STATES_ENUM, STATE_TYPE
} from './steveModelTypes';

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

const REMAP_STATE: MapOfStrings = {
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
  waitingfornoderef:        'Waiting for Node Ref'
};

const DEFAULT_COLOR = 'warning';
const DEFAULT_ICON = 'x';

const DEFAULT_WAIT_INTERVAL = 1000;
const DEFAULT_WAIT_TIMEOUT = 30000;

export const STATES: StateList = {
  [STATES_ENUM.IN_USE]:           {
    color: 'success', icon: 'dot-open', label: 'In Use'
  },
  [STATES_ENUM.IN_PROGRESS]:      {
    color: 'info', icon: 'tag', label: 'In Progress'
  },
  [STATES_ENUM.PENDING_ROLLBACK]: {
    color: 'info', icon: 'dot-half', label: 'Pending Rollback'
  },
  [STATES_ENUM.PENDING_UPGRADE]:  {
    color: 'info', icon: 'dot-half', label: 'Pending Update'
  },
  [STATES_ENUM.ABORTED]:            {
    color: 'warning', icon: 'error', label: 'Aborted'
  },
  [STATES_ENUM.ACTIVATING]:         {
    color: 'info', icon: 'tag', label: 'Activating'
  },
  [STATES_ENUM.ACTIVE]:             {
    color: 'success', icon: 'dot-open', label: 'Active'
  },
  [STATES_ENUM.AVAILABLE]:          {
    color: 'success', icon: 'dot-open', label: 'Available'
  },
  [STATES_ENUM.BACKED_UP]:           {
    color: 'success', icon: 'backup', label: 'Backed Up'
  },
  [STATES_ENUM.BOUND]:              {
    color: 'success', icon: 'dot', label: 'Bound'
  },
  [STATES_ENUM.BUILDING]:           {
    color: 'success', icon: 'dot-open', label: 'Building'
  },
  [STATES_ENUM.COMPLETED]:          {
    color: 'success', icon: 'dot', label: 'Completed'
  },
  [STATES_ENUM.CORDONED]:           {
    color: 'info', icon: 'tag', label: 'Cordoned'
  },
  [STATES_ENUM.COUNT]:              {
    color: 'success', icon: 'dot-open', label: 'Count'
  },
  [STATES_ENUM.CREATED]:            {
    color: 'info', icon: 'tag', label: 'Created'
  },
  [STATES_ENUM.CREATING]:           {
    color: 'info', icon: 'tag', label: 'Creating'
  },
  [STATES_ENUM.DEACTIVATING]:       {
    color: 'info', icon: 'adjust', label: 'Deactivating'
  },
  [STATES_ENUM.DEGRADED]:           {
    color: 'warning', icon: 'error', label: 'Degraded'
  },
  [STATES_ENUM.DENIED]:             {
    color: 'error', icon: 'adjust', label: 'Denied'
  },
  [STATES_ENUM.DEPLOYED]:           {
    color: 'success', icon: 'dot-open', label: 'Deployed'
  },
  [STATES_ENUM.DISABLED]:           {
    color: 'warning', icon: 'error', label: 'Disabled'
  },
  [STATES_ENUM.DISCONNECTED]:       {
    color: 'warning', icon: 'error', label: 'Disconnected'
  },
  [STATES_ENUM.DRAINED]:            {
    color: 'info', icon: 'tag', label: 'Drained'
  },
  [STATES_ENUM.DRAINING]:           {
    color: 'warning', icon: 'tag', label: 'Draining'
  },
  [STATES_ENUM.ERR_APPLIED]:         {
    color: 'error', icon: 'error', label: 'Error Applied'
  },
  [STATES_ENUM.ERROR]:              {
    color: 'error', icon: 'error', label: 'Error'
  },
  [STATES_ENUM.ERRORING]:           {
    color: 'error', icon: 'error', label: 'Erroring'
  },
  [STATES_ENUM.ERRORS]:             {
    color: 'error', icon: 'error', label: 'Errors'
  },
  [STATES_ENUM.EXPIRED]:            {
    color: 'warning', icon: 'error', label: 'Expired'
  },
  [STATES_ENUM.FAIL]:               {
    color: 'error', icon: 'error', label: 'Fail'
  },
  [STATES_ENUM.FAILED]:             {
    color: 'error', icon: 'error', label: 'Failed'
  },
  [STATES_ENUM.HEALTHY]:            {
    color: 'success', icon: 'dot-open', label: 'Healthy'
  },
  [STATES_ENUM.INACTIVE]:           {
    color: 'error', icon: 'dot', label: 'Inactive'
  },
  [STATES_ENUM.INITIALIZING]:       {
    color: 'warning', icon: 'error', label: 'Initializing'
  },
  [STATES_ENUM.INPROGRESS]:         {
    color: 'info', icon: 'spinner', label: 'In Progress'
  },
  [STATES_ENUM.INFO]:         {
    color: 'info', icon: 'info', label: 'Info'
  },
  [STATES_ENUM.LOCKED]:             {
    color: 'warning', icon: 'adjust', label: 'Locked'
  },
  [STATES_ENUM.MIGRATING]:          {
    color: 'info', icon: 'info', label: 'Migrated'
  },
  [STATES_ENUM.MISSING]:            {
    color: 'warning', icon: 'adjust', label: 'Missing'
  },
  [STATES_ENUM.MODIFIED]:           {
    color: 'warning', icon: 'edit', label: 'Modified'
  },
  [STATES_ENUM.NOT_APPLICABLE]:      {
    color: 'warning', icon: 'tag', label: 'Not Applicable'
  },
  [STATES_ENUM.NOT_APLLIED]:         {
    color: 'warning', icon: 'tag', label: 'Not Applied'
  },
  [STATES_ENUM.NOT_READY]:           {
    color: 'warning', icon: 'tag', label: 'Not Ready'
  },
  [STATES_ENUM.OFF]:                {
    color: 'darker', icon: 'error', label: 'Off'
  },
  [STATES_ENUM.ON_GOING]:           {
    color: 'info', icon: 'info', label: 'Info'
  },
  [STATES_ENUM.ORPHANED]:           {
    color: 'warning', icon: 'tag', label: 'Orphaned'
  },
  [STATES_ENUM.OTHER]:              {
    color: 'info', icon: 'info', label: 'Other'
  },
  [STATES_ENUM.OUT_OF_SYNC]:          {
    color: 'warning', icon: 'tag', label: 'Out Of Sync'
  },
  [STATES_ENUM.PASS]:               {
    color: 'success', icon: 'dot-dotfill', label: 'Pass'
  },
  [STATES_ENUM.PASSED]:             {
    color: 'success', icon: 'dot-dotfill', label: 'Passed'
  },
  [STATES_ENUM.PAUSED]:             {
    color: 'info', icon: 'info', label: 'Paused'
  },
  [STATES_ENUM.PENDING]:            {
    color: 'info', icon: 'tag', label: 'Pending'
  },
  [STATES_ENUM.PROVISIONING]:       {
    color: 'info', icon: 'dot', label: 'Provisioning'
  },
  [STATES_ENUM.PROVISIONED]:        {
    color: 'success', icon: 'dot', label: 'Provisioned'
  },
  [STATES_ENUM.PURGED]:             {
    color: 'error', icon: 'purged', label: 'Purged'
  },
  [STATES_ENUM.PURGING]:            {
    color: 'info', icon: 'purged', label: 'Purging'
  },
  [STATES_ENUM.READY]:              {
    color: 'success', icon: 'dot-open', label: 'Ready'
  },
  [STATES_ENUM.RECONNECTING]:       {
    color: 'error', icon: 'error', label: 'Reconnecting'
  },
  [STATES_ENUM.REGISTERING]:        {
    color: 'info', icon: 'tag', label: 'Registering'
  },
  [STATES_ENUM.REINITIALIZING]:     {
    color: 'warning', icon: 'error', label: 'Reinitializing'
  },
  [STATES_ENUM.RELEASED]:           {
    color: 'warning', icon: 'error', label: 'Released'
  },
  [STATES_ENUM.REMOVED]:            {
    color: 'error', icon: 'trash', label: 'Removed'
  },
  [STATES_ENUM.REMOVING]:           {
    color: 'info', icon: 'trash', label: 'Removing'
  },
  [STATES_ENUM.REQUESTED]:          {
    color: 'info', icon: 'tag', label: 'Requested'
  },
  [STATES_ENUM.RESTARTING]:         {
    color: 'info', icon: 'adjust', label: 'Restarting'
  },
  [STATES_ENUM.RESTORING]:          {
    color: 'info', icon: 'medicalcross', label: 'Restoring'
  },
  [STATES_ENUM.RESIZING]:           {
    color: 'warning', icon: 'dot', label: 'Resizing'
  },
  [STATES_ENUM.RUNNING]:            {
    color: 'success', icon: 'dot-open', label: 'Running'
  },
  [STATES_ENUM.SKIP]:               {
    color: 'info', icon: 'dot-open', label: 'Skip'
  },
  [STATES_ENUM.SKIPPED]:            {
    color: 'info', icon: 'dot-open', label: 'Skipped'
  },
  [STATES_ENUM.STARTING]:           {
    color: 'info', icon: 'adjust', label: 'Starting'
  },
  [STATES_ENUM.STOPPED]:            {
    color: 'error', icon: 'dot', label: 'Stopped'
  },
  [STATES_ENUM.STOPPING]:           {
    color: 'info', icon: 'adjust', label: 'Stopping'
  },
  [STATES_ENUM.SUCCEEDED]:          {
    color: 'success', icon: 'dot-dotfill', label: 'Succeeded'
  },
  [STATES_ENUM.SUCCESS]:            {
    color: 'success', icon: 'dot-open', label: 'Success'
  },
  [STATES_ENUM.SUPERSEDED]:         {
    color: 'info', icon: 'dot-open', label: 'Superseded'
  },
  [STATES_ENUM.SUSPENDED]:          {
    color: 'info', icon: 'pause', label: 'Suspended'
  },
  [STATES_ENUM.UNAVAILABLE]:        {
    color: 'error', icon: 'error', label: 'Unavailable'
  },
  [STATES_ENUM.UNHEALTHY]:          {
    color: 'error', icon: 'error', label: 'Unhealthy'
  },
  [STATES_ENUM.UNINSTALLED]:        {
    color: 'info', icon: 'trash', label: 'Uninstalled'
  },
  [STATES_ENUM.UNINSTALLING]:       {
    color: 'info', icon: 'trash', label: 'Uninstalling'
  },
  [STATES_ENUM.UNKNOWN]:            {
    color: 'warning', icon: 'x', label: 'Unknown'
  },
  [STATES_ENUM.UNTRIGGERED]:        {
    color: 'success', icon: 'tag', label: 'Untriggered'
  },
  [STATES_ENUM.UPDATING]:           {
    color: 'warning', icon: 'tag', label: 'Updating'
  },
  [STATES_ENUM.WAIT_APPLIED]:        {
    color: 'info', icon: 'tag', label: 'Wait Applied'
  },
  [STATES_ENUM.WAIT_CHECKIN]:        {
    color: 'warning', icon: 'tag', label: 'Wait Checkin'
  },
  [STATES_ENUM.WAITING]:            {
    color: 'info', icon: 'tag', label: 'Waiting'
  },
  [STATES_ENUM.WARNING]:            {
    color: 'warning', icon: 'error', label: 'Warning'
  },
};

export function getStatesByType(): StateInfoForTypes {
  const out = {
    info:    [],
    error:   [],
    success: [],
    warning: [],
    unknown: []
  };

  forIn(STATES, (state: StateDetails, stateKey: STATE_TYPE) => {
    try {
      const color: STATE_COLOR = state.color;

      out[color].push(stateKey);
    } catch (err) {
      out.unknown.push(stateKey);
    }
  });

  return out;
}

const SORT_ORDER = {
  error:    1,
  warning:  2,
  info:     3,
  success:  4,
  ready:    5,
  notready:   6,
  other:    7,
};

export function getStateLabel(state: STATE_TYPE): string {
  const lowercaseState = state.toLowerCase();

  return STATES[lowercaseState] ? STATES[lowercaseState].label : STATES[STATES_ENUM.UNKNOWN].label;
}

export function colorForState(state: STATE_TYPE | string, isError: boolean, isTransitioning: boolean): string {
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

export function stateDisplay(state: STATE_TYPE): string {
  // @TODO use translations
  const key = (state || 'active').toLowerCase();

  if ( REMAP_STATE[key] ) {
    return REMAP_STATE[key];
  }

  return key.split(/-/).map(ucFirst).join('-');
}

export function stateSort(color: string, display: string): string {
  color = color.replace(/^(text|bg)-/, '');

  return `${ SORT_ORDER[color] || SORT_ORDER['other'] } ${ display }`;
}

function maybeFn(val: any): unknown {
  // This either calls the function and returns
  // the result, or returns the function itself. Why?
  // This function and its caller should be refactored
  // to clarify the intent.
  if ( isFunction(val) ) {
    return val(this);
  }

  return val;
}

export default class Resource implements ResourceProperties {
  // Intialize typed properties
  $ctx: Context = {};
  metadata: Metadata = {};
  type = '';
  kind = '';
  id = '';
  uid = '';
  spec: any = {};
  displayName?: string | undefined;
  name?: string | undefined;
  transitioning = false;
  // Use a default state because it must be an enumerated type
  state: STATE_TYPE = 'UNKNOWN';
  // Links can include anything, such as self, update, shell,
  // sshKeys, update, nodeConfig
  links: MapOfStrings = {};
  status: Conditions = { conditions: [] };
  isSpoofed = false;
  _type = '';

  actions: MapOfStrings = {};
  actionLinks: MapOfStrings = {};
  __rehydrate?: RehydrateObject = {};
  __clone?: CloneObject = {};

  constructor(data: any, ctx: Context, rehydrateNamespace = null, setClone = false) {
    // make more specific

    for ( const k in data ) {
      // eslint-disable-next-line
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

  get '$getters'(): any {
    return this.$ctx.getters;
  }

  get '$rootGetters'(): any {
    return this.$ctx.rootGetters;
  }

  get '$dispatch'(): any {
    return this.$ctx.dispatch;
  }

  get '$state'(): any {
    return this.$ctx.state;
  }

  get '$rootState'(): any {
    return this.$ctx.rootState;
  }

  get customValidationRules(): CustomValidationRule[] {
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

  get _key(): string {
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

  get schema(): any {
    return this.$getters['schemaFor'](this.type);
  }

  toString(): string {
    return `[${ this.type }: ${ this.id }]`;
  }

  get typeDisplay(): string {
    const schema = this.schema;

    if ( schema ) {
      return this.$rootGetters['type-map/labelFor'](schema);
    }

    return '?';
  }

  get nameDisplay(): string {
    return this.displayName || this.spec?.displayName || this.metadata?.annotations?.[NORMAN_NAME] || this.name || this.metadata?.name || this.id;
  }

  get nameSort(): string {
    return sortableNumericSuffix(this.nameDisplay).toLowerCase();
  }

  get namespacedName(): string {
    const namespace = this.metadata?.namespace;
    const name = this.nameDisplay;

    if ( namespace ) {
      return `${ namespace }:${ name }`;
    }

    return name;
  }

  get namespacedNameSort(): string {
    return sortableNumericSuffix(this.namespacedName).toLowerCase();
  }

  get groupByLabel(): string | undefined {
    const name = this.metadata?.namespace;
    let out;

    if ( name ) {
      out = this.t('resourceTable.groupLabel.namespace', { name: escapeHtml(name) });
    } else {
      out = this.t('resourceTable.groupLabel.notInANamespace');
    }

    return out;
  }

  setLabels(/* val */): void {
    throw new Error('Implement setLabels in subclass');
  }

  setLabel(/* key, val */): void {
    throw new Error('Implement setLabel in subclass');
  }

  setAnnotations(): void {
    throw new Error('Implement setAnnotations in subclass');
  }

  setAnnotation(): void {
    throw new Error('Implement setAnnotation in subclass');
  }

  // You can override the displayed by providing your own stateDisplay (and possibly using the function exported above)
  get stateDisplay(): string {
    return stateDisplay(this.state);
  }

  get stateColor(): string {
    return colorForState.call(
      this,
      this.state,
      this.stateObj?.error || false,
      this.stateObj?.transitioning || false
    );
  }

  get stateBackground(): string {
    return this.stateColor.replace('text-', 'bg-');
  }

  get stateIcon(): string {
    let trans = false;
    let error = false;

    if ( this.metadata && this.metadata.state ) {
      trans = this.metadata.state.transitioning || false;
      error = this.metadata.state.error || false;
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

  get stateSort(): string {
    return stateSort(this.stateColor, this.stateDisplay);
  }

  get stateDescription(): string {
    const trans = this.stateObj?.transitioning || false;
    const error = this.stateObj?.error || false;
    const message = this.stateObj?.message;

    return trans || error ? ucFirst(message) : '';
  }

  get stateObj(): StateDetails | undefined {
    return this.metadata?.state;
  }

  // ------------------------------------------------------------------

  waitForTestFn(fn: () => any, msg: string, timeoutMs?: number, intervalMs?: number): Promise<Resource> {
    console.log('Starting wait for', msg); // eslint-disable-line no-console

    if ( !timeoutMs ) {
      timeoutMs = DEFAULT_WAIT_TIMEOUT;
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
  }

  waitForState(state: string, timeout: number, interval: number): Promise<Resource> {
    return this.waitForTestFn((): boolean => {
      return (this.state || '').toLowerCase() === state.toLowerCase();
    }, `state=${ state }`, timeout, interval);
  }

  waitForTransition(): Promise<Resource> {
    return this.waitForTestFn(() => {
      return !this.transitioning;
    }, 'transition completion');
  }

  waitForAction(name: string): Promise<Resource> {
    return this.waitForTestFn(() => {
      return this.hasAction(name);
    }, `action=${ name }`);
  }

  waitForLink(name: string): Promise<Resource> {
    return this.waitForTestFn(() => {
      return this.hasLink(name);
    }, `link=${ name }`);
  }

  hasCondition(condition: string): boolean {
    return this.isCondition(condition, '');
  }

  isCondition(condition: string, withStatus = 'True'): boolean {
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

    return (entry || '').toLowerCase() === `${ withStatus }`.toLowerCase();
  }

  waitForCondition(name: string, withStatus = 'True', timeoutMs = DEFAULT_WAIT_TIMEOUT, intervalMs = DEFAULT_WAIT_INTERVAL): Promise<Resource> {
    return this.waitForTestFn(() => {
      return this.isCondition(name, withStatus);
    }, `condition ${ name }=${ withStatus }`, timeoutMs, intervalMs);
  }

  // ------------------------------------------------------------------

  get availableActions(): Action[] {
    const all = this._availableActions;

    // Remove disabled items and consecutive dividers
    let last: boolean | undefined = false;
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
  get _availableActions(): Action[] {
    const all = [
      { divider: true },
      {
        action:  this.canUpdate ? 'goToEdit' : 'goToViewConfig',
        label:   this.t(this.canUpdate ? 'action.edit' : 'action.view'),
        icon:    'icon icon-edit',
        enabled:  this.canCustomEdit,
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
        enabled:  this.canClone && this.canCreate && (this.canCustomEdit || this.canYaml),
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
        enabled:  this.canViewInApi,
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

    return all;
  }

  // ------------------------------------------------------------------

  get canDelete(): boolean {
    return this._canDelete;
  }

  get _canDelete(): boolean {
    return this.hasLink('remove') && this.$rootGetters['type-map/optionsFor'](this.type).isRemovable;
  }

  get canClone(): boolean {
    return true;
  }

  get canUpdate(): boolean {
    return this.hasLink('update') && this.$rootGetters['type-map/optionsFor'](this.type).isEditable;
  }

  get canCustomEdit(): boolean {
    return this.$rootGetters['type-map/hasCustomEdit'](this.type, this.id);
  }

  get canCreate(): boolean {
    if ( this.schema && !this.schema?.collectionMethods.find((x: string) => x.toLowerCase() === 'post') ) {
      return false;
    }

    return this.$rootGetters['type-map/optionsFor'](this.type).isCreatable;
  }

  get canViewInApi(): boolean {
    return this.hasLink('self') && this.$rootGetters['prefs/get'](DEV);
  }

  get canYaml(): boolean {
    return this.hasLink('view');
  }

  get canEditYaml(): boolean {
    return this.schema?.resourceMethods?.find((x: string) => x === 'blocked-PUT') ? false : this.canUpdate;
  }

  // ------------------------------------------------------------------

  hasLink(linkName: string): boolean {
    return !!this.linkFor(linkName);
  }

  linkFor(linkName: string): string {
    return (this.links || {})[linkName];
  }

  followLink(linkName: string, opt: HttpRequest = {}): ResponseObject | Promise<ResponseObject> {
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
  }

  // ------------------------------------------------------------------

  hasAction(actionName: string): boolean {
    return !!this.actionLinkFor(actionName);
  }

  actionLinkFor(actionName: string): string {
    return (this.actions || this.actionLinks || {})[actionName];
  }

  doAction(actionName: string, body: any, opt: any = {}): void {
    return this.$dispatch('resourceAction', {
      resource: this,
      actionName,
      body,
      opt,
    });
  }

  async doActionGrowl(actionName: string, body: any, opt: any = {}): Promise<any> {
    try {
      await this.$dispatch('resourceAction', {
        resource: this,
        actionName,
        body,
        opt,
      });
    } catch (err: any) {
      this.$dispatch('growl/fromError', {
        title: this.$rootGetters['i18n/t']('generic.notification.title.error'),
        err:   err.data || err,
      }, { root: true });
    }
  }

  // ------------------------------------------------------------------

  patch(data: any, opt: HttpRequest = {}): ResponseObject | Promise<ResponseObject> {
    if ( !opt.url ) {
      opt.url = this.linkFor('self');
    }

    opt.method = 'patch';
    opt.headers = opt.headers || {};
    opt.headers['content-type'] = 'application/json-patch+json';
    opt.data = data;

    return this.$dispatch('request', opt);
  }

  save(): Promise<Resource> {
    return this._save(...arguments);
  }

  async _save(opt: HttpRequest = {}): Promise<Resource> {
    delete this.__rehydrate;
    delete this.__clone;
    const forNew = !this.id;

    const errors = await this.validationErrors(this, opt.ignoreFields || []);

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
      const res = await this.$dispatch('request', opt);

      // console.log('### Resource Save', this.type, this.id);

      // Steve sometimes returns Table responses instead of the resource you just saved.. ignore
      if ( res && res.kind !== 'Table') {
        await this.$dispatch('load', { data: res, existing: (forNew ? this : undefined ) });
      }
    } catch (e: any) {
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

  remove(): Promise<void> {
    return this._remove(...arguments);
  }

  async _remove(opt: HttpRequest = {}): Promise<void> {
    if ( !opt.url ) {
      opt.url = this.linkFor('self');
    }

    opt.method = 'delete';

    const res = await this.$dispatch('request', opt);

    if ( res?._status === 204 ) {
      // If there's no body, assume the resource was immediately deleted
      // and drop it from the store as if a remove event happened.
      await this.$dispatch('ws.resource.remove', { data: this });
    }
  }

  // ------------------------------------------------------------------

  currentRoute(): typeof window.$nuxt.$route {
    if ( process.server ) {
      return this.$rootState.$route;
    } else {
      return window.$nuxt.$route;
    }
  }

  currentRouter(): typeof window.$nuxt.$router {
    if ( process.server ) {
      return this.$rootState.$router;
    } else {
      return window.$nuxt.$router;
    }
  }

  get listLocation(): DetailLocation {
    return {
      name:   `c-cluster-product-resource`,
      params: {
        product:   this.$rootGetters['productId'],
        cluster:   this.$rootGetters['clusterId'],
        resource:  this.type,
      }
    };
  }

  get _detailLocation(): DetailLocation {
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

  get detailLocation(): DetailLocation {
    return this._detailLocation;
  }

  goToDetail(): void {
    this.currentRouter().push(this.detailLocation);
  }

  goToClone(moreQuery = {}): void {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]: _CLONE,
      [AS]:   _UNFLAG,
      ...moreQuery
    };

    this.currentRouter().push(location);
  }

  goToEdit(moreQuery = {}): void {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]: _EDIT,
      [AS]:   _UNFLAG,
      ...moreQuery
    };

    this.currentRouter().push(location);
  }

  goToViewConfig(moreQuery = {}): void {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]:  _VIEW,
      [AS]:   _CONFIG,
      ...moreQuery
    };

    this.currentRouter().push(location);
  }

  goToEditYaml(): void {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]: _EDIT,
      [AS]:   _YAML
    };

    this.currentRouter().push(location);
  }

  goToViewYaml(): void {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]: _VIEW,
      [AS]:   _YAML
    };

    this.currentRouter().push(location);
  }

  cloneYaml(moreQuery = {}): void {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]: _CLONE,
      [AS]:   _YAML,
      ...moreQuery
    };

    this.currentRouter().push(location);
  }

  async download(): Promise<void> {
    const value = await this.followLink('view', { headers: { accept: 'application/yaml' } });

    downloadFile(`${ this.nameDisplay }.yaml`, value.data, 'application/yaml');
  }

  async downloadBulk(items: any[]): Promise<void> {
    const files: any = {};
    const names: string[] = [];

    for ( const item of items ) {
      let name = `${ item.nameDisplay }.yaml`;
      let i = 2;

      while ( names.includes(name) ) {
        name = `${ item.nameDisplay }_${ i++ }.yaml`;
      }

      names.push(name);
    }

    await eachLimit(items, 10, (item: any, idx: number) => {
      return item.followLink('view', { headers: { accept: 'application/yaml' } } ).then((data: any) => {
        files[`resources/${ names[idx] }`] = data.data || data;
      });
    });

    const zip = await generateZip(files);

    downloadFile('resources.zip', zip, 'application/zip');
  }

  viewInApi(): void {
    window.open(this.links.self, '_blank');
  }

  promptRemove(resources: Resource[] | Resource): void {
    if ( !resources ) {
      resources = this;
    }

    this.$dispatch('promptRemove', resources);
  }

  get confirmRemove(): boolean {
    return false;
  }

  applyDefaults(): void {
  }

  get urlFromAttrs(): string {
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
  cleanYaml(yaml: string, mode = 'edit'): any {
    try {
      // Returns either a plain object, a string, a number, null or undefined
      // according to https://github.com/nodeca/js-yaml
      const obj: any = jsyaml.load(yaml);

      if (mode !== 'edit') {
        cleanForNew(obj);
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

  cleanForNew(): any {
    cleanForNew(this);
  }

  yamlForSave(yaml: string): any {
    try {
      // Returns either a plain object, a string, a number, null or undefined
      // according to https://github.com/nodeca/js-yaml
      const obj: any = jsyaml.load(yaml);

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

  async saveYaml(yaml: string): Promise<void> {
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

    const parsed: any = jsyaml.load(yaml); // will throw on invalid yaml, and return one or more documents (usually one)

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
  }

  validationErrors(data: any, ignoreFields: string[]): string[] {
    const errors: string[] = [];
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
      const fieldErrors: string[] = [];

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

    let customValidationRules: CustomValidationRule[] | Function = this.customValidationRules;

    if (!isEmpty(customValidationRules)) {
      if (isFunction(customValidationRules)) {
        // Whether customValdationRules is a function or an array to begin with,
        // we assume it's an array after this line.
        // eslint-disable-next-line
        customValidationRules = customValidationRules();
      }

      // eslint-disable-next-line
      customValidationRules.forEach((rule: CustomValidationRule) => {
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

        parsedRules.forEach((validator: string) => {
          const validatorAndArgs = validator.split(':');
          const validatorName = validatorAndArgs.slice(0, 1)[0];
          const validatorArgs = validatorAndArgs.slice(1) || null;
          const validatorExists = Object.prototype.hasOwnProperty.call(CustomValidators, validatorName);

          if (!isEmpty(validatorName) && validatorExists) {
            // eslint-disable-next-line
            CustomValidators[validatorName](pathValue, this.$rootGetters, errors, validatorArgs, displayKey, data);
          } else if (!isEmpty(validatorName) && !validatorExists) {
            // eslint-disable-next-line
            console.warn(this.t('validation.custom.missing', { validatorName }));
          }
        });
      });
    }

    return uniq(errors);
  }

  get ownersByType(): any[] {
    const { metadata:{ ownerReferences = [] } } = this;
    const ownersByType: any = {};

    ownerReferences.forEach((owner: Resource) => {
      if (!ownersByType[owner.kind]) {
        ownersByType[owner.kind] = [owner];
      } else {
        ownersByType[owner.kind].push(owner);
      }
    });

    return ownersByType;
  }

  get owners(): Resource[] {
    const owners: Resource[] = [];

    for ( const kind in this.ownersByType) {
      const schema = this.$rootGetters['cluster/schema'](kind);

      if (schema) {
        const type = schema.id;
        const allOfResourceType: Resource[] = this.$rootGetters['cluster/all']( type );

        this.ownersByType[kind].forEach((resource: Resource) => {
          const resourceInstance = allOfResourceType.find(resourceByType => resourceByType?.metadata?.uid === resource.uid);

          if (resourceInstance) {
            owners.push(resourceInstance);
          }
        });
      }
    }

    return owners;
  }

  get details(): ResourceDetails[] {
    return this._details;
  }

  get _details(): ResourceDetails[] {
    const details: ResourceDetails[] = [];

    if (this.owners?.length > 0) {
      const ownerDetails: ResourceDetails = {
        label:     this.t('resourceDetail.detailTop.ownerReferences', { count: this.owners.length }),
        formatter: 'ListLinkDetail',
        content:   this.owners.map(owner => ({
          key:   owner.id,
          row:   owner,
          col:   {},
          value: owner.metadata.name
        }))
      };

      details.push(ownerDetails);
    }

    if (get(this, 'metadata.deletionTimestamp')) {
      const ownerDetails: ResourceDetails = {
        label:         this.t('resourceDetail.detailTop.deleted'),
        formatter:     'LiveDate',
        formatterOpts: { addSuffix: true },
        content:       get(this, 'metadata.deletionTimestamp')
      };

      details.push(ownerDetails);
    }

    return details;
  }

  get t(): Function {
    return this.$rootGetters['i18n/t'];
  }

  // Returns array of MODELS that own this resource (async, network call)
  findOwners(): Resource[] {
    return this._getRelationship('owner', 'from');
  }

  // Returns array of {type, namespace, id} objects that own this resource (sync)
  getOwners(): Resource[] {
    return this._getRelationship('owner', 'from');
  }

  findOwned(): Promise<Resource[]> {
    return this._findRelationship('owner', 'to');
  }

  // Didn't create types for relationships
  // because their keys are dynamically
  // generated.
  _relationshipsFor(rel: string, direction: string) {
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

  // Didn't create types for relationships
  // because their keys are dynamically
  // generated.
  _getRelationship(rel: string, direction: string) {
    const res = this._relationshipsFor(rel, direction);

    if ( res.selectors?.length ) {
      // eslint-disable-next-line no-console
      console.warn('Sync request for a relationship that is a selector');
    }

    return res.ids || [];
  }

  // Didn't create types for relationships
  // because their keys are dynamically
  // generated.
  async _findRelationship(rel: string, direction: string) {
    const { selectors, ids } = this._relationshipsFor(rel, direction);
    const out: Resource[] = [];

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

  get shortId(): string {
    const splitId = this.id.split('/');

    return splitId.length > 1 ? splitId[1] : splitId[0];
  }

  toJSON(): any {
    const out: any = {};
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
}
